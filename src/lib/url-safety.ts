import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_RESPONSE_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 8_000;

export class UrlSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlSafetyError";
  }
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address
    .toLowerCase()
    .split("%")[0];

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice(7));
  }

  return false;
}

function isPrivateAddress(
  address: string,
  family: number,
): boolean {
  if (family === 4) {
    return isPrivateIpv4(address);
  }

  if (family === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

export function validatePublicHttpUrl(
  rawValue: string,
): URL {
  let url: URL;

  try {
    url = new URL(rawValue.trim());
  } catch {
    throw new UrlSafetyError(
      "Enter a complete public URL beginning with http:// or https://.",
    );
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new UrlSafetyError(
      "Only HTTP and HTTPS listing URLs are supported.",
    );
  }

  if (url.username || url.password) {
    throw new UrlSafetyError(
      "URLs containing usernames or passwords are not allowed.",
    );
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/\.$/, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new UrlSafetyError(
      "Local and internal network addresses are not allowed.",
    );
  }

  // Block every direct IP address in the prototype.
  // Legitimate public job listings should use a domain name.
  if (isIP(hostname) !== 0) {
    throw new UrlSafetyError(
      "Direct IP-address URLs are not allowed.",
    );
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new UrlSafetyError(
      "Only standard web ports 80 and 443 are allowed.",
    );
  }

  url.hash = "";

  return url;
}

export async function assertPublicHttpUrl(
  rawValue: string,
): Promise<URL> {
  const url = validatePublicHttpUrl(rawValue);

  let addresses;

  try {
    addresses = await lookup(url.hostname, {
      all: true,
    });
  } catch {
    throw new UrlSafetyError(
      "The listing domain could not be resolved.",
    );
  }

  if (addresses.length === 0) {
    throw new UrlSafetyError(
      "The listing domain returned no public addresses.",
    );
  }

  if (
    addresses.some(({ address, family }) =>
      isPrivateAddress(address, family),
    )
  ) {
    throw new UrlSafetyError(
      "The listing domain resolves to a private or restricted network address.",
    );
  }

  return url;
}

export interface SafeFetchResult {
  response: Response;
  finalUrl: string;
}

export async function safeFetchPublicUrl(
  rawValue: string,
  maximumRedirects = 4,
): Promise<SafeFetchResult> {
  let currentUrl = await assertPublicHttpUrl(rawValue);

  for (
    let redirectCount = 0;
    redirectCount <= maximumRedirects;
    redirectCount += 1
  ) {
    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5",
        "User-Agent":
          "JobListingRealityCheck/0.3 (+public job listing verification)",
      },
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      return {
        response,
        finalUrl: currentUrl.toString(),
      };
    }

    const location = response.headers.get("location");

    await response.body?.cancel();

    if (!location) {
      throw new UrlSafetyError(
        "The listing returned an invalid redirect.",
      );
    }

    if (redirectCount === maximumRedirects) {
      throw new UrlSafetyError(
        "The listing redirected too many times.",
      );
    }

    const redirectedUrl = new URL(
      location,
      currentUrl,
    ).toString();

    currentUrl = await assertPublicHttpUrl(
      redirectedUrl,
    );
  }

  throw new UrlSafetyError(
    "The listing could not be retrieved safely.",
  );
}

export async function readResponseText(
  response: Response,
  maximumBytes = MAX_RESPONSE_BYTES,
): Promise<string> {
  const declaredLength = Number(
    response.headers.get("content-length"),
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumBytes
  ) {
    throw new UrlSafetyError(
      "The listing page is too large to analyze safely.",
    );
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maximumBytes) {
      await reader.cancel();

      throw new UrlSafetyError(
        "The listing page exceeded the analysis size limit.",
      );
    }

    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}