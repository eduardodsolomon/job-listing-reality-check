"use client";

import {
  type ChangeEvent,
  useMemo,
  useState,
} from "react";

import {
  analyzeBatchJobs,
  batchResultMatches,
  BATCH_TEMPLATE,
  MAX_BATCH_JOBS,
  parseBatchJobs,
  type BatchJobResult,
} from "@/lib/batch-analysis";

import type {
  HealthBand,
  JobHealthMetric,
} from "@/lib/presentation";

function scoreClasses(
  band: HealthBand,
): string {
  switch (band) {
    case "excellent":
    case "good":
      return "border-emerald-600 bg-emerald-50 text-emerald-950";

    case "fair":
      return "border-amber-600 bg-amber-50 text-amber-950";

    case "poor":
      return "border-orange-700 bg-orange-50 text-orange-950";

    case "critical":
      return "border-red-700 bg-red-50 text-red-950";

    default:
      return "border-slate-400 bg-slate-100 text-slate-900";
  }
}

function metric(
  result: BatchJobResult,
  id:
    | "listing-quality"
    | "personal-safety"
    | "evidence-quality",
): JobHealthMetric | undefined {
  return result.profile.metrics.find(
    (item) => item.id === id,
  );
}

function downloadTemplate(): void {
  const blob = new Blob(
    [BATCH_TEMPLATE],
    {
      type: "text/csv;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download =
    "job-reality-check-template.csv";

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function BatchAnalyzer() {
  const [input, setInput] =
    useState(BATCH_TEMPLATE);

  const [results, setResults] =
    useState<BatchJobResult[]>([]);

  const [errors, setErrors] =
    useState<string[]>([]);

  const [query, setQuery] =
    useState("");

  const [fileName, setFileName] =
    useState<string | null>(null);

  async function loadFile(
    event:
      ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const text =
      await file.text();

    setInput(text);
    setFileName(file.name);
    setResults([]);
    setErrors([]);
  }

  function analyze(): void {
    const parsed =
      parseBatchJobs(input);

    setErrors(parsed.errors);
    setResults(
      analyzeBatchJobs(
        parsed.jobs,
      ),
    );
  }

  const filteredResults =
    useMemo(
      () =>
        results.filter(
          (result) =>
            batchResultMatches(
              result,
              query,
            ),
        ),
      [results, query],
    );

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
        <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
          Analyze up to {MAX_BATCH_JOBS} jobs
        </h2>

        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-800">
          Upload a CSV or TSV file, or paste
          spreadsheet data below. Every row
          must include a job description.
          Other columns are optional.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-violet-700 bg-violet-700 px-5 py-3 text-lg font-black text-white hover:bg-violet-600">
            Upload CSV or TSV
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
              onChange={(event) => {
                void loadFile(event);
              }}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={downloadTemplate}
            className="min-h-14 rounded-2xl border-2 border-slate-500 bg-white px-5 py-3 text-lg font-black text-slate-950"
          >
            Download template
          </button>
        </div>

        {fileName && (
          <p className="mt-3 text-base font-bold text-slate-700">
            Loaded: {fileName}
          </p>
        )}

        <label className="mt-6 block">
          <span className="text-lg font-black text-slate-950">
            Batch job data
          </span>

          <span className="mt-1 block text-base text-slate-700">
            Required column:
            job_description. Optional columns:
            company, recruiter_message,
            job_url, job_type, and
            job_subtype.
          </span>

          <textarea
            value={input}
            onChange={(event) => {
              setInput(
                event.target.value,
              );
            }}
            className="mt-3 min-h-80 w-full rounded-2xl border-2 border-slate-400 px-4 py-4 font-mono text-base leading-7 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
          />
        </label>

        <button
          type="button"
          onClick={analyze}
          className="mt-5 min-h-14 rounded-2xl border-2 border-violet-800 bg-violet-800 px-6 py-3 text-lg font-black text-white hover:bg-violet-700"
        >
          Analyze batch
        </button>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border-2 border-amber-600 bg-amber-50 p-5"
          >
            <h3 className="text-lg font-black text-amber-950">
              Import notes
            </h3>

            <ul className="mt-3 space-y-2 text-base font-bold leading-7 text-amber-950">
              {errors.map(
                (error) => (
                  <li key={error}>
                    • {error}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <section className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-950">
                Batch results
              </h2>

              <p className="mt-2 text-lg text-slate-700">
                Showing{" "}
                {filteredResults.length} of{" "}
                {results.length} jobs
              </p>
            </div>

            <label className="block w-full lg:max-w-md">
              <span className="text-base font-black text-slate-950">
                Quick search
              </span>

              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(
                    event.target.value,
                  );
                }}
                placeholder="Search company, warning, type, or keyword"
                className="mt-2 min-h-12 w-full rounded-xl border-2 border-slate-400 px-4 py-2 text-base"
              />
            </label>
          </div>

          <div className="mt-6 space-y-5">
            {filteredResults.map(
              (result) => {
                const listing =
                  metric(
                    result,
                    "listing-quality",
                  );

                const safety =
                  metric(
                    result,
                    "personal-safety",
                  );

                const evidence =
                  metric(
                    result,
                    "evidence-quality",
                  );

                return (
                  <article
                    key={
                      result.input
                        .sourceRow
                    }
                    className="rounded-3xl border-2 border-slate-300 p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-violet-800">
                          Row{" "}
                          {
                            result.input
                              .sourceRow
                          }
                        </p>

                        <h3 className="mt-1 text-2xl font-black text-slate-950">
                          {result.input
                            .company ||
                            "Company not provided"}
                        </h3>

                        <p className="mt-1 text-base font-bold text-slate-700">
                          {result.input
                            .opportunityType ??
                            "standard"}
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl border-2 px-5 py-3 ${scoreClasses(
                          result.profile
                            .overallBand,
                        )}`}
                      >
                        <p className="text-sm font-black uppercase tracking-wide">
                          Job health
                        </p>

                        <p className="text-4xl font-black">
                          {
                            result.profile
                              .overallScore
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[listing, safety, evidence].map(
                        (item) =>
                          item && (
                            <div
                              key={
                                item.id
                              }
                              className={`rounded-2xl border-2 p-4 ${scoreClasses(
                                item.band,
                              )}`}
                            >
                              <p className="font-black">
                                {
                                  item.label
                                }
                              </p>

                              <p className="mt-1 text-3xl font-black">
                                {item.score ??
                                  "?"}
                              </p>
                            </div>
                          ),
                      )}
                    </div>

                    {result.analysis
                      .signals.length >
                      0 && (
                      <details className="mt-5 rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
                        <summary className="cursor-pointer text-base font-black text-slate-950">
                          Review detected
                          findings
                        </summary>

                        <ul className="mt-4 space-y-2 text-base leading-7 text-slate-800">
                          {result.analysis.signals.map(
                            (
                              signal,
                            ) => (
                              <li
                                key={
                                  signal.id
                                }
                              >
                                •{" "}
                                {
                                  signal.title
                                }
                              </li>
                            ),
                          )}
                        </ul>
                      </details>
                    )}
                  </article>
                );
              },
            )}
          </div>
        </section>
      )}
    </section>
  );
}
