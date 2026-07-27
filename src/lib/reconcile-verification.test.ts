import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AnalysisInput,
  AnalysisResult,
} from "./analysis-types";

import { reconcileVerification } from "./reconcile-verification";

import type { VerificationResult } from "./verification-types";

const baseInput: AnalysisInput = {
  company: "Example Health",
  listingUrl:
    "https://job-boards.greenhouse.io/examplehealth/jobs/1234567",
  listingText: `
    Senior Data Analyst
    Example Health
    Boston, Massachusetts
    Requisition ID 1234567
  `,
  recruiterMessage: "",
};

const baseAnalysis: AnalysisResult = {
  rulesetVersion: "0.2.0",
  ghostRisk: 0,
  ghostLabel: "Low",
  scamRisk: 0,
  scamLabel: "Low",
  confidence: 60,
  confidenceLabel: "Moderate",
  recommendation:
    "The listing contains useful evidence.",
  signals: [],
  questions: [],
};

function verifiedResult(
  overrides: Partial<VerificationResult> = {},
): VerificationResult {
  return {
    status: "verified",
    provider: "greenhouse",
    checkedAt: "2026-07-26T18:00:00.000Z",
    requestedUrl: baseInput.listingUrl,
    finalUrl: baseInput.listingUrl,
    httpStatus: 200,
    officialSource: true,
    listingActive: true,
    title: "Senior Data Analyst",
    company: "Example Health",
    location: "Boston, Massachusetts",
    postingId: "1234567",
    evidence: [],
    warnings: [],
    ...overrides,
  };
}

describe("reconcileVerification", () => {
  it("raises confidence for a matching active ATS record", () => {
    const result = reconcileVerification(
      baseInput,
      baseAnalysis,
      verifiedResult(),
    );

    expect(result.adjustment).toBe(30);
    expect(result.adjustedConfidence).toBe(90);
    expect(
      result.adjustedConfidenceLabel,
    ).toBe("High");
  });

  it("reduces confidence for a company mismatch", () => {
    const result = reconcileVerification(
      baseInput,
      baseAnalysis,
      verifiedResult({
        company: "Different Corporation",
      }),
    );

    const companyCheck =
      result.comparisons.find(
        (item) =>
          item.field === "company",
      );

    expect(companyCheck?.status).toBe(
      "mismatch",
    );

    expect(
      companyCheck?.adjustment,
    ).toBe(-20);
  });

  it("substantially reduces confidence when the listing is inactive", () => {
    const result = reconcileVerification(
      baseInput,
      baseAnalysis,
      verifiedResult({
        status: "not-found",
        listingActive: false,
      }),
    );

    const activeCheck =
      result.comparisons.find(
        (item) =>
          item.field ===
          "active-status",
      );

    expect(activeCheck?.status).toBe(
      "mismatch",
    );

    expect(activeCheck?.adjustment).toBe(
      -25,
    );
  });

  it("gives only a small adjustment for a reachable generic page", () => {
    const result = reconcileVerification(
      baseInput,
      baseAnalysis,
      verifiedResult({
        status: "reachable",
        provider: "generic",
        officialSource: false,
        listingActive: null,
        title: undefined,
        company: undefined,
        location: undefined,
        postingId: undefined,
      }),
    );

    expect(result.adjustment).toBe(3);
    expect(result.adjustedConfidence).toBe(
      63,
    );
  });
});