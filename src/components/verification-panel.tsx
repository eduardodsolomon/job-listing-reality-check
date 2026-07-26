"use client";

import { useEffect, useState } from "react";

import type {
  EvidenceKind,
  VerificationApiResponse,
  VerificationProvider,
  VerificationResult,
  VerificationStatus,
} from "@/lib/verification-types";

interface VerificationPanelProps {
  listingUrl: string;
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

export default function VerificationPanel({
  listingUrl,
}: VerificationPanelProps) {
  const [result, setResult] =
    useState<VerificationResult | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [listingUrl]);

  async function runVerification() {
    const normalizedUrl = listingUrl.trim();

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
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingUrl: normalizedUrl,
        }),
      });

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
            Check whether the submitted URL currently returns a
            public posting. Greenhouse and Lever listings receive
            posting-ID verification. Other sites receive a limited
            page and structured-data check.
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
          Add a public listing URL in the form above to use this
          check.
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
              {statusLabel(result.status)}
            </h3>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-600">
                  Source type
                </dt>

                <dd className="mt-1 text-slate-950">
                  {providerLabel(result.provider)}
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
                  {result.listingActive === null
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
                    {result.requisitionId}
                  </dd>
                </div>
              )}

              {result.datePosted && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Date posted
                  </dt>

                  <dd className="mt-1 text-slate-950">
                    {result.datePosted}
                  </dd>
                </div>
              )}

              {result.validThrough && (
                <div>
                  <dt className="font-semibold text-slate-600">
                    Valid through
                  </dt>

                  <dd className="mt-1 text-slate-950">
                    {result.validThrough}
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