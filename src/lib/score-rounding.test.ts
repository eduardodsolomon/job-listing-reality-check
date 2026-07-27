import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AnalysisResult,
} from "./analysis-types";

import {
  buildJobHealthProfile,
} from "./presentation";

function analysis(
  overrides:
    Partial<AnalysisResult>,
): AnalysisResult {
  return {
    rulesetVersion: "0.2.0",
    ghostRisk: 32,
    ghostLabel: "Moderate",
    scamRisk: 31,
    scamLabel: "Moderate",
    confidence: 68,
    confidenceLabel:
      "Moderate",
    recommendation:
      "Continue checking.",
    signals: [
      {
        id:
          "supporting-information",
        category:
          "evidence-quality",
        target: "confidence",
        title:
          "Supporting information found",
        explanation:
          "The listing contains supporting information.",
        points: 1,
        type: "positive",
      },
    ],
    questions: [],
    ...overrides,
  };
}

describe("score rounding", () => {
  it("rounds fractional averages upward", () => {
    const profile =
      buildJobHealthProfile(
        analysis({}),
      );

    // (68 + 69 + 68) / 3
    // equals 68.333..., which rounds up.
    expect(
      profile.overallScore,
    ).toBe(69);
  });

  it("never returns a score above 100", () => {
    const profile =
      buildJobHealthProfile(
        analysis({
          ghostRisk: -20,
          scamRisk: -10,
          confidence: 150,
        }),
      );

    expect(
      profile.overallScore,
    ).toBe(100);

    expect(
      profile.metrics.every(
        (metric) =>
          metric.score === null ||
          metric.score <= 100,
      ),
    ).toBe(true);
  });
});