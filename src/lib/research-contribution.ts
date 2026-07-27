import type {
  AnalysisInput,
  AnalysisResult,
} from "./analysis-types";

import type {
  JobHealthProfile,
} from "./presentation";

export const CONTRIBUTION_SCHEMA_VERSION =
  "1.0.0";

export const CONTRIBUTION_CONSENT_VERSION =
  "2026-07-v1";

export const RESEARCH_CONTRIBUTION_STORAGE_KEY =
  "job-listing-reality-check:research-contributions";

export const MAX_RESEARCH_CONTRIBUTIONS =
  100;

export interface ResearchContributionRecord {
  id: string;
  createdAt: string;
  schemaVersion: string;
  consentVersion: string;
  opportunityType:
    AnalysisInput["opportunityType"];
  opportunitySubtype:
    AnalysisInput["opportunitySubtype"] | null;
  companyProvided: boolean;
  listingUrlProvided: boolean;
  recruiterMessageProvided: boolean;
  listingTextLength: number;
  recruiterMessageLength: number;
  ghostRisk: number;
  scamRisk: number;
  confidence: number;
  sanityScore: number | null;
  listingQuality: number | null;
  personalSafety: number | null;
  evidenceQuality: number | null;
  signalIds: string[];
  unansweredQuestionCount: number;
  verificationAttempted: boolean;
  reconciliationAvailable: boolean;
}

export interface BuildResearchContributionInput {
  form: AnalysisInput;
  analysisResult: AnalysisResult;
  profile: JobHealthProfile | null;
  verificationAttempted: boolean;
  reconciliationAvailable: boolean;
  id?: string;
  createdAt?: string;
}

export interface ResearchContributionReceipt {
  receiptType:
    "research-contribution-consent-receipt";
  generatedAt: string;
  statement: string;
  record: ResearchContributionRecord;
}

export interface StorageLike {
  getItem(
    key: string,
  ): string | null;

  setItem(
    key: string,
    value: string,
  ): void;

  removeItem(
    key: string,
  ): void;
}

function createId(): string {
  if (
    typeof globalThis.crypto
      ?.randomUUID === "function"
  ) {
    return globalThis.crypto
      .randomUUID();
  }

  return [
    Date.now(),
    Math.random()
      .toString(16)
      .slice(2),
  ].join("-");
}

function browserStorage():
  StorageLike | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return window.localStorage;
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function safeSignalId(
  value: string,
): string | null {
  const normalized = value
    .trim()
    .toLowerCase();

  if (
    !/^[a-z0-9][a-z0-9-]{0,79}$/.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

function metricScore(
  profile: JobHealthProfile | null,
  id:
    | "listing-quality"
    | "personal-safety"
    | "evidence-quality",
): number | null {
  return (
    profile?.metrics.find(
      (metric) =>
        metric.id === id,
    )?.score ?? null
  );
}

export function buildResearchContribution(
  input:
    BuildResearchContributionInput,
): ResearchContributionRecord {
  const {
    form,
    analysisResult,
    profile,
    verificationAttempted,
    reconciliationAvailable,
  } = input;

  const signalIds = Array.from(
    new Set(
      analysisResult.signals
        .map((signal) =>
          safeSignalId(
            signal.id,
          ),
        )
        .filter(
          (
            value,
          ): value is string =>
            value !== null,
        ),
    ),
  ).sort();

  return {
    id:
      input.id ?? createId(),
    createdAt:
      input.createdAt ??
      new Date().toISOString(),
    schemaVersion:
      CONTRIBUTION_SCHEMA_VERSION,
    consentVersion:
      CONTRIBUTION_CONSENT_VERSION,
    opportunityType:
      form.opportunityType,
    opportunitySubtype:
      form.opportunitySubtype ??
      null,
    companyProvided:
      Boolean(
        form.company.trim(),
      ),
    listingUrlProvided:
      Boolean(
        form.listingUrl.trim(),
      ),
    recruiterMessageProvided:
      Boolean(
        form.recruiterMessage
          .trim(),
      ),
    listingTextLength:
      form.listingText.length,
    recruiterMessageLength:
      form.recruiterMessage
        .length,
    ghostRisk:
      Math.ceil(
        analysisResult.ghostRisk,
      ),
    scamRisk:
      Math.ceil(
        analysisResult.scamRisk,
      ),
    confidence:
      Math.ceil(
        analysisResult.confidence,
      ),
    sanityScore:
      profile?.overallScore ??
      null,
    listingQuality:
      metricScore(
        profile,
        "listing-quality",
      ),
    personalSafety:
      metricScore(
        profile,
        "personal-safety",
      ),
    evidenceQuality:
      metricScore(
        profile,
        "evidence-quality",
      ),
    signalIds,
    unansweredQuestionCount:
      analysisResult.questions
        .length,
    verificationAttempted,
    reconciliationAvailable,
  };
}

export function buildContributionReceipt(
  record:
    ResearchContributionRecord,
): ResearchContributionReceipt {
  return {
    receiptType:
      "research-contribution-consent-receipt",
    generatedAt:
      new Date().toISOString(),
    statement:
      "I reviewed this anonymized record and chose to save or export it for possible research contribution. No raw job description, recruiter message, company name, job URL, email address, phone number, or account information is included.",
    record,
  };
}

export function isResearchContributionRecord(
  value: unknown,
): value is ResearchContributionRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.createdAt ===
      "string" &&
    value.schemaVersion ===
      CONTRIBUTION_SCHEMA_VERSION &&
    typeof value.consentVersion ===
      "string" &&
    typeof value.opportunityType ===
      "string" &&
    (
      value.opportunitySubtype ===
        null ||
      typeof value.opportunitySubtype ===
        "string"
    ) &&
    typeof value.companyProvided ===
      "boolean" &&
    typeof value.listingUrlProvided ===
      "boolean" &&
    typeof value.recruiterMessageProvided ===
      "boolean" &&
    isFiniteNumber(
      value.listingTextLength,
    ) &&
    isFiniteNumber(
      value.recruiterMessageLength,
    ) &&
    isFiniteNumber(
      value.ghostRisk,
    ) &&
    isFiniteNumber(
      value.scamRisk,
    ) &&
    isFiniteNumber(
      value.confidence,
    ) &&
    (
      value.sanityScore ===
        null ||
      isFiniteNumber(
        value.sanityScore,
      )
    ) &&
    (
      value.listingQuality ===
        null ||
      isFiniteNumber(
        value.listingQuality,
      )
    ) &&
    (
      value.personalSafety ===
        null ||
      isFiniteNumber(
        value.personalSafety,
      )
    ) &&
    (
      value.evidenceQuality ===
        null ||
      isFiniteNumber(
        value.evidenceQuality,
      )
    ) &&
    Array.isArray(
      value.signalIds,
    ) &&
    value.signalIds.every(
      (signalId) =>
        typeof signalId ===
        "string",
    ) &&
    isFiniteNumber(
      value.unansweredQuestionCount,
    ) &&
    typeof value.verificationAttempted ===
      "boolean" &&
    typeof value.reconciliationAvailable ===
      "boolean"
  );
}

export function loadResearchContributions(
  storage:
    StorageLike | null =
      browserStorage(),
): ResearchContributionRecord[] {
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(
    RESEARCH_CONTRIBUTION_STORAGE_KEY,
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed:
      unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        isResearchContributionRecord,
      )
      .slice(
        0,
        MAX_RESEARCH_CONTRIBUTIONS,
      );
  } catch {
    return [];
  }
}

export function saveResearchContribution(
  record:
    ResearchContributionRecord,
  storage:
    StorageLike | null =
      browserStorage(),
): ResearchContributionRecord[] {
  if (!storage) {
    throw new Error(
      "Browser storage is unavailable.",
    );
  }

  const existing =
    loadResearchContributions(
      storage,
    ).filter(
      (item) =>
        item.id !== record.id,
    );

  const updated = [
    record,
    ...existing,
  ].slice(
    0,
    MAX_RESEARCH_CONTRIBUTIONS,
  );

  storage.setItem(
    RESEARCH_CONTRIBUTION_STORAGE_KEY,
    JSON.stringify(updated),
  );

  return updated;
}

export function deleteResearchContribution(
  contributionId: string,
  storage:
    StorageLike | null =
      browserStorage(),
): ResearchContributionRecord[] {
  if (!storage) {
    return [];
  }

  const updated =
    loadResearchContributions(
      storage,
    ).filter(
      (item) =>
        item.id !==
        contributionId,
    );

  storage.setItem(
    RESEARCH_CONTRIBUTION_STORAGE_KEY,
    JSON.stringify(updated),
  );

  return updated;
}

export function clearResearchContributions(
  storage:
    StorageLike | null =
      browserStorage(),
): void {
  storage?.removeItem(
    RESEARCH_CONTRIBUTION_STORAGE_KEY,
  );
}
