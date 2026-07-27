import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AnalysisInput,
  AnalysisResult,
} from "./analysis-types";

import {
  createSavedReport,
  isSavedReport,
} from "./report-storage";

const form:
  AnalysisInput = {
  company: "Example",
  listingUrl: "",
  listingText:
    "Complete job description",
  recruiterMessage: "",
  opportunityType:
    "standard",
};

const analysisResult:
  AnalysisResult = {
  rulesetVersion: "0.2.0",
  ghostRisk: 20,
  ghostLabel: "Low",
  scamRisk: 10,
  scamLabel: "Low",
  confidence: 60,
  confidenceLabel:
    "Moderate",
  recommendation:
    "Continue checking.",
  signals: [],
  questions: [],
};

describe("reports without URL verification", () => {
  it("creates a valid report with null verification fields", () => {
    const report =
      createSavedReport({
        form,
        analysisResult,
        verificationResult:
          null,
        reconciliationResult:
          null,
      });

    expect(
      isSavedReport(report),
    ).toBe(true);

    expect(
      report.verificationResult,
    ).toBeNull();
  });
});
