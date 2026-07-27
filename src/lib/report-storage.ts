import {
  SAVED_REPORT_SCHEMA_VERSION,
  type SavedReport,
  type SavedReportDraft,
} from "./saved-report-types";

export const REPORT_STORAGE_KEY =
  "job-listing-reality-check:saved-reports:v1";

export const MAX_SAVED_REPORTS = 25;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface CreateSavedReportOptions {
  id?: string;
  savedAt?: string;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function resolveStorage(
  storage?: StorageLike | null,
): StorageLike | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function generateReportId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

function parsedDate(value: string): number {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

export function isSavedReport(
  value: unknown,
): value is SavedReport {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion ===
      SAVED_REPORT_SCHEMA_VERSION &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.savedAt === "string" &&
    isRecord(value.form) &&
    isRecord(value.analysisResult) &&
    isRecord(value.verificationResult) &&
    isRecord(value.reconciliationResult)
  );
}

export function createSavedReport(
  draft: SavedReportDraft,
  options: CreateSavedReportOptions = {},
): SavedReport {
  return {
    schemaVersion:
      SAVED_REPORT_SCHEMA_VERSION,
    id:
      options.id ??
      generateReportId(),
    savedAt:
      options.savedAt ??
      new Date().toISOString(),
    form: draft.form,
    analysisResult:
      draft.analysisResult,
    verificationResult:
      draft.verificationResult,
    reconciliationResult:
      draft.reconciliationResult,
  };
}

export function loadSavedReports(
  storage?: StorageLike | null,
): SavedReport[] {
  const resolvedStorage =
    resolveStorage(storage);

  if (!resolvedStorage) {
    return [];
  }

  try {
    const storedValue =
      resolvedStorage.getItem(
        REPORT_STORAGE_KEY,
      );

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown =
      JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isSavedReport)
      .sort(
        (first, second) =>
          parsedDate(second.savedAt) -
          parsedDate(first.savedAt),
      )
      .slice(0, MAX_SAVED_REPORTS);
  } catch {
    return [];
  }
}

export function saveSavedReport(
  report: SavedReport,
  storage?: StorageLike | null,
): SavedReport[] {
  const resolvedStorage =
    resolveStorage(storage);

  if (!resolvedStorage) {
    throw new Error(
      "Browser storage is not available.",
    );
  }

  const existingReports =
    loadSavedReports(resolvedStorage);

  const nextReports = [
    report,
    ...existingReports.filter(
      (existingReport) =>
        existingReport.id !== report.id,
    ),
  ]
    .sort(
      (first, second) =>
        parsedDate(second.savedAt) -
        parsedDate(first.savedAt),
    )
    .slice(0, MAX_SAVED_REPORTS);

  resolvedStorage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify(nextReports),
  );

  return nextReports;
}

export function deleteSavedReport(
  reportId: string,
  storage?: StorageLike | null,
): SavedReport[] {
  const resolvedStorage =
    resolveStorage(storage);

  if (!resolvedStorage) {
    return [];
  }

  const nextReports =
    loadSavedReports(
      resolvedStorage,
    ).filter(
      (report) =>
        report.id !== reportId,
    );

  resolvedStorage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify(nextReports),
  );

  return nextReports;
}

export function clearSavedReports(
  storage?: StorageLike | null,
): void {
  const resolvedStorage =
    resolveStorage(storage);

  resolvedStorage?.removeItem(
    REPORT_STORAGE_KEY,
  );
}

function safeFilenamePart(
  value: string,
): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function downloadJson(
  value: unknown,
  filename: string,
): void {
  if (
    typeof document === "undefined" ||
    typeof URL === "undefined"
  ) {
    throw new Error(
      "File downloads are not available.",
    );
  }

  const jsonContent =
    JSON.stringify(value, null, 2);

  const blob = new Blob(
    [jsonContent],
    {
      type: "application/json",
    },
  );

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

export function downloadSavedReport(
  report: SavedReport,
): void {
  const title =
    report.verificationResult.title ||
    report.form.company ||
    "job-listing";

  const filenameTitle =
    safeFilenamePart(title) ||
    "job-listing";

  const savedDate =
    report.savedAt.slice(0, 10);

  downloadJson(
    report,
    `${filenameTitle}-${savedDate}-reality-check.json`,
  );
}

export function downloadSavedReportHistory(
  reports: SavedReport[],
): void {
  const exportDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  downloadJson(
    {
      schemaVersion:
        SAVED_REPORT_SCHEMA_VERSION,
      exportedAt:
        new Date().toISOString(),
      reportCount:
        reports.length,
      reports,
    },
    `job-listing-reality-check-history-${exportDate}.json`,
  );
}