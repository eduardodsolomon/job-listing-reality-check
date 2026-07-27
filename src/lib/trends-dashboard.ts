export const MIN_PUBLIC_GROUP_SIZE = 3;

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
}

export interface TrendScores {
  sanityScore: number | null;
  listingQuality: number | null;
  personalSafety: number | null;
  evidenceQuality: number | null;
}

export interface NormalizedTrendRecord {
  id: string;
  createdAt: string | null;
  opportunityType: string;
  opportunitySubtype: string | null;
  scores: TrendScores;
  signalIds: string[];
  verificationAttempted: boolean;
  reconciliationAvailable: boolean;
}

export interface TrendMetricSummary {
  available: number;
  average: number | null;
}

export interface TrendCategorySummary {
  key: string;
  label: string;
  count: number;
  percentage: number;
  publishable: boolean;
  scores: {
    sanityScore: TrendMetricSummary;
    listingQuality: TrendMetricSummary;
    personalSafety: TrendMetricSummary;
    evidenceQuality: TrendMetricSummary;
  };
}

export interface TrendSignalSummary {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TrendDashboardSummary {
  generatedAt: string;
  totalRecords: number;
  privacyThreshold: number;
  scores: {
    sanityScore: TrendMetricSummary;
    listingQuality: TrendMetricSummary;
    personalSafety: TrendMetricSummary;
    evidenceQuality: TrendMetricSummary;
  };
  verification: {
    attempted: number;
    attemptedRate: number;
    reconciliationAvailable: number;
    reconciliationRate: number;
  };
  categories: TrendCategorySummary[];
  signals: TrendSignalSummary[];
}

type UnknownRecord = Record<string, unknown>;

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard employee jobs",
  contract: "Contract and 1099 jobs",
  government: "Government jobs",
  nonprofit: "Nonprofit jobs",
  internship: "Internships and fellowships",
  volunteer: "Volunteer and service roles",
  "not-sure": "Unclassified opportunities",
};

const SIGNAL_LABELS: Record<string, string> = {
  "sensitive-information": "Sensitive information requested too early",
  "banking-information": "Banking information requested too early",
  "password-request": "Password or login request",
  "mfa-code-request": "Verification-code request",
  "fake-check": "Check deposit or equipment-purchase request",
  "application-fee": "Application, training, or placement fee",
  "personal-email": "Unverified personal email contact",
  "no-interview": "No meaningful interview process",
  urgency: "High-pressure or urgent response demand",
  pipeline: "Pipeline, evergreen, or contingent role",
  "missing-salary": "Compensation not established",
  "missing-requisition": "Job or requisition number missing",
  "photo-request": "Photo or headshot request",
  "discriminatory-question": "Potentially discriminatory application question",
  citizenship: "Citizenship or nationality concern",
  "unpaid-work": "Unpaid or under-compensated work concern",
  "missing-supervision": "Supervision or learning support missing",
};

function isObject(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getPath(
  value: unknown,
  path: string,
): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (current, part) =>
        isObject(current)
          ? current[part]
          : undefined,
      value,
    );
}

function firstDefined(
  value: unknown,
  paths: string[],
): unknown {
  for (const path of paths) {
    const candidate = getPath(
      value,
      path,
    );

    if (
      candidate !== undefined &&
      candidate !== null
    ) {
      return candidate;
    }
  }

  return undefined;
}

function textValue(
  value: unknown,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function booleanValue(
  value: unknown,
): boolean {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return value !== 0;
  }

  if (
    typeof value === "string"
  ) {
    return [
      "true",
      "yes",
      "1",
      "attempted",
      "available",
    ].includes(
      value
        .trim()
        .toLowerCase(),
    );
  }

  return false;
}

function scoreValue(
  value: unknown,
): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isFinite(numeric)
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.ceil(numeric),
    ),
  );
}

function normalizeType(
  value: unknown,
): string {
  const raw =
    textValue(value)
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      ) ?? "not-sure";

  if (
    raw === "employee" ||
    raw === "w2" ||
    raw === "standard-employee-job"
  ) {
    return "standard";
  }

  if (
    raw === "1099" ||
    raw === "contractor" ||
    raw.startsWith("contract-")
  ) {
    return "contract";
  }

  if (
    raw.includes("government") ||
    raw.includes("public-sector")
  ) {
    return "government";
  }

  if (
    raw.includes("nonprofit") ||
    raw === "ngo"
  ) {
    return "nonprofit";
  }

  if (
    raw.includes("intern") ||
    raw.includes("fellow")
  ) {
    return "internship";
  }

  if (
    raw.includes("volunteer") ||
    raw.includes("service")
  ) {
    return "volunteer";
  }

  if (
    Object.hasOwn(
      TYPE_LABELS,
      raw,
    )
  ) {
    return raw;
  }

  return "not-sure";
}

function normalizeSignalId(
  value: unknown,
): string | null {
  if (
    typeof value === "string"
  ) {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      );

    return normalized || null;
  }

  if (
    isObject(value)
  ) {
    return normalizeSignalId(
      firstDefined(
        value,
        [
          "id",
          "signalId",
          "code",
          "title",
        ],
      ),
    );
  }

  return null;
}

function signalIdsFrom(
  value: unknown,
): string[] {
  const candidate = firstDefined(
    value,
    [
      "signalIds",
      "detectedSignalIds",
      "warningSignalIds",
      "signals",
      "findings",
      "analysis.signalIds",
      "analysis.signals",
      "privacySafeSignals",
    ],
  );

  if (
    !Array.isArray(candidate)
  ) {
    return [];
  }

  return Array.from(
    new Set(
      candidate
        .map(normalizeSignalId)
        .filter(
          (signal): signal is string =>
            signal !== null,
        ),
    ),
  ).slice(0, 50);
}

function extractScores(
  value: unknown,
): TrendScores {
  return {
    sanityScore: scoreValue(
      firstDefined(
        value,
        [
          "scores.sanityScore",
          "scores.overall",
          "scores.overallScore",
          "scoreSnapshot.sanityScore",
          "scoreSnapshot.overallScore",
          "profile.overallScore",
          "sanityScore",
          "overallScore",
        ],
      ),
    ),
    listingQuality: scoreValue(
      firstDefined(
        value,
        [
          "scores.listingQuality",
          "scoreSnapshot.listingQuality",
          "listingQuality",
          "metrics.listingQuality",
        ],
      ),
    ),
    personalSafety: scoreValue(
      firstDefined(
        value,
        [
          "scores.personalSafety",
          "scoreSnapshot.personalSafety",
          "personalSafety",
          "metrics.personalSafety",
        ],
      ),
    ),
    evidenceQuality: scoreValue(
      firstDefined(
        value,
        [
          "scores.evidenceQuality",
          "scoreSnapshot.evidenceQuality",
          "evidenceQuality",
          "metrics.evidenceQuality",
        ],
      ),
    ),
  };
}

function looksLikeResearchRecord(
  value: unknown,
): boolean {
  if (
    !isObject(value)
  ) {
    return false;
  }

  const schema =
    textValue(
      firstDefined(
        value,
        [
          "schemaVersion",
          "recordType",
          "kind",
          "privacyProfile",
        ],
      ),
    )?.toLowerCase() ?? "";

  const explicitResearchMarker =
    /research|contribution|anonymous|anonymized|aggregate/.test(
      schema,
    ) ||
    firstDefined(
      value,
      [
        "consentVersion",
        "consentRecordedAt",
        "excludedFields",
        "privacyReceipt",
      ],
    ) !== undefined;

  const scores =
    extractScores(value);

  const hasScore =
    Object.values(scores).some(
      (score) => score !== null,
    );

  const hasCategory =
    firstDefined(
      value,
      [
        "opportunityType",
        "jobType",
        "category.opportunityType",
      ],
    ) !== undefined;

  return (
    explicitResearchMarker &&
    (hasScore || hasCategory)
  );
}

function extractRecordArray(
  value: unknown,
): unknown[] {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    !isObject(value)
  ) {
    return [];
  }

  for (const key of [
    "records",
    "queue",
    "contributions",
    "items",
    "data",
  ]) {
    const candidate = value[key];

    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return [];
}

function stableId(
  value: unknown,
  index: number,
): string {
  return (
    textValue(
      firstDefined(
        value,
        [
          "id",
          "recordId",
          "contributionId",
          "receiptId",
        ],
      ),
    ) ?? `local-record-${index + 1}`
  );
}

export function normalizeTrendRecord(
  value: unknown,
  index = 0,
): NormalizedTrendRecord | null {
  if (
    !looksLikeResearchRecord(value)
  ) {
    return null;
  }

  const opportunityType =
    normalizeType(
      firstDefined(
        value,
        [
          "opportunityType",
          "jobType",
          "category.opportunityType",
          "category.jobType",
        ],
      ),
    );

  return {
    id: stableId(
      value,
      index,
    ),
    createdAt: textValue(
      firstDefined(
        value,
        [
          "createdAt",
          "savedAt",
          "consentRecordedAt",
          "timestamp",
        ],
      ),
    ),
    opportunityType,
    opportunitySubtype: textValue(
      firstDefined(
        value,
        [
          "opportunitySubtype",
          "jobSubtype",
          "category.opportunitySubtype",
        ],
      ),
    ),
    scores: extractScores(value),
    signalIds: signalIdsFrom(value),
    verificationAttempted: booleanValue(
      firstDefined(
        value,
        [
          "verificationAttempted",
          "verification.attempted",
          "urlVerificationAttempted",
        ],
      ),
    ),
    reconciliationAvailable: booleanValue(
      firstDefined(
        value,
        [
          "reconciliationAvailable",
          "verification.reconciliationAvailable",
          "comparisonAvailable",
        ],
      ),
    ),
  };
}

function recordFingerprint(
  record: NormalizedTrendRecord,
): string {
  return JSON.stringify({
    id: record.id,
    createdAt: record.createdAt,
    opportunityType:
      record.opportunityType,
    scores: record.scores,
    signalIds: record.signalIds,
  });
}

export function discoverTrendRecords(
  storage: StorageLike,
): NormalizedTrendRecord[] {
  const records:
    NormalizedTrendRecord[] = [];

  for (
    let index = 0;
    index < storage.length;
    index += 1
  ) {
    const key = storage.key(index);

    if (!key) {
      continue;
    }

    const raw = storage.getItem(key);

    if (!raw) {
      continue;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const keyLooksResearch =
      /research|contribution|anonymous|anonymized/i.test(
        key,
      );

    const candidates =
      extractRecordArray(parsed);

    candidates.forEach(
      (candidate, candidateIndex) => {
        if (
          !keyLooksResearch &&
          !looksLikeResearchRecord(
            candidate,
          )
        ) {
          return;
        }

        const normalized =
          normalizeTrendRecord(
            candidate,
            candidateIndex,
          );

        if (normalized) {
          records.push(normalized);
        }
      },
    );
  }

  const seen =
    new Set<string>();

  return records.filter(
    (record) => {
      const fingerprint =
        recordFingerprint(record);

      if (
        seen.has(fingerprint)
      ) {
        return false;
      }

      seen.add(fingerprint);
      return true;
    },
  );
}

function metricSummary(
  values: Array<number | null>,
): TrendMetricSummary {
  const available =
    values.filter(
      (value): value is number =>
        value !== null,
    );

  if (
    available.length === 0
  ) {
    return {
      available: 0,
      average: null,
    };
  }

  return {
    available:
      available.length,
    average: Math.min(
      100,
      Math.ceil(
        available.reduce(
          (total, value) =>
            total + value,
          0,
        ) / available.length,
      ),
    ),
  };
}

function scoreSummaries(
  records: NormalizedTrendRecord[],
): TrendDashboardSummary["scores"] {
  return {
    sanityScore: metricSummary(
      records.map(
        (record) =>
          record.scores
            .sanityScore,
      ),
    ),
    listingQuality: metricSummary(
      records.map(
        (record) =>
          record.scores
            .listingQuality,
      ),
    ),
    personalSafety: metricSummary(
      records.map(
        (record) =>
          record.scores
            .personalSafety,
      ),
    ),
    evidenceQuality: metricSummary(
      records.map(
        (record) =>
          record.scores
            .evidenceQuality,
      ),
    ),
  };
}

function percentage(
  numerator: number,
  denominator: number,
): number {
  if (
    denominator <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.ceil(
      (numerator / denominator) *
        100,
    ),
  );
}

function typeLabel(
  key: string,
): string {
  return (
    TYPE_LABELS[key] ??
    key
      .split("-")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1),
      )
      .join(" ")
  );
}

function signalLabel(
  id: string,
): string {
  return (
    SIGNAL_LABELS[id] ??
    id
      .split("-")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1),
      )
      .join(" ")
  );
}

export function buildTrendDashboardSummary(
  records: NormalizedTrendRecord[],
  now = new Date(),
): TrendDashboardSummary {
  const categoryCounts =
    new Map<
      string,
      NormalizedTrendRecord[]
    >();

  records.forEach(
    (record) => {
      const group =
        categoryCounts.get(
          record.opportunityType,
        ) ?? [];

      group.push(record);

      categoryCounts.set(
        record.opportunityType,
        group,
      );
    },
  );

  const categories =
    Array.from(
      categoryCounts.entries(),
    )
      .map(
        ([key, group]) => ({
          key,
          label: typeLabel(key),
          count: group.length,
          percentage: percentage(
            group.length,
            records.length,
          ),
          publishable:
            group.length >=
            MIN_PUBLIC_GROUP_SIZE,
          scores:
            scoreSummaries(group),
        }),
      )
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.label.localeCompare(
            right.label,
          ),
      );

  const signalCounts =
    new Map<string, number>();

  records.forEach(
    (record) => {
      record.signalIds.forEach(
        (signalId) => {
          signalCounts.set(
            signalId,
            (signalCounts.get(
              signalId,
            ) ?? 0) + 1,
          );
        },
      );
    },
  );

  const signals =
    Array.from(
      signalCounts.entries(),
    )
      .map(
        ([id, count]) => ({
          id,
          label: signalLabel(id),
          count,
          percentage: percentage(
            count,
            records.length,
          ),
        }),
      )
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.label.localeCompare(
            right.label,
          ),
      )
      .slice(0, 12);

  const verificationAttempted =
    records.filter(
      (record) =>
        record.verificationAttempted,
    ).length;

  const reconciliationAvailable =
    records.filter(
      (record) =>
        record.reconciliationAvailable,
    ).length;

  return {
    generatedAt:
      now.toISOString(),
    totalRecords: records.length,
    privacyThreshold:
      MIN_PUBLIC_GROUP_SIZE,
    scores:
      scoreSummaries(records),
    verification: {
      attempted:
        verificationAttempted,
      attemptedRate: percentage(
        verificationAttempted,
        records.length,
      ),
      reconciliationAvailable:
        reconciliationAvailable,
      reconciliationRate:
        percentage(
          reconciliationAvailable,
          records.length,
        ),
    },
    categories,
    signals,
  };
}

export function aggregateSummaryForExport(
  summary: TrendDashboardSummary,
): TrendDashboardSummary {
  return {
    ...summary,
    categories:
      summary.categories.map(
        (category) =>
          category.publishable
            ? category
            : {
                ...category,
                scores: {
                  sanityScore: {
                    available: 0,
                    average: null,
                  },
                  listingQuality: {
                    available: 0,
                    average: null,
                  },
                  personalSafety: {
                    available: 0,
                    average: null,
                  },
                  evidenceQuality: {
                    available: 0,
                    average: null,
                  },
                },
              },
      ),
  };
}
