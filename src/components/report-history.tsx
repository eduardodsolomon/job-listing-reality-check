"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  AnalysisInput,
  AnalysisResult,
} from "@/lib/analyze-listing";

import type { ReconciliationResult } from "@/lib/reconciliation-types";

import {
  clearSavedReports,
  createSavedReport,
  deleteSavedReport,
  downloadSavedReport,
  downloadSavedReportHistory,
  loadSavedReports,
  MAX_SAVED_REPORTS,
  saveSavedReport,
} from "@/lib/report-storage";

import type {
  SavedReport,
  SavedReportDraft,
} from "@/lib/saved-report-types";

import type { VerificationResult } from "@/lib/verification-types";

interface ReportHistoryProps {
  form: AnalysisInput;
  analysisResult:
    AnalysisResult | null;
  verificationResult:
    VerificationResult | null;
  reconciliationResult:
    ReconciliationResult | null;
}

function riskClasses(
  score: number,
): string {
  if (score >= 70) {
    return "border-red-200 bg-red-50";
  }

  if (score >= 40) {
    return "border-amber-200 bg-amber-50";
  }

  return "border-emerald-200 bg-emerald-50";
}

function confidenceClasses(
  score: number,
): string {
  if (score >= 70) {
    return "border-emerald-200 bg-emerald-50";
  }

  if (score >= 40) {
    return "border-blue-200 bg-blue-50";
  }

  return "border-amber-200 bg-amber-50";
}

function reportTitle(
  report: SavedReport,
): string {
  return (
    report.verificationResult.title ||
    report.form.company ||
    "Untitled job listing"
  );
}

function reportSubtitle(
  report: SavedReport,
): string {
  const values = [
    report.form.company,
    report.verificationResult.location,
  ].filter(
    (value): value is string =>
      Boolean(value),
  );

  if (values.length === 0) {
    return "No company or location recorded";
  }

  return values.join(" · ");
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function ReportHistory({
  form,
  analysisResult,
  verificationResult,
  reconciliationResult,
}: ReportHistoryProps) {
  const [
    savedReports,
    setSavedReports,
  ] = useState<SavedReport[]>([]);

  const [
    feedback,
    setFeedback,
  ] = useState<string | null>(null);

  const [
    storageError,
    setStorageError,
  ] = useState<string | null>(null);

  useEffect(() => {
    setSavedReports(
      loadSavedReports(),
    );
  }, []);

  const currentDraft =
    useMemo<SavedReportDraft | null>(
      () => {
        if (
          !analysisResult ||
          !verificationResult ||
          !reconciliationResult
        ) {
          return null;
        }

        return {
          form,
          analysisResult,
          verificationResult,
          reconciliationResult,
        };
      },
      [
        form,
        analysisResult,
        verificationResult,
        reconciliationResult,
      ],
    );

  function showSuccess(
    message: string,
  ): void {
    setStorageError(null);
    setFeedback(message);
  }

  function showError(
    error: unknown,
    fallbackMessage: string,
  ): void {
    setFeedback(null);

    setStorageError(
      error instanceof Error
        ? error.message
        : fallbackMessage,
    );
  }

  function saveCurrentReport(): void {
    if (!currentDraft) {
      setFeedback(null);

      setStorageError(
        "Run both the text analysis and URL verification before saving a report.",
      );

      return;
    }

    try {
      const report =
        createSavedReport(
          currentDraft,
        );

      const nextReports =
        saveSavedReport(report);

      setSavedReports(nextReports);

      showSuccess(
        "The completed report was saved in this browser.",
      );
    } catch (error) {
      showError(
        error,
        "The report could not be saved.",
      );
    }
  }

  function exportCurrentReport(): void {
    if (!currentDraft) {
      setFeedback(null);

      setStorageError(
        "Run both the text analysis and URL verification before exporting a report.",
      );

      return;
    }

    try {
      const report =
        createSavedReport(
          currentDraft,
        );

      downloadSavedReport(report);

      showSuccess(
        "The current report was exported as JSON.",
      );
    } catch (error) {
      showError(
        error,
        "The report could not be exported.",
      );
    }
  }

  function exportAllReports(): void {
    if (savedReports.length === 0) {
      return;
    }

    try {
      downloadSavedReportHistory(
        savedReports,
      );

      showSuccess(
        "The saved report history was exported as JSON.",
      );
    } catch (error) {
      showError(
        error,
        "The report history could not be exported.",
      );
    }
  }

  function removeReport(
    reportId: string,
  ): void {
    try {
      const nextReports =
        deleteSavedReport(
          reportId,
        );

      setSavedReports(nextReports);

      showSuccess(
        "The saved report was deleted.",
      );
    } catch (error) {
      showError(
        error,
        "The report could not be deleted.",
      );
    }
  }

  function clearHistory(): void {
    const confirmed =
      window.confirm(
        "Delete all saved job-listing reports from this browser?",
      );

    if (!confirmed) {
      return;
    }

    try {
      clearSavedReports();
      setSavedReports([]);

      showSuccess(
        "All saved reports were deleted.",
      );
    } catch (error) {
      showError(
        error,
        "The report history could not be cleared.",
      );
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Saved report history
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Save completed reports in this
            browser or export them as JSON.
            Reports are not saved
            automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveCurrentReport}
            disabled={!currentDraft}
            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Save current report
          </button>

          <button
            type="button"
            onClick={exportCurrentReport}
            disabled={!currentDraft}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Export current JSON
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Saved reports may contain job
        descriptions, recruiter messages,
        company names, URLs, and analysis
        results. They remain in this browser
        until you delete them or clear browser
        storage.
      </div>

      {!currentDraft && (
        <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
          Run the text analysis and URL
          verification to enable report saving
          and export.
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
        >
          {feedback}
        </p>
      )}

      {storageError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"
        >
          {storageError}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">
            Reports saved in this browser
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {savedReports.length} of{" "}
            {MAX_SAVED_REPORTS} report slots
            used
          </p>
        </div>

        {savedReports.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAllReports}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Export all
            </button>

            <button
              type="button"
              onClick={clearHistory}
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Clear history
            </button>
          </div>
        )}
      </div>

      {savedReports.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          No reports have been saved in this
          browser.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {savedReports.map(
            (report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-950">
                      {reportTitle(report)}
                    </h4>

                    <p className="mt-1 text-sm text-slate-600">
                      {reportSubtitle(
                        report,
                      )}
                    </p>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Saved{" "}
                      {formatDate(
                        report.savedAt,
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadSavedReport(
                          report,
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Export
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeReport(
                          report.id,
                        )
                      }
                      className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div
                    className={`rounded-xl border p-3 ${riskClasses(
                      report.analysisResult
                        .ghostRisk,
                    )}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ghost risk
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {
                        report.analysisResult
                          .ghostRisk
                      }
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-3 ${riskClasses(
                      report.analysisResult
                        .scamRisk,
                    )}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Scam risk
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {
                        report.analysisResult
                          .scamRisk
                      }
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-3 ${confidenceClasses(
                      report.analysisResult
                        .confidence,
                    )}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Text confidence
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {
                        report.analysisResult
                          .confidence
                      }
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-3 ${confidenceClasses(
                      report
                        .reconciliationResult
                        .adjustedConfidence,
                    )}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Adjusted confidence
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-950">
                      {
                        report
                          .reconciliationResult
                          .adjustedConfidence
                      }
                    </p>
                  </div>
                </div>

                <details className="mt-5 rounded-xl bg-slate-50 p-4">
                  <summary className="cursor-pointer font-semibold text-slate-900">
                    Review saved evidence
                  </summary>

                  <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Listing URL
                      </p>

                      <p className="mt-1 break-all">
                        {report.form
                          .listingUrl ||
                          "No URL recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        Verification
                      </p>

                      <p className="mt-1">
                        {
                          report
                            .verificationResult
                            .status
                        }{" "}
                        ·{" "}
                        {
                          report
                            .verificationResult
                            .provider
                        }
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        Reconciliation summary
                      </p>

                      <p className="mt-1">
                        {
                          report
                            .reconciliationResult
                            .summary
                        }
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        Evidence comparisons
                      </p>

                      {report
                        .reconciliationResult
                        .comparisons.length ===
                      0 ? (
                        <p className="mt-2">
                          No comparison details
                          were saved.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {report.reconciliationResult.comparisons.map(
                            (
                              comparison,
                            ) => (
                              <li
                                key={
                                  comparison.field
                                }
                                className="rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <strong>
                                  {
                                    comparison.label
                                  }
                                  :
                                </strong>{" "}
                                {
                                  comparison.status
                                }{" "}
                                (
                                {comparison.adjustment >
                                0
                                  ? "+"
                                  : ""}
                                {
                                  comparison.adjustment
                                }{" "}
                                points)
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </details>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}