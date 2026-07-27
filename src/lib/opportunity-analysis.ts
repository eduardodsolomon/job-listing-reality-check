import type { AnalysisInput } from "./analysis-types";

import { analyzeApplicantProtection } from "./applicant-protection";

import {
  analyzeSpecializedProfile as analyzeJobTypeProfile,
} from "./specialized-analysis";

import {
  getOpportunitySubtypeLabel,
  type OpportunityType,
  type SpecializedAnalysisResult,
} from "./specialized-analysis-types";

function clampAdjustment(
  value: number,
): number {
  return Math.max(
    -30,
    Math.min(20, Math.ceil(value)),
  );
}

function unique(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function analyzeSpecializedProfile(
  input: AnalysisInput,
): SpecializedAnalysisResult | null {
  const jobTypeResult =
    analyzeJobTypeProfile(input);

  const protectionResult =
    analyzeApplicantProtection(input);

  if (
    !jobTypeResult &&
    !protectionResult
  ) {
    return null;
  }

  if (
    jobTypeResult &&
    !protectionResult
  ) {
    return jobTypeResult;
  }

  if (
    !jobTypeResult &&
    protectionResult
  ) {
    const profileType:
      OpportunityType =
        input.opportunityType ??
        "standard";

    return {
      profileType,
      profileLabel:
        "Applicant protection checks",
      subtype:
        input.opportunitySubtype,
      subtypeLabel:
        getOpportunitySubtypeLabel(
          input.opportunitySubtype,
        ),
      summary:
        protectionResult.summary,
      adjustments: {
        listingQuality:
          protectionResult
            .adjustments
            .listingQuality,
        personalSafety:
          protectionResult
            .adjustments
            .personalSafety,
      },
      findings:
        protectionResult.findings,
      questions:
        protectionResult.questions,
    };
  }

  if (
    !jobTypeResult ||
    !protectionResult
  ) {
    return null;
  }

  return {
    ...jobTypeResult,
    summary: [
      jobTypeResult.summary,
      protectionResult.summary,
    ].join(" "),
    adjustments: {
      listingQuality:
        clampAdjustment(
          jobTypeResult
            .adjustments
            .listingQuality +
            protectionResult
              .adjustments
              .listingQuality,
        ),
      personalSafety:
        clampAdjustment(
          jobTypeResult
            .adjustments
            .personalSafety +
            protectionResult
              .adjustments
              .personalSafety,
        ),
    },
    findings: [
      ...jobTypeResult.findings,
      ...protectionResult.findings,
    ],
    questions:
      unique([
        ...jobTypeResult.questions,
        ...protectionResult.questions,
      ]),
  };
}