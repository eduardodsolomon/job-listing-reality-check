import {
  describe,
  expect,
  it,
} from "vitest";

import {
  UI_COPY,
} from "./ui-copy";

interface CopyEntry {
  path: string;
  value: string;
}

function collectStrings(
  value: unknown,
  currentPath = "UI_COPY",
): CopyEntry[] {
  if (
    typeof value === "string"
  ) {
    return [
      {
        path:
          currentPath,

        value,
      },
    ];
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return [];
  }

  return Object.entries(value)
    .flatMap(
      ([key, child]) =>
        collectStrings(
          child,
          currentPath +
            "." +
            key,
        ),
    );
}

describe(
  "central UI copy",
  () => {
    const entries =
      collectStrings(
        UI_COPY,
      );

    it(
      "does not contain empty visible strings",
      () => {
        for (
          const entry
          of entries
        ) {
          expect(
            entry.value.trim(),
            entry.path +
              " should not be empty",
          ).not.toBe("");
        }
      },
    );

    it(
      "does not contain visual version badges",
      () => {
        for (
          const entry
          of entries
        ) {
          expect(
            entry.value,
            entry.path +
              " should not expose a feature version badge",
          ).not.toMatch(
            /^Version\s+\d+$/i,
          );
        }
      },
    );

    it(
      "uses an affirmative community contribution agreement",
      () => {
        const agreement =
          UI_COPY
            .communityContribution
            .agreement;

        expect(
          agreement,
        ).toContain(
          "Yes, submit",
        );

        expect(
          agreement,
        ).toContain(
          "de-identified",
        );

        expect(
          agreement,
        ).toContain(
          "aggregate",
        );
      },
    );
  },
);
