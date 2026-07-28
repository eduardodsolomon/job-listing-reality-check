"use client";



import { UI_COPY } from "../content/ui-copy";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  AnalysisInput,
  AnalysisResult,
} from "@/lib/analyze-listing";

import {
  buildJobHealthProfile,
  healthBandForScore,
  type HealthBand,
} from "@/lib/presentation";

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

import { analyzeSpecializedProfile } from "@/lib/opportunity-analysis";

import { applySpecializedProfile } from "@/lib/specialized-presentation";

import { getOpportunityTypeLabel } from "@/lib/specialized-analysis-types";

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

function scoreClasses(
  band: HealthBand,
): string {
  switch (band) {
    case "excellent":
    case "good":
      return "border-emerald-500 bg-emerald-50 text-emerald-950";

    case "fair":
      return "border-amber-500 bg-amber-50 text-amber-950";

    case "poor":
      return "border-orange-600 bg-orange-50 text-orange-950";

    case "critical":
      return "border-red-700 bg-red-50 text-red-950";

    default:
      return "border-slate-400 bg-slate-100 text-slate-900";
  }
}

function reportTitle(
  report: SavedReport,
): string {
  return (
    report.verificationResult?.title ||
    report.form.company ||
    "Saved job report"
  );
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleString();
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
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    setSavedReports(
      loadSavedReports(),
    );
  }, []);

  const currentDraft =
    useMemo<SavedReportDraft | null>(
      () => {
        if (!analysisResult) {
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

  function success(
    value: string,
  ): void {
    setError(null);
    setMessage(value);
  }

  function failure(
    problem: unknown,
    fallback: string,
  ): void {
    setMessage(null);

    setError(
      problem instanceof Error
        ? problem.message
        : fallback,
    );
  }

  function saveCurrent(): void {
    if (!currentDraft) {
      setError(
        "Provide a job description in order to save a report.",
      );

      return;
    }

    try {
      const report =
        createSavedReport(
          currentDraft,
        );

      setSavedReports(
        saveSavedReport(report),
      );

      success(
        "Report saved in this browser.",
      );
    } catch (problem) {
      failure(
        problem,
        "The report could not be saved.",
      );
    }
  }

  function exportCurrent(): void {
    if (!currentDraft) {
      setError(
        "Run the job check before exporting.",
      );

      return;
    }

    try {
      downloadSavedReport(
        createSavedReport(
          currentDraft,
        ),
      );

      success(
        "Report exported.",
      );
    } catch (problem) {
      failure(
        problem,
        "The report could not be exported.",
      );
    }
  }

  function removeReport(
    reportId: string,
  ): void {
    try {
      setSavedReports(
        deleteSavedReport(
          reportId,
        ),
      );

      success("Report deleted.");
    } catch (problem) {
      failure(
        problem,
        "The report could not be deleted.",
      );
    }
  }

  function clearHistory(): void {
    const confirmed =
      window.confirm(
        "Delete all saved reports from this browser?",
      );

    if (!confirmed) {
      return;
    }

    clearSavedReports();
    setSavedReports([]);
    success("All reports deleted.");
  }

  return (
    <section className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-950">
            Saved reports
          </h2>

          <p className="mt-3 text-lg leading-8 text-slate-800">
            Reports stay in this browser
            unless you delete them.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={saveCurrent}
            disabled={!currentDraft}
            className="min-h-14 w-full rounded-2xl bg-violet-800 px-5 py-3 text-lg font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            Save report
          </button>

          <button
            type="button"
            onClick={exportCurrent}
            disabled={!currentDraft}
            className="min-h-14 w-full rounded-2xl border-2 border-slate-500 bg-white px-5 py-3 text-lg font-black text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400 sm:w-auto"
          >
            Export JSON
          </button>
        </div>
      </div>

      {!currentDraft && (
        <p className="mt-5 rounded-2xl bg-slate-100 p-5 text-base font-bold leading-7 text-slate-800">
          Provide a job description in order to save a report.
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-5 text-base font-bold text-emerald-950"
        >
          ✓ {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border-2 border-red-700 bg-red-50 p-5 text-base font-bold text-red-950"
        >
          ⛔ {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-black text-slate-950">
          {savedReports.length} of{" "}
          {MAX_SAVED_REPORTS} reports saved
        </p>

        {savedReports.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                downloadSavedReportHistory(
                  savedReports,
                )
              }
              className="min-h-12 rounded-xl border-2 border-slate-500 bg-white px-4 py-2 text-base font-black"
            >
              Export all
            </button>

            <button
              type="button"
              onClick={clearHistory}
              className="min-h-12 rounded-xl border-2 border-red-700 bg-white px-4 py-2 text-base font-black text-red-800"
            >
              Delete all
            </button>
          </div>
        )}
      </div>

      {savedReports.length === 0 ? (
        <p className="mt-5 rounded-2xl border-2 border-dashed border-slate-400 p-8 text-center text-lg font-bold text-slate-700">
          {UI_COPY.savedReports.noSavedReports}
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {savedReports.map(
            (report) => {
              const baseProfile =
                buildJobHealthProfile(
                  report.analysisResult,
                  report.verificationResult,
                  report.reconciliationResult,
                );

              const specialized =
                analyzeSpecializedProfile(
                  report.form,
                );

              const profile =
                applySpecializedProfile(
                  baseProfile,
                  specialized,
                );

              const listingQuality =
                profile.metrics.find(
                  (metric) =>
                    metric.id ===
                    "listing-quality",
                );

              const safety =
                profile.metrics.find(
                  (metric) =>
                    metric.id ===
                    "personal-safety",
                );

              const evidence =
                profile.metrics.find(
                  (metric) =>
                    metric.id ===
                    "evidence-quality",
                );

              const opportunityLabel =
                getOpportunityTypeLabel(
                  report.form
                    .opportunityType ??
                    "standard",
                );

              return (
                <article
                  key={report.id}
                  className="rounded-3xl border-2 border-slate-300 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-950">
                        {reportTitle(
                          report,
                        )}
                      </h3>

                      <p className="mt-2 text-base font-bold text-indigo-800">
                        {
                          opportunityLabel
                        }
                      </p>

                      <p className="mt-2 text-base text-slate-700">
                        Saved{" "}
                        {formatDate(
                          report.savedAt,
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          downloadSavedReport(
                            report,
                          )
                        }
                        className="min-h-12 rounded-xl border-2 border-slate-500 px-4 py-2 text-base font-black"
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
                        className="min-h-12 rounded-xl border-2 border-red-700 px-4 py-2 text-base font-black text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div
                      className={`rounded-2xl border-2 p-4 ${scoreClasses(
                        profile.overallBand,
                      )}`}
                    >
                      <p className="text-base font-black">
                        Job health
                      </p>

                      <p className="mt-2 text-4xl font-black">
                        {
                          profile.overallScore
                        }
                      </p>
                    </div>

                    {[
                      listingQuality,
                      safety,
                      evidence,
                    ].map(
                      (metric) =>
                        metric &&
                        metric.score !==
                          null && (
                          <div
                            key={metric.id}
                            className={`rounded-2xl border-2 p-4 ${scoreClasses(
                              healthBandForScore(
                                metric.score,
                              ),
                            )}`}
                          >
                            <p className="text-base font-black">
                              {
                                metric.label
                              }
                            </p>

                            <p className="mt-2 text-4xl font-black">
                              {
                                metric.score
                              }
                            </p>
                          </div>
                        ),
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}