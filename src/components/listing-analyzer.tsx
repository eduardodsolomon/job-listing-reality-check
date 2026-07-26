"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import VerificationPanel from "@/components/verification-panel";

import {
  analyzeListing,
  type AnalysisInput,
  type AnalysisResult,
  type ConfidenceLabel,
  type RiskLabel,
  type Signal,
  type SignalType,
} from "@/lib/analyze-listing";

const emptyForm: AnalysisInput = {
  company: "",
  listingUrl: "",
  listingText: "",
  recruiterMessage: "",
};

function riskCardClasses(
  label: RiskLabel | ConfidenceLabel,
): string {
  switch (label) {
    case "Critical":
      return "border-red-300 bg-red-50";
    case "High":
      return "border-orange-300 bg-orange-50";
    case "Moderate":
      return "border-amber-300 bg-amber-50";
    default:
      return "border-emerald-300 bg-emerald-50";
  }
}

function signalClasses(type: SignalType): string {
  switch (type) {
    case "critical":
      return "border-red-300 bg-red-50";
    case "warning":
      return "border-amber-300 bg-amber-50";
    default:
      return "border-emerald-300 bg-emerald-50";
  }
}

function signalImpactText(signal: Signal): string {
  if (signal.target === "confidence") {
    return `+${signal.points} confidence points`;
  }

  if (signal.target === "ghost") {
    return `+${signal.points} ghost-risk points`;
  }

  return `+${signal.points} scam-risk points`;
}

interface RiskCardProps {
  title: string;
  score: number;
  label: RiskLabel | ConfidenceLabel;
  description: string;
}

function RiskCard({
  title,
  score,
  label,
  description,
}: RiskCardProps) {
  return (
    <section
      className={`rounded-2xl border p-5 ${riskCardClasses(label)}`}
      aria-label={`${title}: ${score} out of 100, ${label}`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </p>

      <div className="mt-2 flex items-end gap-2">
        <span className="text-4xl font-bold text-slate-950">{score}</span>
        <span className="pb-1 text-sm text-slate-600">out of 100</span>
      </div>

      <p className="mt-2 font-semibold text-slate-900">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    </section>
  );
}

export default function ListingAnalyzer() {
  const [form, setForm] = useState<AnalysisInput>(emptyForm);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function updateField(
  field: keyof AnalysisInput,
  value: string,
) {
  setForm((current: AnalysisInput) => ({
    ...current,
    [field]: value,
  }));
}

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.listingText.trim()) {
      return;
    }

    setResult(analyzeListing(form));
  }

  function loadExample() {
    const example: AnalysisInput = {
      company: "Example Consulting Company",
      listingUrl: "https://example.com/jobs/data-analyst",
      listingText: `
        Data Analyst – Future Opportunities

        This is an evergreen pipeline requisition for anticipated contract
        opportunities. Employment may be contingent upon contract award.

        The analyst will support reporting, dashboards, and other duties as
        assigned. Qualified applicants should have experience with Excel,
        SQL, and business intelligence tools.
      `,
      recruiterMessage: `
        Contact our recruiter through Telegram today. No interview is required.
        We will send you a check so that you can purchase equipment from our
        approved vendor.
      `,
    };

    setForm(example);
    setResult(analyzeListing(example));
  }

  function resetForm() {
    setForm(emptyForm);
    setResult(null);
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="font-medium text-slate-900">
              Company name
            </span>
            <span className="ml-2 text-sm text-slate-500">Optional</span>

            <input
              type="text"
              value={form.company}
              onChange={(event) =>
                updateField("company", event.target.value)
              }
              placeholder="Example Company"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
            />
          </label>

          <label className="block">
            <span className="font-medium text-slate-900">
              Listing URL
            </span>
            <span className="ml-2 text-sm text-slate-500">Optional</span>

            <input
              type="url"
              value={form.listingUrl}
              onChange={(event) =>
                updateField("listingUrl", event.target.value)
              }
              placeholder="https://company.com/careers/job-id"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
            />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="font-medium text-slate-900">
            Paste the complete job listing
          </span>

          <textarea
            required
            rows={12}
            value={form.listingText}
            onChange={(event) =>
              updateField("listingText", event.target.value)
            }
            placeholder="Copy and paste the job description here..."
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
          />
        </label>

        <label className="mt-5 block">
          <span className="font-medium text-slate-900">
            Recruiter message
          </span>
          <span className="ml-2 text-sm text-slate-500">Optional</span>

          <textarea
            rows={6}
            value={form.recruiterMessage}
            onChange={(event) =>
              updateField("recruiterMessage", event.target.value)
            }
            placeholder="Remove personal information, then paste the recruiter email or message..."
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
          />
        </label>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Remove names, phone numbers, home addresses, Social Security
          numbers, banking details, login information, and other private
          information before pasting.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!form.listingText.trim()}
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Analyze listing
          </button>

          <button
            type="button"
            onClick={loadExample}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            Load test example
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </form>

      <VerificationPanel listingUrl={form.listingUrl} />

      {result && (
        <section
          className="space-y-6"
          aria-live="polite"
          aria-label="Job listing analysis results"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <RiskCard
              title="Ghost-job risk"
              score={result.ghostRisk}
              label={result.ghostLabel}
              description="Signals that the opening may be inactive, unfunded, evergreen, or intended primarily to collect candidates."
            />

            <RiskCard
              title="Scam or phishing risk"
              score={result.scamRisk}
              label={result.scamLabel}
              description="Signals involving money, sensitive information, impersonation, suspicious communication, or unsafe recruiting practices."
            />

            <RiskCard
              title="Evidence confidence"
              score={result.confidence}
              label={result.confidenceLabel}
              description="How much usable information was supplied. This is not certainty that the listing is legitimate or fraudulent."
            />
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Recommended action
            </h2>

            <p className="mt-3 leading-7 text-slate-700">
              {result.recommendation}
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Signals detected
            </h2>

            <div className="mt-4 space-y-3">
              {result.signals.map((signal) => (
                <article
                  key={signal.id}
                  className={`rounded-2xl border p-4 ${signalClasses(
                    signal.type,
                  )}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {signal.title}
                    </h3>

                    <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                        {signalImpactText(signal)}
                    </span>


                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {signal.explanation}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Questions to ask
            </h2>

            <ol className="mt-4 space-y-3">
              {result.questions.map((question, index) => (
                <li
                  key={question}
                  className="flex gap-3 rounded-xl bg-slate-100 p-4"
                >
                  <span className="font-bold text-slate-500">
                    {index + 1}.
                  </span>
                  <span className="text-slate-800">{question}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Print results
            </button>
          </div>
        </section>
      )}
    </div>
  );
}