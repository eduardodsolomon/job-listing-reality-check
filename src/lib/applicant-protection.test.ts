import {
  describe,
  expect,
  it,
} from "vitest";

import type { AnalysisInput } from "./analysis-types";

import { analyzeApplicantProtection } from "./applicant-protection";

function input(
  overrides:
    Partial<AnalysisInput>,
): AnalysisInput {
  return {
    company: "Example Company",
    listingUrl: "",
    listingText: "",
    recruiterMessage: "",
    opportunityType:
      "standard",
    ...overrides,
  };
}

describe("applicant protection", () => {
  it("flags password and verification-code requests", () => {
    const result =
      analyzeApplicantProtection(
        input({
          recruiterMessage:
            "Reply with your password and one-time verification code.",
        }),
      );

    expect(
      result?.adjustments
        .personalSafety,
    ).toBeLessThanOrEqual(-30);

    expect(
      result?.findings.some(
        (finding) =>
          finding.id ===
          "protection-credentials",
      ),
    ).toBe(true);
  });

  it("flags sensitive information requested before hiring", () => {
    const result =
      analyzeApplicantProtection(
        input({
          recruiterMessage:
            "Submit your Social Security number and bank routing number with the application.",
        }),
      );

    expect(
      result?.adjustments
        .personalSafety,
    ).toBeLessThan(0);
  });

  it("does not penalize verified later-stage onboarding language", () => {
    const result =
      analyzeApplicantProtection(
        input({
          recruiterMessage:
            "After accepting the offer, enter your Social Security number through the official secure onboarding portal.",
        }),
      );

    expect(
      result?.adjustments
        .personalSafety,
    ).toBe(0);
  });

  it("rewards voluntary demographic language", () => {
    const result =
      analyzeApplicantProtection(
        input({
          listingText:
            "The separate EEO survey is voluntary. You may decline to answer.",
        }),
      );

    expect(
      result?.adjustments
        .listingQuality,
    ).toBeGreaterThan(0);
  });

  it("flags unexplained citizenship questions", () => {
    const result =
      analyzeApplicantProtection(
        input({
          listingText:
            "Applicants must state their citizenship status and place of birth.",
        }),
      );

    expect(
      result?.adjustments
        .listingQuality,
    ).toBeLessThan(0);
  });

  it("records role-specific citizenship requirements without a penalty", () => {
    const result =
      analyzeApplicantProtection(
        input({
          listingText:
            "Citizenship is required by law for this security-clearance position.",
        }),
      );

    expect(
      result?.adjustments
        .listingQuality,
    ).toBe(0);
  });

  it("flags unrelated photo requests", () => {
    const result =
      analyzeApplicantProtection(
        input({
          listingText:
            "Upload a recent headshot with your data analyst application.",
        }),
      );

    expect(
      result?.adjustments
        .listingQuality,
    ).toBeLessThan(0);
  });
});