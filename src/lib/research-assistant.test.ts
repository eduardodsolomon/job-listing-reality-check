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
  buildResearchTasks,
} from "./research-assistant";

const form:
  AnalysisInput = {
  company: "Example Health",
  listingUrl: "",
  listingText:
    "Senior Data Analyst",
  recruiterMessage: "",
  opportunityType:
    "standard",
};

const analysis:
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
  questions: [
    "What is the salary range?",
  ],
};

describe("research assistant", () => {
  it("suggests finding the official listing when the URL is missing", () => {
    const tasks =
      buildResearchTasks(
        form,
        analysis,
        null,
        null,
      );

    expect(
      tasks.some(
        (task) =>
          task.id ===
          "find-official-listing",
      ),
    ).toBe(true);
  });

  it("turns unanswered analysis questions into research tasks", () => {
    const tasks =
      buildResearchTasks(
        form,
        analysis,
        null,
        null,
      );

    expect(
      tasks.some(
        (task) =>
          task.title.includes(
            "salary",
          ),
      ),
    ).toBe(true);
  });
});
