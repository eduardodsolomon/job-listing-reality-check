import {
  describe,
  expect,
  it,
} from "vitest";

import {
  analyzeListing,
} from "./analyze-listing";

import type {
  AnalysisInput,
} from "./analysis-types";

import {
  buildJobHealthProfile,
} from "./presentation";

import {
  buildResearchContribution,
  loadResearchContributions,
  MAX_RESEARCH_CONTRIBUTIONS,
  RESEARCH_CONTRIBUTION_STORAGE_KEY,
  saveResearchContribution,
  type StorageLike,
} from "./research-contribution";

class MemoryStorage
  implements StorageLike {
  private readonly data =
    new Map<string, string>();

  getItem(
    key: string,
  ): string | null {
    return this.data.get(key) ??
      null;
  }

  setItem(
    key: string,
    value: string,
  ): void {
    this.data.set(key, value);
  }

  removeItem(
    key: string,
  ): void {
    this.data.delete(key);
  }
}

const form:
  AnalysisInput = {
  company:
    "Private Employer Name",
  listingUrl:
    "https://private.example/jobs/123",
  listingText:
    "Contact Jane at jane@example.com or 617-555-0100 about this data role. Salary is $95,000.",
  recruiterMessage:
    "My bank account is 123456789 and my password is secret.",
  opportunityType:
    "standard",
  opportunitySubtype:
    undefined,
};

const analysisResult =
  analyzeListing(form);

const profile =
  buildJobHealthProfile(
    analysisResult,
  );

function record(
  id: string,
) {
  return buildResearchContribution({
    form,
    analysisResult,
    profile,
    verificationAttempted:
      true,
    reconciliationAvailable:
      false,
    id,
    createdAt:
      "2026-07-27T00:00:00.000Z",
  });
}

describe(
  "research contributions",
  () => {
    it(
      "excludes raw identifying text",
      () => {
        const contribution =
          record("record-1");

        const serialized =
          JSON.stringify(
            contribution,
          );

        expect(serialized).not
          .toContain(
            form.company,
          );

        expect(serialized).not
          .toContain(
            form.listingUrl,
          );

        expect(serialized).not
          .toContain(
            "jane@example.com",
          );

        expect(serialized).not
          .toContain(
            "617-555-0100",
          );

        expect(serialized).not
          .toContain(
            "123456789",
          );

        expect(
          contribution.companyProvided,
        ).toBe(true);

        expect(
          contribution.listingUrlProvided,
        ).toBe(true);
      },
    );

    it(
      "keeps only the newest one hundred local records",
      () => {
        const storage =
          new MemoryStorage();

        for (
          let index = 0;
          index <
          MAX_RESEARCH_CONTRIBUTIONS +
            5;
          index += 1
        ) {
          saveResearchContribution(
            record(
              `record-${index}`,
            ),
            storage,
          );
        }

        const saved =
          loadResearchContributions(
            storage,
          );

        expect(saved).toHaveLength(
          MAX_RESEARCH_CONTRIBUTIONS,
        );

        expect(saved[0].id).toBe(
          `record-${MAX_RESEARCH_CONTRIBUTIONS + 4}`,
        );

        expect(
          saved[
            saved.length - 1
          ]?.id,
        ).toBe("record-5");

        expect(
          storage.getItem(
            RESEARCH_CONTRIBUTION_STORAGE_KEY,
          ),
        ).not.toBeNull();
      },
    );
  },
);
