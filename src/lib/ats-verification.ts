import type {
  VerificationEvidence,
  VerificationResult,
} from "./verification-types";

import {
  readResponseText,
  safeFetchPublicUrl,
  validatePublicHttpUrl,
} from "./url-safety";

export type AtsTarget =
  | {
      provider: "greenhouse";
      boardToken: string;
      postingId: string;
      apiUrl: string;
    }
  | {
      provider: "lever";
      site: string;
      postingId: string;
      apiUrl: string;
    };

const TOKEN_PATTERN = /^[a-z0-9_-]+$/i;
const POSTING_ID_PATTERN = /^[a-z0-9-]+$/i;

function cleanToken(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const decoded = decodeURIComponent(value);

  return TOKEN_PATTERN.test(decoded)
    ? decoded
    : null;
}

function cleanPostingId(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const decoded = decodeURIComponent(value);

  return POSTING_ID_PATTERN.test(decoded)
    ? decoded
    : null;
}

export function parseAtsUrl(
  rawValue: string,
): AtsTarget | null {
  const url = validatePublicHttpUrl(rawValue);
  const hostname = url.hostname.toLowerCase();

  const segments = url.pathname
    .split("/")
    .filter(Boolean);

  if (
    hostname === "boards.greenhouse.io" ||
    hostname === "job-boards.greenhouse.io"
  ) {
    const jobsIndex = segments.indexOf("jobs");

    if (jobsIndex > 0) {
      const boardToken = cleanToken(
        segments[jobsIndex - 1],
      );

      const postingId = cleanPostingId(
        segments[jobsIndex + 1],
      );

      if (boardToken && postingId) {
        return {
          provider: "greenhouse",
          boardToken,
          postingId,
          apiUrl:
            `https://boards-api.greenhouse.io/v1/boards/` +
            `${encodeURIComponent(boardToken)}/jobs/` +
            `${encodeURIComponent(postingId)}`,
        };
      }
    }

    const boardToken = cleanToken(
      url.searchParams.get("for"),
    );

    const postingId = cleanPostingId(
      url.searchParams.get("token"),
    );

    if (boardToken && postingId) {
      return {
        provider: "greenhouse",
        boardToken,
        postingId,
        apiUrl:
          `https://boards-api.greenhouse.io/v1/boards/` +
          `${encodeURIComponent(boardToken)}/jobs/` +
          `${encodeURIComponent(postingId)}`,
      };
    }
  }

  if (
    hostname === "jobs.lever.co" ||
    hostname === "jobs.eu.lever.co"
  ) {
    const site = cleanToken(segments[0]);
    const postingId = cleanPostingId(segments[1]);

    if (site && postingId) {
      const apiHostname =
        hostname === "jobs.eu.lever.co"
          ? "api.eu.lever.co"
          : "api.lever.co";

      return {
        provider: "lever",
        site,
        postingId,
        apiUrl:
          `https://${apiHostname}/v0/postings/` +
          `${encodeURIComponent(site)}/` +
          `${encodeURIComponent(postingId)}?mode=json`,
      };
    }
  }

  return null;
}

function textValue(
  value: unknown,
): string | undefined {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value.trim()
    : undefined;
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function findJobPosting(
  value: unknown,
): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findJobPosting(item);

      if (result) {
        return result;
      }
    }

    return null;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const typeValue = record["@type"];

  const isJobPosting =
    typeValue === "JobPosting" ||
    (Array.isArray(typeValue) &&
      typeValue.includes("JobPosting"));

  if (isJobPosting) {
    return record;
  }

  for (const nestedValue of Object.values(record)) {
    const result = findJobPosting(nestedValue);

    if (result) {
      return result;
    }
  }

  return null;
}

function extractStructuredJobPosting(
  html: string,
): Record<string, unknown> | null {
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const jsonText = match[1].trim();

    if (!jsonText) {
      continue;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const jobPosting = findJobPosting(parsed);

      if (jobPosting) {
        return jobPosting;
      }
    } catch {
      // Ignore malformed JSON-LD and continue.
    }
  }

  return null;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(
    /<title\b[^>]*>([\s\S]*?)<\/title>/i,
  );

  return match
    ? decodeHtmlText(match[1])
    : undefined;
}

function extractCanonicalUrl(
  html: string,
  baseUrl: string,
): string | undefined {
  const relFirst = html.match(
    /<link\b[^>]*rel=["'][^"']*\bcanonical\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i,
  );

  const hrefFirst = html.match(
    /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*\bcanonical\b[^"']*["'][^>]*>/i,
  );

  const rawCanonical =
    relFirst?.[1] ?? hrefFirst?.[1];

  if (!rawCanonical) {
    return undefined;
  }

  try {
    return new URL(rawCanonical, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function extractIdentifier(
  value: unknown,
): string | undefined {
  if (typeof value === "string") {
    return textValue(value);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const record = value as Record<string, unknown>;

    return (
      textValue(record.value) ??
      textValue(record.name) ??
      textValue(record.propertyID)
    );
  }

  return undefined;
}

function extractCompany(
  value: unknown,
): string | undefined {
  if (
    value &&
    typeof value === "object"
  ) {
    const record = value as Record<string, unknown>;

    return textValue(record.name);
  }

  return undefined;
}

function extractLocation(
  value: unknown,
): string | undefined {
  const firstLocation = Array.isArray(value)
    ? value[0]
    : value;

  if (
    !firstLocation ||
    typeof firstLocation !== "object"
  ) {
    return undefined;
  }

  const locationRecord =
    firstLocation as Record<string, unknown>;

  const address = locationRecord.address;

  if (typeof address === "string") {
    return textValue(address);
  }

  if (
    !address ||
    typeof address !== "object"
  ) {
    return textValue(locationRecord.name);
  }

  const addressRecord =
    address as Record<string, unknown>;

  const parts = [
    textValue(addressRecord.addressLocality),
    textValue(addressRecord.addressRegion),
    textValue(addressRecord.addressCountry),
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(", ")
    : undefined;
}

function createNotFoundResult(
  requestedUrl: string,
  provider: "greenhouse" | "lever",
  postingId: string,
  httpStatus: number,
): VerificationResult {
  return {
    status: "not-found",
    provider,
    checkedAt: new Date().toISOString(),
    requestedUrl,
    httpStatus,
    officialSource: true,
    listingActive: false,
    postingId,
    evidence: [
      {
        label: "Public ATS endpoint",
        value:
          "The supported applicant-tracking endpoint did not return an active public posting.",
        kind: "warning",
      },
    ],
    warnings: [
      "The listing may have expired, been removed, or contain an incorrect posting ID.",
    ],
  };
}

async function verifyGreenhouse(
  requestedUrl: string,
  target: Extract<
    AtsTarget,
    { provider: "greenhouse" }
  >,
): Promise<VerificationResult> {
  const { response, finalUrl } =
    await safeFetchPublicUrl(target.apiUrl);

  if (
    response.status === 404 ||
    response.status === 410
  ) {
    await response.body?.cancel();

    return createNotFoundResult(
      requestedUrl,
      "greenhouse",
      target.postingId,
      response.status,
    );
  }

  if (!response.ok) {
    await response.body?.cancel();

    throw new Error(
      `Greenhouse returned HTTP ${response.status}.`,
    );
  }

  const body = await readResponseText(response);
  const data = JSON.parse(body) as Record<
    string,
    unknown
  >;

  const title = textValue(data.title);

  const location =
    data.location &&
    typeof data.location === "object"
      ? textValue(
          (
            data.location as Record<
              string,
              unknown
            >
          ).name,
        )
      : undefined;

  const evidence: VerificationEvidence[] = [
    {
      label: "Greenhouse Job Board API",
      value:
        "The posting ID returned a public job record.",
      kind: "positive",
    },
    {
      label: "Posting ID",
      value: String(
        data.id ?? target.postingId,
      ),
      kind: "neutral",
    },
  ];

  return {
    status: "verified",
    provider: "greenhouse",
    checkedAt: new Date().toISOString(),
    requestedUrl,
    finalUrl:
      textValue(data.absolute_url) ?? finalUrl,
    httpStatus: response.status,
    officialSource: true,
    listingActive: true,
    title,
    location,
    postingId: String(
      data.id ?? target.postingId,
    ),
    evidence,
    warnings: [
      "A public ATS record confirms that the posting exists, but it does not prove the employer’s hiring intent.",
    ],
  };
}

async function verifyLever(
  requestedUrl: string,
  target: Extract<
    AtsTarget,
    { provider: "lever" }
  >,
): Promise<VerificationResult> {
  const { response, finalUrl } =
    await safeFetchPublicUrl(target.apiUrl);

  if (
    response.status === 404 ||
    response.status === 410
  ) {
    await response.body?.cancel();

    return createNotFoundResult(
      requestedUrl,
      "lever",
      target.postingId,
      response.status,
    );
  }

  if (!response.ok) {
    await response.body?.cancel();

    throw new Error(
      `Lever returned HTTP ${response.status}.`,
    );
  }

  const body = await readResponseText(response);
  const data = JSON.parse(body) as Record<
    string,
    unknown
  >;

  const categories =
    data.categories &&
    typeof data.categories === "object"
      ? (data.categories as Record<
          string,
          unknown
        >)
      : {};

  const createdAt =
    typeof data.createdAt === "number"
      ? new Date(data.createdAt).toISOString()
      : undefined;

  return {
    status: "verified",
    provider: "lever",
    checkedAt: new Date().toISOString(),
    requestedUrl,
    finalUrl:
      textValue(data.hostedUrl) ?? finalUrl,
    httpStatus: response.status,
    officialSource: true,
    listingActive: true,
    title: textValue(data.text),
    location: textValue(categories.location),
    postingId: String(
      data.id ?? target.postingId,
    ),
    datePosted: createdAt,
    evidence: [
      {
        label: "Lever Postings API",
        value:
          "The posting ID returned a published public job record.",
        kind: "positive",
      },
      {
        label: "Posting ID",
        value: String(
          data.id ?? target.postingId,
        ),
        kind: "neutral",
      },
    ],
    warnings: [
      "A public ATS record confirms that the posting exists, but it does not prove the employer’s hiring intent.",
    ],
  };
}

async function verifyGenericPage(
  requestedUrl: string,
): Promise<VerificationResult> {
  const { response, finalUrl } =
    await safeFetchPublicUrl(requestedUrl);

  if (
    response.status === 404 ||
    response.status === 410
  ) {
    await response.body?.cancel();

    return {
      status: "not-found",
      provider: "generic",
      checkedAt: new Date().toISOString(),
      requestedUrl,
      finalUrl,
      httpStatus: response.status,
      officialSource: false,
      listingActive: false,
      evidence: [
        {
          label: "Page response",
          value: `HTTP ${response.status}`,
          kind: "warning",
        },
      ],
      warnings: [
        "The submitted URL no longer returned an available page.",
      ],
    };
  }

  if (!response.ok) {
    await response.body?.cancel();

    return {
      status: "error",
      provider: "generic",
      checkedAt: new Date().toISOString(),
      requestedUrl,
      finalUrl,
      httpStatus: response.status,
      officialSource: false,
      listingActive: null,
      evidence: [
        {
          label: "Page response",
          value: `HTTP ${response.status}`,
          kind: "warning",
        },
      ],
      warnings: [
        "The website did not allow the verifier to retrieve the listing.",
      ],
    };
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  const html = await readResponseText(response);

  const structuredPosting =
    contentType.includes("html")
      ? extractStructuredJobPosting(html)
      : null;

  const title =
    structuredPosting
      ? textValue(structuredPosting.title)
      : extractTitle(html);

  const company = structuredPosting
    ? extractCompany(
        structuredPosting.hiringOrganization,
      )
    : undefined;

  const location = structuredPosting
    ? extractLocation(
        structuredPosting.jobLocation,
      )
    : undefined;

  const datePosted = structuredPosting
    ? textValue(structuredPosting.datePosted)
    : undefined;

  const validThrough = structuredPosting
    ? textValue(structuredPosting.validThrough)
    : undefined;

  const requisitionId = structuredPosting
    ? extractIdentifier(
        structuredPosting.identifier,
      )
    : undefined;

  let listingActive: boolean | null = null;

  if (validThrough) {
    const validThroughTime =
      Date.parse(validThrough);

    if (!Number.isNaN(validThroughTime)) {
      listingActive =
        validThroughTime >= Date.now();
    }
  }

  const canonicalUrl = contentType.includes("html")
    ? extractCanonicalUrl(html, finalUrl)
    : undefined;

  const evidence: VerificationEvidence[] = [
    {
      label: "Page response",
      value: `The URL returned HTTP ${response.status}.`,
      kind: "positive",
    },
  ];

  if (structuredPosting) {
    evidence.push({
      label: "Structured job data",
      value:
        "The page contains JobPosting structured data.",
      kind: "positive",
    });
  }

  if (canonicalUrl) {
    evidence.push({
      label: "Canonical URL",
      value: canonicalUrl,
      kind: "neutral",
    });
  }

  return {
    status: "reachable",
    provider: "generic",
    checkedAt: new Date().toISOString(),
    requestedUrl,
    finalUrl,
    httpStatus: response.status,
    officialSource: false,
    listingActive,
    title,
    company,
    location,
    requisitionId,
    datePosted,
    validThrough,
    evidence,
    warnings: [
      "A reachable page is not automatically an official or active employer listing.",
      "Automatic official-site searching will be added separately.",
    ],
  };
}

export async function verifyListingUrl(
  requestedUrl: string,
): Promise<VerificationResult> {
  const target = parseAtsUrl(requestedUrl);

  if (target?.provider === "greenhouse") {
    return verifyGreenhouse(
      requestedUrl,
      target,
    );
  }

  if (target?.provider === "lever") {
    return verifyLever(
      requestedUrl,
      target,
    );
  }

  return verifyGenericPage(requestedUrl);
}