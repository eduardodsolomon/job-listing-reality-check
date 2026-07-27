import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AnalysisResult,
  Signal,
} from "./analysis-types";

import {
  buildJobHealthProfile,
  buildNextStepGroups,
  explainSignal,
  healthBandForScore,
} from "./presentation";

import type { ReconciliationResult } from "./reconciliation-types";
import type { VerificationResult } from "./verification-types";

const baseAnalysis:
  AnalysisResult = {
  rulesetVersion: "0.2.0",
  ghostRisk: 30,
  ghostLabel: "Moderate",
  scamRisk: 20,
  scamLabel: "Moderate",
  confidence: 55,
  confidenceLabel: "Moderate",
  recommendation:
    "Continue checking the listing.",
  signals: [],
  questions: [],
};

describe("job health presentation", () => {
  it("uses listing quality and personal safety when evidence is missing", () => {
    const profile =
      buildJobHealthProfile(
        baseAnalysis,
      );

    expect(
      profile.metrics,
    ).toHaveLength(3);

    expect(
      profile.metrics.find(
        (metric) =>
          metric.id ===
          "listing-quality",
      )?.score,
    ).toBe(70);

    expect(
      profile.metrics.find(
        (metric) =>
          metric.id ===
          "personal-safety",
      )?.score,
    ).toBe(80);

    expect(
      profile.metrics.find(
        (metric) =>
          metric.id ===
          "evidence-quality",
      )?.score,
    ).toBeNull();

    expect(
      profile.overallScore,
    ).toBe(75);
  });

  it("shows text findings without redundant source titles", () => {
    const evidenceSignal: Signal = {
      id: "salary-present",
      category:
        "evidence-quality",
      target: "confidence",
      title:
        "Salary information found",
      explanation:
        "The listing includes pay information.",
      points: 10,
      type: "positive",
    };

    const profile =
      buildJobHealthProfile({
        ...baseAnalysis,
        signals: [
          evidenceSignal,
        ],
      });

    const evidenceMetric =
      profile.metrics.find(
        (metric) =>
          metric.id ===
          "evidence-quality",
      );

    expect(
      evidenceMetric
        ?.evidenceDetails?.[0],
    ).toMatchObject({
      statement:
        "Pay information was included.",
      points: 10,
      tone: "positive",
    });
  });

  it("shows each URL comparison and its point effect", () => {
    const verification:
      VerificationResult = {
      status: "verified",
      provider: "greenhouse",
      checkedAt:
        "2026-07-26T20:00:00.000Z",
      requestedUrl:
        "https://example.com/jobs/123",
      finalUrl:
        "https://example.com/jobs/123",
      httpStatus: 200,
      officialSource: true,
      listingActive: true,
      title:
        "Senior Data Analyst",
      company:
        "Example Health",
      postingId: "123",
      evidence: [],
      warnings: [],
    };

    const reconciliation:
      ReconciliationResult = {
      adjustment: 22,
      adjustedConfidence: 77,
      adjustedConfidenceLabel:
        "High",
      summary:
        "External verification strengthens the available evidence.",
      comparisons: [
        {
          field: "source",
          label: "Public source",
          status: "match",
          verifiedValue:
            "greenhouse",
          explanation:
            "The posting was returned by a supported public applicant-tracking endpoint.",
          adjustment: 10,
        },
        {
          field:
            "active-status",
          label:
            "Active posting status",
          status: "match",
          verifiedValue:
            "Appears active",
          explanation:
            "The public source returned an active posting record.",
          adjustment: 12,
        },
      ],
    };

    const profile =
      buildJobHealthProfile(
        baseAnalysis,
        verification,
        reconciliation,
      );

    const evidenceMetric =
      profile.metrics.find(
        (metric) =>
          metric.id ===
          "evidence-quality",
      );

    expect(
      evidenceMetric?.score,
    ).toBe(77);

    expect(
      evidenceMetric
        ?.evidenceDetails?.map(
          (detail) =>
            detail.points,
        ),
    ).toEqual([
      10,
      12,
    ]);

    expect(
      evidenceMetric?.scoreNote,
    ).toContain(
      "URL check changed it by +22 points",
    );
  });

  it("always treats higher scores as better", () => {
    expect(
      healthBandForScore(95),
    ).toBe("excellent");

    expect(
      healthBandForScore(10),
    ).toBe("critical");
  });

  it("creates three next-step groups", () => {
    const groups =
      buildNextStepGroups(
        baseAnalysis,
        null,
        false,
      );

    expect(
      groups.map(
        (group) => group.id,
      ),
    ).toEqual([
      "gather-information",
      "red-flags",
      "green-flags",
    ]);
  });

  it("uses direct safety instructions", () => {
    const signal: Signal = {
      id:
        "sensitive-information",
      category:
        "phishing-safety",
      target: "scam",
      title:
        "Sensitive information requested",
      explanation:
        "The message requests a Social Security number.",
      points: 65,
      type: "critical",
    };

    expect(
      explainSignal(signal)
        .nextStep,
    ).toContain(
      "Do not provide",
    );
  });
});