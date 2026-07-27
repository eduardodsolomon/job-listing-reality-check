"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  aggregateSummaryForExport,
  buildTrendDashboardSummary,
  discoverTrendRecords,
  type NormalizedTrendRecord,
  type TrendMetricSummary,
} from "@/lib/trends-dashboard";

function metricLabel(
  metric: TrendMetricSummary,
): string {
  return metric.average === null
    ? "Not enough data"
    : `${metric.average}`;
}

function metricDescriptor(
  score: number | null,
): string {
  if (score === null) {
    return "Missing";
  }

  if (score >= 85) {
    return "Strong";
  }

  if (score >= 70) {
    return "Generally sound";
  }

  if (score >= 50) {
    return "Mixed";
  }

  if (score >= 30) {
    return "Concerning";
  }

  return "Critical";
}

function metricClasses(
  score: number | null,
): string {
  if (score === null) {
    return "border-slate-400 bg-slate-100 text-slate-950";
  }

  if (score >= 70) {
    return "border-emerald-700 bg-emerald-50 text-emerald-950";
  }

  if (score >= 50) {
    return "border-amber-700 bg-amber-50 text-amber-950";
  }

  return "border-red-800 bg-red-50 text-red-950";
}

function downloadFile(
  fileName: string,
  content: string,
  type: string,
): void {
  const blob = new Blob(
    [content],
    { type },
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(
  value: string | number | null,
): string {
  const text =
    value === null
      ? ""
      : String(value);

  return `"${text.replace(
    /"/g,
    '""',
  )}"`;
}

export default function TrendsDashboard() {
  const [records, setRecords] =
    useState<NormalizedTrendRecord[]>([]);

  const [loaded, setLoaded] =
    useState(false);

  function refresh(): void {
    setRecords(
      discoverTrendRecords(
        window.localStorage,
      ),
    );
    setLoaded(true);
  }

  useEffect(() => {
    refresh();

    function handleStorage(): void {
      refresh();
    }

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  const summary =
    useMemo(
      () =>
        buildTrendDashboardSummary(
          records,
        ),
      [records],
    );

  function exportJson(): void {
    const safeSummary =
      aggregateSummaryForExport(
        summary,
      );

    downloadFile(
      "job-reality-check-aggregate-trends.json",
      JSON.stringify(
        safeSummary,
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
  }

  function exportCsv(): void {
    const safeSummary =
      aggregateSummaryForExport(
        summary,
      );

    const rows = [
      [
        "job_type",
        "record_count",
        "percentage",
        "privacy_status",
        "sanity_score_average",
        "listing_quality_average",
        "personal_safety_average",
        "evidence_quality_average",
      ],
      ...safeSummary.categories.map(
        (category) => [
          category.label,
          category.count,
          category.percentage,
          category.publishable
            ? "publishable"
            : `suppressed: fewer than ${safeSummary.privacyThreshold}`,
          category.scores
            .sanityScore.average,
          category.scores
            .listingQuality.average,
          category.scores
            .personalSafety.average,
          category.scores
            .evidenceQuality.average,
        ],
      ),
    ];

    downloadFile(
      "job-reality-check-aggregate-trends.csv",
      rows
        .map(
          (row) =>
            row
              .map(csvCell)
              .join(","),
        )
        .join("\n"),
      "text/csv;charset=utf-8",
    );
  }

  const scoreCards = [
    {
      id: "sanity",
      title: "Sanity Score",
      metric:
        summary.scores
          .sanityScore,
      explanation:
        "Average of the available positive-facing quality, safety, and evidence measures.",
    },
    {
      id: "listing",
      title: "Listing Quality",
      metric:
        summary.scores
          .listingQuality,
      explanation:
        "Higher means the opportunities show more concrete signs of an active, specific opening.",
    },
    {
      id: "safety",
      title: "Personal Safety",
      metric:
        summary.scores
          .personalSafety,
      explanation:
        "Higher means fewer scam and applicant-protection warning signs were detected.",
    },
    {
      id: "evidence",
      title: "Evidence Quality",
      metric:
        summary.scores
          .evidenceQuality,
      explanation:
        "Higher means the analysis had more specific and verifiable information to work with.",
    },
  ];

  return (
    <section className="space-y-8">
      <header className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-800">
              Version 13
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              Aggregate Trends Dashboard
            </h2>

            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-800">
              Review patterns across the anonymized research records saved locally in this browser. This dashboard does not read raw job descriptions, recruiter messages, employer names, URLs, or saved reports.
            </p>
          </div>

          <span className="w-fit rounded-full border-2 border-emerald-700 bg-emerald-50 px-4 py-2 text-sm font-black uppercase tracking-wider text-emerald-950">
            Local aggregate only
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={refresh}
            className="min-h-12 rounded-2xl border-2 border-violet-800 bg-violet-800 px-5 py-3 text-base font-black text-white hover:bg-violet-700"
          >
            Refresh local trends
          </button>

          <button
            type="button"
            onClick={exportJson}
            disabled={
              summary.totalRecords === 0
            }
            className="min-h-12 rounded-2xl border-2 border-slate-600 bg-white px-5 py-3 text-base font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export aggregate JSON
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={
              summary.totalRecords === 0
            }
            className="min-h-12 rounded-2xl border-2 border-slate-600 bg-white px-5 py-3 text-base font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export aggregate CSV
          </button>
        </div>
      </header>

      {loaded &&
      summary.totalRecords === 0 ? (
        <section className="rounded-[2rem] border-2 border-amber-700 bg-amber-50 p-5 shadow-lg sm:p-8">
          <h3 className="text-2xl font-black text-amber-950">
            No anonymized records yet
          </h3>

          <p className="mt-3 max-w-3xl text-lg leading-8 text-amber-950">
            Analyze a job, open Optional Research Contribution, review the privacy-safe record, consent, and save it locally. Return here and select Refresh local trends.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scoreCards.map(
              (card) => (
                <article
                  key={card.id}
                  className={`rounded-3xl border-2 p-5 shadow-sm ${metricClasses(
                    card.metric.average,
                  )}`}
                >
                  <p className="text-base font-black">
                    {card.title}
                  </p>

                  <div className="mt-3 flex items-end gap-3">
                    <p className="text-5xl font-black leading-none">
                      {metricLabel(
                        card.metric,
                      )}
                    </p>

                    {card.metric.average !==
                      null && (
                      <p className="pb-1 text-base font-black">
                        {metricDescriptor(
                          card.metric.average,
                        )}
                      </p>
                    )}
                  </div>

                  <p className="mt-4 text-base leading-7">
                    {card.explanation}
                  </p>

                  <p className="mt-3 text-sm font-black">
                    Based on {card.metric.available} of {summary.totalRecords} records
                  </p>
                </article>
              ),
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
              <h3 className="text-2xl font-black text-slate-950">
                Opportunity types
              </h3>

              <p className="mt-3 text-base leading-7 text-slate-700">
                Category-level score averages are protected until at least {summary.privacyThreshold} anonymized records exist in that category.
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-400">
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Job type
                      </th>
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Records
                      </th>
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Share
                      </th>
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Sanity
                      </th>
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Listing
                      </th>
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Safety
                      </th>
                      <th className="px-3 py-3 text-sm font-black uppercase tracking-wider text-slate-700">
                        Evidence
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {summary.categories.map(
                      (category) => (
                        <tr
                          key={category.key}
                          className="border-b border-slate-300"
                        >
                          <td className="px-3 py-4 font-black text-slate-950">
                            {category.label}
                          </td>
                          <td className="px-3 py-4 text-slate-800">
                            {category.count}
                          </td>
                          <td className="px-3 py-4 text-slate-800">
                            {category.percentage}%
                          </td>

                          {category.publishable ? (
                            <>
                              <td className="px-3 py-4 font-black text-slate-950">
                                {metricLabel(
                                  category.scores
                                    .sanityScore,
                                )}
                              </td>
                              <td className="px-3 py-4 font-black text-slate-950">
                                {metricLabel(
                                  category.scores
                                    .listingQuality,
                                )}
                              </td>
                              <td className="px-3 py-4 font-black text-slate-950">
                                {metricLabel(
                                  category.scores
                                    .personalSafety,
                                )}
                              </td>
                              <td className="px-3 py-4 font-black text-slate-950">
                                {metricLabel(
                                  category.scores
                                    .evidenceQuality,
                                )}
                              </td>
                            </>
                          ) : (
                            <td
                              colSpan={4}
                              className="px-3 py-4 font-bold text-slate-600"
                            >
                              Protected: fewer than {summary.privacyThreshold} records
                            </td>
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
              <h3 className="text-2xl font-black text-slate-950">
                Verification coverage
              </h3>

              <dl className="mt-6 space-y-5">
                <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
                  <dt className="text-base font-black text-slate-950">
                    URL verification attempted
                  </dt>
                  <dd className="mt-2 text-4xl font-black text-violet-900">
                    {summary.verification.attemptedRate}%
                  </dd>
                  <dd className="mt-2 text-sm font-bold text-slate-700">
                    {summary.verification.attempted} of {summary.totalRecords} records
                  </dd>
                </div>

                <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
                  <dt className="text-base font-black text-slate-950">
                    Comparison evidence available
                  </dt>
                  <dd className="mt-2 text-4xl font-black text-violet-900">
                    {summary.verification.reconciliationRate}%
                  </dd>
                  <dd className="mt-2 text-sm font-bold text-slate-700">
                    {summary.verification.reconciliationAvailable} of {summary.totalRecords} records
                  </dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
            <h3 className="text-2xl font-black text-slate-950">
              Most common detected warning categories
            </h3>

            <p className="mt-3 max-w-4xl text-base leading-7 text-slate-700">
              Counts are based only on generic signal identifiers in anonymized research records. They do not reveal employers, applicants, URLs, or raw listing content.
            </p>

            {summary.signals.length > 0 ? (
              <div className="mt-6 space-y-4">
                {summary.signals.map(
                  (signal) => (
                    <article
                      key={signal.id}
                      className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-black text-slate-950">
                          {signal.label}
                        </p>

                        <p className="font-black text-red-900">
                          {signal.count} records · {signal.percentage}%
                        </p>
                      </div>

                      <div
                        aria-hidden="true"
                        className="mt-3 h-4 overflow-hidden rounded-full border border-slate-400 bg-white"
                      >
                        <div
                          className="h-full bg-red-700"
                          style={{
                            width: `${signal.percentage}%`,
                          }}
                        />
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-base font-bold text-slate-700">
                No generic warning categories were stored in the current anonymized records.
              </p>
            )}
          </section>

          <details className="rounded-[2rem] border-2 border-violet-700 bg-violet-50 p-5 shadow-lg sm:p-8">
            <summary className="cursor-pointer text-xl font-black text-violet-950">
              Privacy and interpretation notes
            </summary>

            <div className="mt-5 space-y-4 text-base leading-7 text-violet-950">
              <p>
                This is a local research preview, not a public or representative labor-market dataset. The records reflect only jobs that this browser user chose to analyze and voluntarily save as anonymized contributions.
              </p>

              <p>
                The dashboard does not rank individual employers. Version 12 intentionally excludes company names, recruiter names, email addresses, phone numbers, URLs, raw job descriptions, recruiter messages, and account information.
              </p>

              <p>
                Category score details are suppressed below {summary.privacyThreshold} records to reduce the chance that a small group could be traced back to one opportunity.
              </p>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
