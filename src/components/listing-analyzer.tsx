"use client";

import {
  type FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

import JobHealthDashboard from "@/components/job-health-dashboard";
import ReportHistory from "@/components/report-history";
import VerificationPanel from "@/components/verification-panel";

import {
  analyzeListing,
  type AnalysisInput,
  type AnalysisResult,
  type Signal,
  type SignalType,
} from "@/lib/analyze-listing";

import {
  buildJobHealthProfile,
  buildNextStepGroups,
  explainSignal,
  type NextStepGroup,
} from "@/lib/presentation";

import type { ReconciliationResult } from "@/lib/reconciliation-types";
import type { VerificationResult } from "@/lib/verification-types";

const emptyForm: AnalysisInput = {
  company: "",
  listingUrl: "",
  listingText: "",
  recruiterMessage: "",
};

function signalClasses(
  type: SignalType,
): string {
  switch (type) {
    case "critical":
      return "border-red-700 bg-red-50";

    case "warning":
      return "border-amber-500 bg-amber-50";

    default:
      return "border-emerald-500 bg-emerald-50";
  }
}

function signalSymbol(
  type: SignalType,
): string {
  switch (type) {
    case "critical":
      return "⛔";

    case "warning":
      return "!";

    default:
      return "✓";
  }
}

function isCriticalSignal(
  signal: Signal,
): boolean {
  return (
    signal.type === "critical" ||
    (
      signal.target === "scam" &&
      signal.points >= 60
    )
  );
}

function SignalCard({
  signal,
}: {
  signal: Signal;
}) {
  const explanation =
    explainSignal(signal);

  return (
    <article
      className={`rounded-3xl border-2 p-5 sm:p-6 ${signalClasses(
        signal.type,
      )}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-current bg-white text-xl font-black"
        >
          {signalSymbol(
            signal.type,
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black leading-7 text-slate-950">
            {explanation.found}
          </h3>

          <p className="mt-3 text-base font-black text-slate-700">
            {explanation.impactText}
          </p>

          <p className="mt-4 text-base leading-7 text-slate-800">
            <strong>
              Why it matters:
            </strong>{" "}
            {explanation.whyItMatters}
          </p>
        </div>
      </div>
    </article>
  );
}

function nextStepClasses(
  group: NextStepGroup,
): string {
  switch (group.id) {
    case "red-flags":
      return "border-red-700 bg-red-50";

    case "green-flags":
      return "border-emerald-600 bg-emerald-50";

    default:
      return "border-blue-600 bg-blue-50";
  }
}

function nextStepNumber(
  group: NextStepGroup,
): number {
  switch (group.id) {
    case "gather-information":
      return 1;

    case "red-flags":
      return 2;

    case "green-flags":
      return 3;
  }
}

function NextStepsPanel({
  groups,
}: {
  groups: NextStepGroup[];
}) {
  return (
    <section className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
      <p className="text-base font-black uppercase tracking-widest text-violet-800">
        Your action plan
      </p>

      <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
        What to do next
      </h2>

      <div className="mt-6 space-y-5">
        {groups.map(
          (group) => (
            <article
              key={group.id}
              className={`rounded-3xl border-2 p-5 sm:p-6 ${nextStepClasses(
                group,
              )}`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white">
                  {nextStepNumber(
                    group,
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-slate-950">
                    {group.title}
                  </h3>

                  <p className="mt-2 text-base leading-7 text-slate-800">
                    {group.summary}
                  </p>

                  <ul className="mt-4 space-y-3">
                    {group.items.map(
                      (item) => (
                        <li
                          key={item}
                          className="flex gap-3 rounded-2xl bg-white p-4 text-base font-bold leading-7 text-slate-900"
                        >
                          <span aria-hidden="true">
                            •
                          </span>

                          <span>
                            {item}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

export default function ListingAnalyzer() {
  const [form, setForm] =
    useState<AnalysisInput>(
      emptyForm,
    );

  const [
    analysisResult,
    setAnalysisResult,
  ] =
    useState<AnalysisResult | null>(
      null,
    );

  const [
    verificationResult,
    setVerificationResult,
  ] =
    useState<VerificationResult | null>(
      null,
    );

  const [
    reconciliationResult,
    setReconciliationResult,
  ] =
    useState<ReconciliationResult | null>(
      null,
    );

  const [
    verificationRequestId,
    setVerificationRequestId,
  ] = useState(0);

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    urlError,
    setUrlError,
  ] =
    useState<string | null>(
      null,
    );

  function updateField(
    field: keyof AnalysisInput,
    value: string,
  ): void {
    setForm(
      (
        current:
          AnalysisInput,
      ) => ({
        ...current,
        [field]: value,
      }),
    );

    if (
      field === "listingUrl"
    ) {
      setVerificationRequestId(0);
      setVerificationResult(null);
      setReconciliationResult(null);
      setUrlError(null);
    }
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    if (
      !form.listingText.trim() &&
      !form.recruiterMessage.trim()
    ) {
      setFormError(
        "Paste a job listing, recruiter message, or both.",
      );

      return;
    }

    setFormError(null);

    setAnalysisResult(
      analyzeListing({
        company:
          form.company.trim(),
        listingUrl:
          form.listingUrl.trim(),
        listingText:
          form.listingText.trim(),
        recruiterMessage:
          form.recruiterMessage.trim(),
      }),
    );
  }

  function checkUrl(): void {
    if (
      !form.listingUrl.trim()
    ) {
      setUrlError(
        "Add a complete public job URL before checking it.",
      );

      return;
    }

    setUrlError(null);

    setVerificationRequestId(
      (current) => current + 1,
    );
  }

  function clearForm(): void {
    setForm(emptyForm);
    setAnalysisResult(null);
    setVerificationResult(null);
    setReconciliationResult(null);
    setVerificationRequestId(0);
    setFormError(null);
    setUrlError(null);
  }

  const handleVerificationChange =
    useCallback(
      (
        verification:
          VerificationResult | null,
        reconciliation:
          ReconciliationResult | null,
      ): void => {
        setVerificationResult(
          verification,
        );

        setReconciliationResult(
          reconciliation,
        );
      },
      [],
    );

  const jobHealthProfile =
    useMemo(
      () =>
        analysisResult
          ? buildJobHealthProfile(
              analysisResult,
              verificationResult,
              reconciliationResult,
            )
          : null,
      [
        analysisResult,
        verificationResult,
        reconciliationResult,
      ],
    );

  const criticalSignals =
    useMemo(
      () =>
        analysisResult?.signals.filter(
          isCriticalSignal,
        ) ?? [],
      [analysisResult],
    );

  const warningSignals =
    useMemo(
      () =>
        analysisResult?.signals.filter(
          (signal) =>
            !isCriticalSignal(
              signal,
            ) &&
            signal.type !==
              "positive",
        ) ?? [],
      [analysisResult],
    );

  const nextStepGroups =
    useMemo(
      () =>
        analysisResult
          ? buildNextStepGroups(
              analysisResult,
              verificationResult,
              Boolean(
                form.listingUrl.trim(),
              ),
            )
          : [],
      [
        analysisResult,
        verificationResult,
        form.listingUrl,
      ],
    );

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8"
      >
        <p className="text-base font-black uppercase tracking-widest text-violet-800">
          Step 1
        </p>

        <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
          Add the job information
        </h2>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-800">
          Paste the job listing and any
          message you received. You can add
          more information later and run the
          check again.
        </p>

        <label className="mt-7 block">
          <span className="text-lg font-black text-slate-950">
            Company
          </span>

          <span className="mt-1 block text-base text-slate-700">
            Optional
          </span>

          <input
            type="text"
            value={form.company}
            onChange={(event) =>
              updateField(
                "company",
                event.target.value,
              )
            }
            placeholder="Example Health"
            className="mt-2 min-h-14 w-full rounded-2xl border-2 border-slate-400 px-4 py-3 text-lg text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
          />
        </label>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <label className="block">
            <span className="text-lg font-black text-slate-950">
              Job listing
            </span>

            <span className="mt-1 block text-base text-slate-700">
              Paste the complete posting from
              the employer’s official careers
              website when available
            </span>

            <textarea
              value={form.listingText}
              onChange={(event) =>
                updateField(
                  "listingText",
                  event.target.value,
                )
              }
              placeholder="Paste the job listing here..."
              className="mt-2 min-h-96 w-full rounded-2xl border-2 border-slate-400 px-4 py-4 text-lg leading-8 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
            />
          </label>

          <div>
            <label className="block">
              <span className="text-lg font-black text-slate-950">
                Recruiter message
              </span>

              <span className="mt-1 block text-base text-slate-700">
                Paste the email, text, direct
                message, or answers from the
                recruiter or hiring manager
              </span>

              <textarea
                value={
                  form.recruiterMessage
                }
                onChange={(event) =>
                  updateField(
                    "recruiterMessage",
                    event.target.value,
                  )
                }
                placeholder="Paste the recruiter message here..."
                className="mt-2 min-h-64 w-full rounded-2xl border-2 border-slate-400 px-4 py-4 text-lg leading-8 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
              />
            </label>

            <label className="mt-6 block">
              <span className="text-lg font-black text-slate-950">
                Public job URL
              </span>

              <span className="mt-1 block text-base text-slate-700">
                Use the posting from the
                employer’s official careers
                website when possible
              </span>

              <input
                type="url"
                value={form.listingUrl}
                onChange={(event) =>
                  updateField(
                    "listingUrl",
                    event.target.value,
                  )
                }
                placeholder="https://example.com/jobs/123"
                className="mt-2 min-h-14 w-full rounded-2xl border-2 border-slate-400 px-4 py-3 text-lg text-slate-950 outline-none focus-visible:border-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200"
              />
            </label>

            <button
              type="button"
              onClick={checkUrl}
              className="mt-3 min-h-14 w-full rounded-2xl border-2 border-blue-800 bg-blue-800 px-6 py-3 text-lg font-black text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              Check URL
            </button>

            {urlError && (
              <p
                role="alert"
                className="mt-3 rounded-2xl border-2 border-red-700 bg-red-50 p-4 text-base font-bold text-red-950"
              >
                ⛔ {urlError}
              </p>
            )}
          </div>
        </div>

        {formError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border-4 border-red-700 bg-red-50 p-5 text-lg font-black text-red-950"
          >
            ⛔ {formError}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="min-h-14 w-full rounded-2xl border-2 border-violet-800 bg-violet-800 px-6 py-3 text-lg font-black text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 sm:w-auto"
          >
            Check this job
          </button>

          <button
            type="button"
            onClick={clearForm}
            className="min-h-14 w-full rounded-2xl border-2 border-slate-500 bg-white px-6 py-3 text-lg font-black text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 sm:w-auto"
          >
            Clear
          </button>
        </div>
      </form>

      <VerificationPanel
        form={form}
        analysisResult={
          analysisResult
        }
        requestId={
          verificationRequestId
        }
        onVerificationChange={
          handleVerificationChange
        }
      />

      {analysisResult &&
        criticalSignals.length > 0 && (
        <section
          role="alert"
          className="rounded-[2rem] border-4 border-red-700 bg-red-50 p-5 shadow-lg sm:p-8"
        >
          <p className="text-base font-black uppercase tracking-widest text-red-800">
            Immediate danger warning
          </p>

          <h2 className="mt-2 text-3xl font-black leading-tight text-red-950">
            Stop before sending money or
            personal information
          </h2>

          <div className="mt-6 space-y-5">
            {criticalSignals.map(
              (signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                />
              ),
            )}
          </div>
        </section>
      )}

      {jobHealthProfile && (
        <>
          <JobHealthDashboard
            profile={
              jobHealthProfile
            }
          />

          {warningSignals.length >
            0 && (
            <section className="rounded-[2rem] border-2 border-amber-500 bg-white p-5 shadow-lg sm:p-8">
              <h2 className="text-3xl font-black text-slate-950">
                Things to check
              </h2>

              <div className="mt-6 space-y-5">
                {warningSignals.map(
                  (signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                    />
                  ),
                )}
              </div>
            </section>
          )}

          <NextStepsPanel
            groups={
              nextStepGroups
            }
          />
        </>
      )}

      <ReportHistory
        form={form}
        analysisResult={
          analysisResult
        }
        verificationResult={
          verificationResult
        }
        reconciliationResult={
          reconciliationResult
        }
      />
    </div>
  );
}