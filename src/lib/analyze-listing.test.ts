import { describe, expect, it } from "vitest";

import { analyzeListing } from "./analyze-listing";

function createDescription(wordCount = 120): string {
  return Array.from(
    { length: wordCount },
    (_, index) => `responsibility${index + 1}`,
  ).join(" ");
}

describe("analyzeListing", () => {
  it("recognizes a transparent listing with a requisition and salary", () => {
    const result = analyzeListing({
      company: "Example Company",
      listingUrl: "https://example.com/careers/ABC-123",
      listingText: `
        Job ID: ABC-123
        Salary: $80,000 - $95,000
        ${createDescription()}
      `,
      recruiterMessage: "",
    });

    expect(result.ghostRisk).toBe(0);
    expect(result.scamRisk).toBe(0);
    expect(result.confidence).toBe(75);
    expect(result.ghostLabel).toBe("Low");
    expect(result.rulesetVersion).toBe("0.2.0");
  });

  it("flags pipeline and contingent-award language", () => {
    const result = analyzeListing({
      company: "Example Contractor",
      listingUrl: "https://example.com/jobs/REQ-456",
      listingText: `
        Requisition ID: REQ-456
        Compensation: $45 per hour

        This is an evergreen requisition for future opportunities.
        Employment is contingent upon contract award.

        ${createDescription()}
      `,
      recruiterMessage: "",
    });

    expect(result.ghostRisk).toBe(65);
    expect(result.ghostLabel).toBe("High");

    expect(result.signals.map((signal) => signal.id)).toContain(
      "pipeline-language",
    );

    expect(result.signals.map((signal) => signal.id)).toContain(
      "contingent-award",
    );
  });

  it("treats fake-check and equipment language as critical", () => {
    const result = analyzeListing({
      company: "Example Company",
      listingUrl: "https://example.com/jobs/ABC-789",
      listingText: `
        Job ID: ABC-789
        Salary: $85,000 - $100,000
        ${createDescription()}
      `,
      recruiterMessage: `
        Contact the hiring manager through Telegram.
        No interview is required.
        We will send you a check so you can purchase equipment
        from our approved vendor.
      `,
    });

    expect(result.scamRisk).toBe(100);
    expect(result.scamLabel).toBe("Critical");

    expect(result.signals.map((signal) => signal.id)).toContain(
      "fake-check",
    );

    expect(result.signals.map((signal) => signal.id)).toContain(
      "payment-request",
    );
  });

  it("scores a short and incomplete listing as moderate ghost risk", () => {
    const result = analyzeListing({
      company: "",
      listingUrl: "",
      listingText: "Data analyst needed for a remote opportunity.",
      recruiterMessage: "",
    });

    expect(result.ghostRisk).toBe(40);
    expect(result.ghostLabel).toBe("Moderate");
    expect(result.confidence).toBe(20);
    expect(result.confidenceLabel).toBe("Low");
  });
});