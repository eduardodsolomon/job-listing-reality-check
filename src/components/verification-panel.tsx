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

import { reconcileVerification } from "@/lib/reconcile-verification";

import type {
  ComparisonStatus,
  ReconciliationResult,
} from "@/lib/reconciliation-types";

import type {
  EvidenceKind,
  VerificationApiResponse,
  VerificationProvider,
  VerificationResult,
  VerificationStatus,
} from "@/lib/verification-types";

interface VerificationPanelProps {
  form: AnalysisInput;
  analysisResult: AnalysisResult | null;
}

function statusLabel(
  status: VerificationStatus,
): string {
  switch (status) {
    case "verified":
      return "Public ATS record verified";
    case "reachable":
      return "Page reachable";
    case "not-found":
      return "Listing not found";
    case "blocked":
      return "Verification blocked";
    default:
      return "Verification incomplete";
  }
}

function statusClasses(
  status: VerificationStatus,
): string {
  switch (status) {
    case "verified":
      return "border-emerald-300 bg-emerald-50";
    case "reachable":
      return "border-blue-300 bg-blue-50";
    case "not-found":
      return "border-amber-300 bg-amber-50";
    default:
      return "border-red-300 bg-red-50";
  }
}

function evidenceClasses(
  kind: EvidenceKind,
): string {
  switch (kind) {
    case "positive":
      return "border-emerald-200 bg-emerald-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    default:
      return "border-slate-200 bg-slate-50";
  }
}

function comparisonClasses(
  status: ComparisonStatus,
): string {
  switch (status) {
    case "match":
      return "border-emerald-200 bg-emerald-50";
    case "partial":
      return "border-blue-200 bg-blue-50";
    case "mismatch":
      return "border-red-200 bg-red-50";
    default:
      return "border-slate-200 bg-slate-50";
  }
}

function comparisonLabel(
  status: ComparisonStatus,
): string {
  switch (status) {
    case "match":
      return "Match";
    case "partial":
      return "Partial match";
    case "mismatch":
      return "Mismatch";
    default:
      return "Not established";
  }
}

function providerLabel(
  provider: VerificationProvider,
): string {
  switch (provider) {
    case "greenhouse":
      return "Greenhouse";
    case "lever":
      return "Lever";
    default:
      return "General webpage";
  }
}

function adjustmentText(
  adjustment: number,
): string {
  if (adjustment > 0) {
    return `+${adjustment}`;
  }

  return String(adjustment);
}

function ReconciliationSection({
  reconciliation,
}: {
  reconciliation: ReconciliationResult;
}) {
  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-800">
        Verification-adjusted confidence
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-4xl font-bold text-slate-950">
            {reconciliation.adjustedConfidence}
          </p>

          <p className="text-sm font-semibold text-slate-700">
            {
              reconciliation.adjustedConfidenceLabel
            } confidence
          </p>
        </div>

        <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-900">
          {adjustmentText(
            reconciliation.adjustment,
          )}{" "}
          verification adjustment
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">
        {reconciliation.summary}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {reconciliation.comparisons.map(
          (item) => (
            <article
              key={item.field}
              className={`rounded-xl border p-4 ${comparisonClasses(
                item.status,
              )}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-bold text-slate-950">
                  {item.label}
                </h4>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                  {comparisonLabel(
                    item.status,
                  )}
                </span>
              </div>

              {item.submittedValue && (
                <p className="mt-3 break-words text-sm text-slate-700">
                  <strong>Submitted:</strong>{" "}
                  {item.submittedValue}
                </p>
              )}

              {item.verifiedValue && (
                <p className="mt-2 break-words text-sm text-slate-700">
                  <strong>Verified:</strong>{" "}
                  {item.verifiedValue}
                </p>
              )}

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {item.explanation}
              </p>

              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                {adjustmentText(
                  item.adjustment,
                )}{" "}
                confidence points
              </p>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

export default function VerificationPanel({
  form,
  analysisResult,
}: VerificationPanelProps) {
  const listingUrl =
    form.listingUrl;

  const [result, setResult] =
    useState<VerificationResult | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [listingUrl]);

  const reconciliation = useMemo(() => {
    if (!result || !analysisResult) {
      return null;
    }

    return reconcileVerification(
      form,
      analysisResult,
      result,
    );
  }, [form, analysisResult, result]);

  async function runVerification() {
    const normalizedUrl =
      listingUrl.trim();

    if (!normalizedUrl) {
      setError(
        "Add the public job-listing URL above before running external verification.",
      );

      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        "/api/verify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            listingUrl: normalizedUrl,
          }),
        },
      );

      const payload =
        (await response.json()) as VerificationApiResponse;

      if (
        !response.ok ||
        !payload.ok ||
        !payload.result
      ) {
        throw new Error(
          payload.error ??
            "The listing could not be verified.",
        );
      }

      setResult(payload.result);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "The listing could not be verified.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            External URL verification
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Check whether the submitted URL
            currently returns a public posting.
            Greenhouse and Lever listings receive
            posting-ID verification. Other sites
            receive a limited page and
            structured-data check.
          </p>
        </div>

        <button
          type="button"
          onClick={runVerification}
          disabled={
            isLoading ||
            !listingUrl.trim()
          }
          className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading
            ? "Checking..."
            : "Verify listing URL"}
        </button>
      </div>

      {!listingUrl.trim() && (
        <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
          Add a public listing URL in the form
          above to use this check.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-950"
        >
          <strong>
            Verification could not be completed.
          </strong>

          <p className="mt-1">
            {error}
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-5">
          <div
            className={`rounded-2xl border p-5 ${statusClasses(
              result.status,
            )}`}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Verification result
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-950">
              {statusLabel(
                result.status,
              )}
            </h3>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-600">
                  Source type
                </dt>

                <dd className="mt-1 text-slate-950">
                  {providerLabel(
                    result.provider,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-600">
                  Official-source evidence
                </dt>

                <dd className="mt-1 text-slate-950">
                  {result.officialSource
                    ? "Supported public ATS endpoint"
                    : "Not established"}
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-600">
                  Active status
                </dt>

                <dd className="mt-1 text-slate-950">
                  {result.listingActive ===
                  null
                    ? "Unknown"
                    : result.listingActive
                      ? "Appears active"
                      : "Not active"}
                </dd>
              </div>

              {result.title && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Detected title
                  </dt>

                  <dd className="mt-1 text-slate-950">
                    {result.title}
                  </dd>
                </div>
              )}

              {result.company && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Detected company
                  </dt>

                  <dd className="mt-1 text-slate-950">
                    {result.company}
                  </dd>
                </div>
              )}

              {result.location && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Detected location
                  </dt>

                  <dd className="mt-1 text-slate-950">
                    {result.location}
                  </dd>
                </div>
              )}

              {result.postingId && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Posting ID
                  </dt>

                  <dd className="mt-1 break-all text-slate-950">
                    {result.postingId}
                  </dd>
                </div>
              )}

              {result.requisitionId && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Requisition identifier
                  </dt>

                  <dd className="mt-1 break-all text-slate-950">
                    {
                      result.requisitionId
                    }
                  </dd>
                </div>
              )}

              <div>
                <dt className="font-semibold text-slate-600">
                  Checked
                </dt>

                <dd className="mt-1 text-slate-950">
                  {new Date(
                    result.checkedAt,
                  ).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-bold text-slate-950">
              Verification evidence
            </h3>

            <div className="mt-3 space-y-3">
              {result.evidence.map(
                (evidence, index) => (
                  <article
                    key={`${evidence.label}-${index}`}
                    className={`rounded-xl border p-4 ${evidenceClasses(
                      evidence.kind,
                    )}`}
                  >
                    <p className="font-semibold text-slate-950">
                      {evidence.label}
                    </p>

                    <p className="mt-1 break-words text-sm leading-6 text-slate-700">
                      {evidence.value}
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>

          {analysisResult ? (
            reconciliation && (
              <ReconciliationSection
                reconciliation={
                  reconciliation
                }
              />
            )
          ) : (
            <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
              Run the text analysis to calculate
              a verification-adjusted confidence
              score.
            </p>
          )}

          {result.warnings.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-950">
                Limitations
              </h3>

              <ul className="mt-3 space-y-2">
                {result.warnings.map(
                  (warning) => (
                    <li
                      key={warning}
                      className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"
                    >
                      {warning}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}