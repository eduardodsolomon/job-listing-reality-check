import type {
  SavedReport,
  SavedReportDraft,
} from "./saved-report-types";

export const REPORT_STORAGE_KEY =
  "job-listing-reality-check:reports";

export const MAX_SAVED_REPORTS =
  25;

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

function browserStorage():
  StorageLike | null {
  if (
    typeof window ===
    "undefined"
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
    typeof value ===
      "object" &&
    value !== null
  );
}

function isNullableRecord(
  value: unknown,
): boolean {
  return (
    value === null ||
    isRecord(value)
  );
}

export function isSavedReport(
  value: unknown,
): value is SavedReport {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.savedAt ===
      "string" &&
    isRecord(value.form) &&
    typeof value.form
      .listingText ===
      "string" &&
    isRecord(
      value.analysisResult,
    ) &&
    typeof value.analysisResult
      .ghostRisk ===
      "number" &&
    typeof value.analysisResult
      .scamRisk ===
      "number" &&
    isNullableRecord(
      value.verificationResult,
    ) &&
    isNullableRecord(
      value.reconciliationResult,
    )
  );
}

function createId(): string {
  if (
    typeof globalThis.crypto
      ?.randomUUID ===
    "function"
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

export interface SavedReportOverrides {
  id?: string;
  savedAt?: string;
}

export function createSavedReport(
  draft: SavedReportDraft,
  overrides:
    | SavedReportOverrides
    | Date = {},
): SavedReport {
  if (overrides instanceof Date) {
    return {
      ...draft,
      id: createId(),
      savedAt:
        overrides.toISOString(),
    };
  }

  return {
    ...draft,
    id:
      overrides.id ??
      createId(),
    savedAt:
      overrides.savedAt ??
      new Date().toISOString(),
  };
}

export function loadSavedReports(
  storage:
    StorageLike | null =
      browserStorage(),
): SavedReport[] {
  if (!storage) {
    return [];
  }

  const raw =
    storage.getItem(
      REPORT_STORAGE_KEY,
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed:
      unknown =
        JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isSavedReport)
      .slice(
        0,
        MAX_SAVED_REPORTS,
      );
  } catch {
    return [];
  }
}

export function saveSavedReport(
  report: SavedReport,
  storage:
    StorageLike | null =
      browserStorage(),
): SavedReport[] {
  if (!storage) {
    throw new Error(
      "Browser storage is unavailable.",
    );
  }

  const existing =
    loadSavedReports(
      storage,
    ).filter(
      (item) =>
        item.id !== report.id,
    );

  const updated = [
    report,
    ...existing,
  ].slice(
    0,
    MAX_SAVED_REPORTS,
  );

  storage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify(updated),
  );

  return updated;
}

export function deleteSavedReport(
  reportId: string,
  storage:
    StorageLike | null =
      browserStorage(),
): SavedReport[] {
  if (!storage) {
    return [];
  }

  const updated =
    loadSavedReports(
      storage,
    ).filter(
      (report) =>
        report.id !== reportId,
    );

  storage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify(updated),
  );

  return updated;
}

export function clearSavedReports(
  storage:
    StorageLike | null =
      browserStorage(),
): void {
  storage?.removeItem(
    REPORT_STORAGE_KEY,
  );
}

function safeFilename(
  value: string,
): string {
  const normalized =
    value
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

  return (
    normalized ||
    "job-report"
  );
}

function downloadJson(
  value: unknown,
  filename: string,
): void {
  if (
    typeof document ===
      "undefined"
  ) {
    return;
  }

  const blob = new Blob(
    [
      JSON.stringify(
        value,
        null,
        2,
      ),
    ],
    {
      type:
        "application/json;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadSavedReport(
  report: SavedReport,
): void {
  const title =
    report.verificationResult
      ?.title ||
    report.form.company ||
    "job-report";

  downloadJson(
    report,
    `${safeFilename(
      title,
    )}.json`,
  );
}

export function downloadSavedReportHistory(
  reports: SavedReport[],
): void {
  downloadJson(
    reports,
    "job-reality-check-reports.json",
  );
}
