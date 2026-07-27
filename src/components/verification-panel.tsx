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

import type { ReconciliationResult } from "@/lib/reconciliation-types";

import type {
  VerificationApiResponse,
  VerificationResult,
} from "@/lib/verification-types";

interface VerificationPanelProps {
  form: AnalysisInput;
  analysisResult:
    AnalysisResult | null;
  requestId: number;
  onVerificationChange?: (
    verification:
      VerificationResult | null,
    reconciliation:
      ReconciliationResult | null,
  ) => void;
}

export default function VerificationPanel({
  form,
  analysisResult,
  requestId,
  onVerificationChange,
}: VerificationPanelProps) {
  const [result, setResult] =
    useState<VerificationResult | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const reconciliation =
    useMemo(() => {
      if (
        !result ||
        !analysisResult
      ) {
        return null;
      }

      return reconcileVerification(
        form,
        analysisResult,
        result,
      );
    }, [
      form,
      analysisResult,
      result,
    ]);

  useEffect(() => {
    onVerificationChange?.(
      result,
      reconciliation,
    );
  }, [
    result,
    reconciliation,
    onVerificationChange,
  ]);

  useEffect(() => {
    if (requestId === 0) {
      setResult(null);
      setError(null);
      setIsLoading(false);

      return;
    }

    let cancelled = false;

    async function checkUrl(): Promise<void> {
      const listingUrl =
        form.listingUrl.trim();

      setIsLoading(true);
      setResult(null);
      setError(null);

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
              listingUrl,
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
              "The URL could not be checked.",
          );
        }

        if (!cancelled) {
          setResult(
            payload.result,
          );
        }
      } catch (problem) {
        if (!cancelled) {
          setError(
            problem instanceof Error
              ? problem.message
              : "The URL could not be checked.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void checkUrl();

    return () => {
      cancelled = true;
    };
  }, [
    requestId,
    form.listingUrl,
  ]);

  if (requestId === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <section
        aria-live="polite"
        className="rounded-[2rem] border-2 border-blue-500 bg-blue-50 p-6 shadow-lg"
      >
        <h2 className="text-2xl font-black text-blue-950">
          Checking the job URL…
        </h2>

        <p className="mt-3 text-lg text-blue-950">
          Looking for a public job page and
          available posting details.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="rounded-[2rem] border-4 border-red-700 bg-red-50 p-6 shadow-lg"
      >
        <h2 className="text-2xl font-black text-red-950">
          ⛔ The URL could not be checked
        </h2>

        <p className="mt-3 text-lg leading-8 text-red-950">
          {error}
        </p>
      </section>
    );
  }

  if (result) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        The URL check is complete. Its
        findings have been added to Evidence
        quality and Job health.
      </p>
    );
  }

  return null;
}