import {
  healthBandForScore,
  healthLabelForScore,
  type JobHealthProfile,
  type NextStepGroup,
} from "./presentation";

import type { SpecializedAnalysisResult } from "./specialized-analysis-types";

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(100, value),
  );
}

function average(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.ceil(
    values.reduce(
      (total, value) =>
        total + value,
      0,
    ) / values.length,
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

function signed(
  value: number,
): string {
  return value > 0
    ? `+${value}`
    : String(value);
}

export function applySpecializedProfile(
  profile: JobHealthProfile,
  specialized:
    SpecializedAnalysisResult | null,
): JobHealthProfile {
  if (!specialized) {
    return profile;
  }

  const metrics =
    profile.metrics.map(
      (metric) => {
        let adjustment = 0;

        if (
          metric.id ===
          "listing-quality"
        ) {
          adjustment =
            specialized.adjustments
              .listingQuality;
        }

        if (
          metric.id ===
          "personal-safety"
        ) {
          adjustment =
            specialized.adjustments
              .personalSafety;
        }

        if (adjustment === 0) {
          return metric;
        }

        const baseScore =
          metric.score ?? 0;

        const score = clamp(
          baseScore + adjustment,
        );

        return {
          ...metric,
          score,
          band:
            healthBandForScore(
              score,
            ),
          statusLabel:
            healthLabelForScore(
              score,
            ),
          explanation:
            `${metric.explanation} Specialized ${specialized.profileLabel.toLowerCase()} checks changed this score by ${signed(adjustment)} points.`,
        };
      },
    );

  const availableScores =
    metrics
      .map((metric) => metric.score)
      .filter(
        (score): score is number =>
          score !== null,
      );

  const overallScore =
    average(availableScores);

  return {
    ...profile,
    metrics,
    overallScore,
    overallBand:
      healthBandForScore(
        overallScore,
      ),
    overallLabel:
      healthLabelForScore(
        overallScore,
      ),
    summary:
      `${profile.summary} ${specialized.summary}`,
  };
}

export function mergeSpecializedNextSteps(
  groups: NextStepGroup[],
  specialized:
    SpecializedAnalysisResult | null,
): NextStepGroup[] {
  if (!specialized) {
    return groups;
  }

  return groups.map((group) => {
    if (
      group.id ===
      "gather-information"
    ) {
      return {
        ...group,
        items: unique([
          ...group.items,
          ...specialized.questions.map(
            (question) =>
              `${question} Add the answer to the Job listing or Recruiter message box.`,
          ),
        ]),
      };
    }

    if (
      group.id === "red-flags"
    ) {
      return {
        ...group,
        items: unique([
          ...group.items,
          ...specialized.findings
            .filter(
              (finding) =>
                finding.points < 0,
            )
            .map(
              (finding) =>
                finding.nextStep,
            ),
        ]),
      };
    }

    return {
      ...group,
      items: unique([
        ...group.items,
        ...specialized.findings
          .filter(
            (finding) =>
              finding.points > 0,
          )
          .map(
            (finding) =>
              finding.nextStep,
          ),
      ]),
    };
  });
}