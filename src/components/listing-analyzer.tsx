"use client";

import {
  type FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

import ActionPlan from "@/components/action-plan";
import JobHealthDashboard from "@/components/job-health-dashboard";
import ReportHistory from "@/components/report-history";
import ResearchAssistantPanel from "@/components/research-assistant-panel";
import SpecializedProfilePanel from "@/components/specialized-profile-panel";
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
} from "@/lib/presentation";

import type { ReconciliationResult } from "@/lib/reconciliation-types";

import { buildResearchTasks } from "@/lib/research-assistant";

import { analyzeSpecializedProfile } from "@/lib/opportunity-analysis";

import {
  applySpecializedProfile,
  mergeSpecializedNextSteps,
} from "@/lib/specialized-presentation";

import {
  getOpportunitySubtypeOptions,
  OPPORTUNITY_TYPE_OPTIONS,
  type OpportunitySubtype,
  type OpportunityType,
} from "@/lib/specialized-analysis-types";

import type { VerificationResult } from "@/lib/verification-types";

const emptyForm: AnalysisInput = {
  company: "",
  listingUrl: "",
  listingText: "",
  recruiterMessage: "",
  opportunityType: "standard",
  opportunitySubtype: undefined,
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

  const opportunityType =
    form.opportunityType ??
    "standard";

  const subtypeOptions =
    getOpportunitySubtypeOptions(
      opportunityType,
    );

  function updateField(
    field: keyof AnalysisInput,
    value:
      AnalysisInput[keyof AnalysisInput],
  ): void {
    setForm(
      (current) => ({
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

  function changeOpportunityType(
    value: OpportunityType,
  ): void {
    setForm(
      (current) => ({
        ...current,
        opportunityType: value,
        opportunitySubtype:
          undefined,
      }),
    );
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();

    if (!form.listingText.trim()) {
      setFormError(
        "Paste the job description and any additional context before checking the job.",
      );

      return;
    }

    setFormError(null);

    setAnalysisResult(
      analyzeListing({
        ...form,
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
      (current) =>
        current + 1,
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

  const specializedResult =
    useMemo(
      () =>
        analyzeSpecializedProfile(
          form,
        ),
      [form],
    );

  const jobHealthProfile =
    useMemo(() => {
      if (!analysisResult) {
        return null;
      }

      const baseProfile =
        buildJobHealthProfile(
          analysisResult,
          verificationResult,
          reconciliationResult,
        );

      return applySpecializedProfile(
        baseProfile,
        specializedResult,
      );
    }, [
      analysisResult,
      verificationResult,
      reconciliationResult,
      specializedResult,
    ]);

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
    useMemo(() => {
      if (!analysisResult) {
        return [];
      }

      const baseGroups =
        buildNextStepGroups(
          analysisResult,
          verificationResult,
          Boolean(
            form.listingUrl.trim(),
          ),
        );

      return mergeSpecializedNextSteps(
        baseGroups,
        specializedResult,
      );
    }, [
      analysisResult,
      verificationResult,
      form.listingUrl,
      specializedResult,
    ]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8"
      >

        <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
          Add the job information
        </h2>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-800">
          Select the type of opportunity,
          then paste the information you
          received.
        </p>

<label className="mt-6 block">
          <span className="text-lg font-black text-slate-950">Company Name</span>

          <input
            type="text"
            value={form.company}
            onChange={(event) =>
              updateField(
                "company",
                event.target.value,
              )
            }
            placeholder="Optional — Example: Example Health; recruiting agency: Talent Partners"
            className="mt-2 min-h-14 w-full rounded-2xl border-2 border-slate-400 px-4 py-3 text-lg text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
          />
        </label>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <label className="block">
            <span className="text-lg font-black text-slate-950">Job Description and any additional context <span aria-hidden="true" className="text-red-700">*</span><span className="sr-only"> required</span></span>

            <textarea
              value={form.listingText}
              onChange={(event) =>
                updateField(
                  "listingText",
                  event.target.value,
                )
              }
              placeholder="Required — Paste as much information about the listing as you can find. Example: job title, company, pay, location, schedule, duties, qualifications, benefits, job number, and application instructions."
              required
              className="mt-2 min-h-96 w-full rounded-2xl border-2 border-slate-400 px-4 py-4 text-lg leading-8 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
            />
          </label>

          <div>
            
    <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="text-lg font-black text-slate-950">
                  Type of Job
                </span>
    
                <select
                  value={opportunityType}
                  onChange={(event) =>
                    changeOpportunityType(
                      event.target
                        .value as OpportunityType,
                    )
                  }
                  className="mt-2 min-h-14 w-full rounded-2xl border-2 border-slate-400 bg-white px-4 py-3 text-lg text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                  {OPPORTUNITY_TYPE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {`Optional — ${option.label}`}
                      </option>
                    ),
                  )}
                </select>
              </label>
    
              {subtypeOptions.length >
                0 && (
                <label className="block">
                  <span className="text-lg font-black text-slate-950">
                    More specific job type
                  </span>
    
                  <span className="mt-1 block text-base text-slate-700">
                    Optional — Choose the closest match
                  </span>
    
                  <select
                    value={
                      form.opportunitySubtype ??
                      ""
                    }
                    onChange={(event) =>
                      updateField(
                        "opportunitySubtype",
                        event.target
                          .value as OpportunitySubtype,
                      )
                    }
                    className="mt-2 min-h-14 w-full rounded-2xl border-2 border-slate-400 bg-white px-4 py-3 text-lg text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
                  >
                    <option value="">
                      Select a more specific type
                    </option>
    
                    {subtypeOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}
            </div>

            <label className="block">
              <span className="text-lg font-black text-slate-950">Recruiter message</span>

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
                placeholder="Optional — Example: recruiter email, text, LinkedIn message, agency name, contact details, interview details, or follow-up answers."
                className="mt-2 min-h-64 w-full rounded-2xl border-2 border-slate-400 px-4 py-4 text-lg leading-8 text-slate-950 outline-none focus-visible:border-violet-700 focus-visible:ring-4 focus-visible:ring-violet-200"
              />
            </label>

            <label className="mt-6 block">
              <span className="text-lg font-black text-slate-950">Job URL</span>

              <input
                type="url"
                value={form.listingUrl}
                onChange={(event) =>
                  updateField(
                    "listingUrl",
                    event.target.value,
                  )
                }
                placeholder="Optional, but highly recommended — Example: https://organization.org/careers/job-123"
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

          <SpecializedProfilePanel
            result={
              specializedResult
            }
          />

          <ActionPlan
            groups={nextStepGroups}
            warningSignals={warningSignals}
          />

          <ResearchAssistantPanel
            tasks={buildResearchTasks(
              form,
              analysisResult,
              verificationResult,
              reconciliationResult,
            )}
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