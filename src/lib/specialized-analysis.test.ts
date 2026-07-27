import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildJobHealthProfile,
  buildNextStepGroups,
} from "./presentation";

import {
  applySpecializedProfile,
  mergeSpecializedNextSteps,
} from "./specialized-presentation";

import type { AnalysisResult } from "./analysis-types";

import type { SpecializedAnalysisResult } from "./specialized-analysis-types";

const analysis: AnalysisResult = {
  rulesetVersion: "0.2.0",
  ghostRisk: 20,
  ghostLabel: "Low",
  scamRisk: 10,
  scamLabel: "Low",
  confidence: 60,
  confidenceLabel: "Moderate",
  recommendation:
    "Continue checking.",
  signals: [
    {
      id: "salary-found",
      category:
        "evidence-quality",
      target: "confidence",
      title:
        "Salary information found",
      explanation:
        "Salary was included.",
      points: 10,
      type: "positive",
    },
  ],
  questions: [],
};

const specialized:
  SpecializedAnalysisResult = {
  profileType: "contract",
  profileLabel:
    "Contract or 1099 job",
  subtype:
    "contract-1099",
  subtypeLabel:
    "1099 independent contractor",
  summary:
    "Contract checks found items to clarify.",
  adjustments: {
    listingQuality: -10,
    personalSafety: -5,
  },
  findings: [
    {
      id: "missing-duration",
      title:
        "Contract duration is missing.",
      explanation:
        "No duration was found.",
      nextStep:
        "Ask for the contract end date.",
      points: -4,
      target:
        "listing-quality",
      kind: "warning",
    },
  ],
  questions: [
    "What is the contract end date?",
  ],
};

describe("specialized presentation", () => {
  it("applies specialized adjustments to positive-facing scores", () => {
    const base =
      buildJobHealthProfile(
        analysis,
      );

    const adjusted =
      applySpecializedProfile(
        base,
        specialized,
      );

    expect(
      adjusted.metrics.find(
        (metric) =>
          metric.id ===
          "listing-quality",
      )?.score,
    ).toBe(70);

    expect(
      adjusted.metrics.find(
        (metric) =>
          metric.id ===
          "personal-safety",
      )?.score,
    ).toBe(85);
  });

  it("adds specialized questions to the action plan", () => {
    const groups =
      buildNextStepGroups(
        analysis,
        null,
        false,
      );

    const merged =
      mergeSpecializedNextSteps(
        groups,
        specialized,
      );

    expect(
      merged
        .find(
          (group) =>
            group.id ===
            "gather-information",
        )
        ?.items.join(" "),
    ).toContain(
      "contract end date",
    );
  });
});