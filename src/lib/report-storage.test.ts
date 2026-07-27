import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AnalysisInput,
  AnalysisResult,
} from "./analysis-types";

import type { ReconciliationResult } from "./reconciliation-types";

import {
  clearSavedReports,
  createSavedReport,
  deleteSavedReport,
  loadSavedReports,
  MAX_SAVED_REPORTS,
  REPORT_STORAGE_KEY,
  saveSavedReport,
  type StorageLike,
} from "./report-storage";

import type { SavedReportDraft } from "./saved-report-types";
import type { VerificationResult } from "./verification-types";

function createMemoryStorage(): StorageLike {
  const values =
    new Map<string, string>();

  return {
    getItem(key: string): string | null {
      return values.get(key) ?? null;
    },

    setItem(
      key: string,
      value: string,
    ): void {
      values.set(key, value);
    },

    removeItem(key: string): void {
      values.delete(key);
    },
  };
}

const form: AnalysisInput = {
  company: "Example Health",
  listingUrl:
    "https://example.com/jobs/123",
  listingText:
    "Senior Data Analyst",
  recruiterMessage: "",
};

const analysisResult:
  AnalysisResult = {
  rulesetVersion: "0.2.0",
  ghostRisk: 10,
  ghostLabel: "Low",
  scamRisk: 0,
  scamLabel: "Low",
  confidence: 60,
  confidenceLabel: "Moderate",
  recommendation:
    "Continue verifying the listing.",
  signals: [],
  questions: [],
};

const verificationResult:
  VerificationResult = {
  status: "reachable",
  provider: "generic",
  checkedAt:
    "2026-07-26T20:00:00.000Z",
  requestedUrl: form.listingUrl,
  finalUrl: form.listingUrl,
  httpStatus: 200,
  officialSource: false,
  listingActive: null,
  title: "Senior Data Analyst",
  evidence: [],
  warnings: [],
};

const reconciliationResult:
  ReconciliationResult = {
  adjustment: 3,
  adjustedConfidence: 63,
  adjustedConfidenceLabel:
    "Moderate",
  summary:
    "External verification slightly strengthens the available evidence.",
  comparisons: [],
};

const draft: SavedReportDraft = {
  form,
  analysisResult,
  verificationResult,
  reconciliationResult,
};

describe("report storage", () => {
  it("saves and loads a report", () => {
    const storage =
      createMemoryStorage();

    const report =
      createSavedReport(
        draft,
        {
          id: "report-1",
          savedAt:
            "2026-07-26T20:00:00.000Z",
        },
      );

    saveSavedReport(
      report,
      storage,
    );

    expect(
      loadSavedReports(storage),
    ).toEqual([report]);
  });

  it("orders newer reports first", () => {
    const storage =
      createMemoryStorage();

    const older =
      createSavedReport(
        draft,
        {
          id: "older",
          savedAt:
            "2026-07-25T20:00:00.000Z",
        },
      );

    const newer =
      createSavedReport(
        draft,
        {
          id: "newer",
          savedAt:
            "2026-07-26T20:00:00.000Z",
        },
      );

    saveSavedReport(
      older,
      storage,
    );

    saveSavedReport(
      newer,
      storage,
    );

    expect(
      loadSavedReports(storage).map(
        (report) => report.id,
      ),
    ).toEqual([
      "newer",
      "older",
    ]);
  });

  it("keeps only the maximum number of reports", () => {
    const storage =
      createMemoryStorage();

    for (
      let index = 0;
      index <
      MAX_SAVED_REPORTS + 5;
      index += 1
    ) {
      const report =
        createSavedReport(
          draft,
          {
            id: `report-${index}`,
            savedAt:
              new Date(
                Date.UTC(
                  2026,
                  6,
                  index + 1,
                ),
              ).toISOString(),
          },
        );

      saveSavedReport(
        report,
        storage,
      );
    }

    expect(
      loadSavedReports(storage),
    ).toHaveLength(
      MAX_SAVED_REPORTS,
    );
  });

  it("deletes and clears reports", () => {
    const storage =
      createMemoryStorage();

    const first =
      createSavedReport(
        draft,
        {
          id: "first",
          savedAt:
            "2026-07-26T18:00:00.000Z",
        },
      );

    const second =
      createSavedReport(
        draft,
        {
          id: "second",
          savedAt:
            "2026-07-26T19:00:00.000Z",
        },
      );

    saveSavedReport(
      first,
      storage,
    );

    saveSavedReport(
      second,
      storage,
    );

    const afterDelete =
      deleteSavedReport(
        "first",
        storage,
      );

    expect(
      afterDelete.map(
        (report) => report.id,
      ),
    ).toEqual(["second"]);

    clearSavedReports(storage);

    expect(
      storage.getItem(
        REPORT_STORAGE_KEY,
      ),
    ).toBeNull();
  });

  it("ignores corrupted storage data", () => {
    const storage =
      createMemoryStorage();

    storage.setItem(
      REPORT_STORAGE_KEY,
      "not valid JSON",
    );

    expect(
      loadSavedReports(storage),
    ).toEqual([]);
  });
});