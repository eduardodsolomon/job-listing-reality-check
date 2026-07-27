import {
  describe,
  expect,
  it,
} from "vitest";

import type { AnalysisInput } from "./analysis-types";

import { analyzeSpecializedProfile } from "./opportunity-analysis";

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

describe("combined opportunity analysis", () => {
  it("runs applicant protection for a standard employee job", () => {
    const result =
      analyzeSpecializedProfile(
        input({
          recruiterMessage:
            "Send your account password and verification code.",
        }),
      );

    expect(result).not.toBeNull();

    expect(
      result?.profileLabel,
    ).toBe(
      "Applicant protection checks",
    );

    expect(
      result?.adjustments
        .personalSafety,
    ).toBeLessThan(0);
  });

  it("combines job-type and applicant-protection findings", () => {
    const result =
      analyzeSpecializedProfile(
        input({
          opportunityType:
            "contract",
          opportunitySubtype:
            "contract-1099",
          listingText: `
            1099 independent contractor.
            $60 per hour.
            Six-month contract.
            30 hours per week.
            Applicants must state their
            marital status.
          `,
        }),
      );

    expect(
      result?.findings.some(
        (finding) =>
          finding.id ===
          "contract-pay",
      ),
    ).toBe(true);

    expect(
      result?.findings.some(
        (finding) =>
          finding.id ===
          "protection-family-status",
      ),
    ).toBe(true);
  });
});
