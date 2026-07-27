import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Signal,
} from "./analysis-types";

import {
  signalScoreImpact,
} from "./score-impact";

function signal(
  overrides:
    Partial<Signal>,
): Signal {
  return {
    id: "test",
    category:
      "listing-quality",
    target: "ghost",
    title: "Test signal",
    explanation:
      "Test explanation",
    points: 7,
    type: "warning",
    ...overrides,
  };
}

describe("visible score impact", () => {
  it("shows ghost-risk points as a listing-score deduction", () => {
    expect(
      signalScoreImpact(
        signal({
          target: "ghost",
          points: 7,
        }),
      ),
    ).toBe(-7);
  });

  it("shows confidence points as an evidence-score addition", () => {
    expect(
      signalScoreImpact(
        signal({
          target:
            "confidence",
          points: 7,
        }),
      ),
    ).toBe(7);
  });
});
