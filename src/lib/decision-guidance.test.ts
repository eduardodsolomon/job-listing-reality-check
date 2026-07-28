import { UI_COPY } from "../content/ui-copy";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Signal,
} from "./analysis-types";

import {
  buildThingsToCheckQuestions,
  prepareDecisionGroups,
} from "./decision-guidance";

import type {
  NextStepGroup,
} from "./presentation";

const groups: NextStepGroup[] = [
  {
    id: "gather-information",
    title:
      UI_COPY.nextSteps.gatherInformation,
    summary:
      "Find missing information.",
    items: [
      "Find the complete posting on the employer’s official careers website.",
      "Review the official company careers website for the complete posting.",
      "Ask the recruiter for the salary range.",
    ],
  },
  {
    id: "red-flags",
    title:
      "Review the red flags",
    summary:
      "Protect yourself.",
    items: [
      "Do not provide personal information until the employer is verified.",
    ],
  },
  {
    id: "green-flags",
    title:
      "Review the green flags",
    summary:
      "Review positive evidence.",
    items: [
      "The URL check returned an active public job record.",
    ],
  },
];

describe("decision guidance", () => {
  it("removes repeated gather instructions", () => {
    const prepared =
      prepareDecisionGroups(groups);

    expect(
      prepared[0].items,
    ).toHaveLength(2);
  });

  it("turns red and green guidance into questions", () => {
    const prepared =
      prepareDecisionGroups(groups);

    expect(
      prepared[1].items[0],
    ).toMatch(/\?$/);

    expect(
      prepared[2].items[0],
    ).toMatch(/\?$/);
  });

  it("creates specific questions from warning signals", () => {
    const signal: Signal = {
      id: "missing-salary",
      category:
        "listing-quality",
      target: "ghost",
      title:
        "Salary information is missing",
      explanation:
        "The listing does not include a pay range.",
      points: 5,
      type: "warning",
    };

    const questions =
      buildThingsToCheckQuestions([
        signal,
      ]);

    expect(
      questions.join(" "),
    ).toContain(
      "salary",
    );
  });
});