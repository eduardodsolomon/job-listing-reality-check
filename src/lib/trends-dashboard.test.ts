import {
  describe,
  expect,
  it,
} from "vitest";

import {
  aggregateSummaryForExport,
  buildTrendDashboardSummary,
  discoverTrendRecords,
  MIN_PUBLIC_GROUP_SIZE,
  normalizeTrendRecord,
  type StorageLike,
} from "./trends-dashboard";

class MemoryStorage implements StorageLike {
  private readonly values:
    Map<string, string>;

  constructor(
    values:
      Record<string, string>,
  ) {
    this.values =
      new Map(
        Object.entries(values),
      );
  }

  get length(): number {
    return this.values.size;
  }

  key(
    index: number,
  ): string | null {
    return (
      Array.from(
        this.values.keys(),
      )[index] ?? null
    );
  }

  getItem(
    key: string,
  ): string | null {
    return (
      this.values.get(key) ?? null
    );
  }
}

function contribution(
  id: string,
  type: string,
  sanityScore: number,
  signalIds: string[] = [],
) {
  return {
    recordType:
      "anonymized-research-contribution",
    consentVersion: "1",
    id,
    createdAt:
      "2026-07-27T12:00:00.000Z",
    opportunityType: type,
    scores: {
      sanityScore,
      listingQuality:
        sanityScore - 5,
      personalSafety:
        sanityScore + 5,
      evidenceQuality:
        sanityScore,
    },
    signalIds,
    verificationAttempted:
      true,
    reconciliationAvailable:
      false,
    company:
      "This should never survive normalization",
    listingText:
      "Raw private job text",
  };
}

describe(
  "trends dashboard",
  () => {
    it(
      "normalizes a privacy-safe research record without raw content",
      () => {
        const record =
          normalizeTrendRecord(
            contribution(
              "one",
              "government",
              81.2,
              ["missing-salary"],
            ),
          );

        expect(record).not.toBeNull();
        expect(
          record?.scores
            .sanityScore,
        ).toBe(82);
        expect(
          JSON.stringify(record),
        ).not.toContain(
          "Raw private job text",
        );
        expect(
          JSON.stringify(record),
        ).not.toContain(
          "This should never survive normalization",
        );
      },
    );

    it(
      "discovers research queues without importing ordinary saved reports",
      () => {
        const storage =
          new MemoryStorage({
            "job-reality-research-contributions":
              JSON.stringify([
                contribution(
                  "one",
                  "standard",
                  80,
                ),
              ]),
            "job-reality-saved-reports":
              JSON.stringify([
                {
                  id: "private-report",
                  company:
                    "Private Employer",
                  listingText:
                    "Private raw listing",
                  overallScore: 90,
                },
              ]),
          });

        const records =
          discoverTrendRecords(
            storage,
          );

        expect(records).toHaveLength(1);
        expect(records[0].id).toBe("one");
      },
    );

    it(
      "deduplicates the same local contribution",
      () => {
        const repeated =
          contribution(
            "same-record",
            "contract",
            70,
          );

        const storage =
          new MemoryStorage({
            "research-contribution-queue":
              JSON.stringify([
                repeated,
                repeated,
              ]),
          });

        expect(
          discoverTrendRecords(
            storage,
          ),
        ).toHaveLength(1);
      },
    );

    it(
      "uses ceiling-rounded averages and counts warning categories",
      () => {
        const records = [
          contribution(
            "one",
            "standard",
            70,
            ["missing-salary"],
          ),
          contribution(
            "two",
            "standard",
            71,
            [
              "missing-salary",
              "pipeline",
            ],
          ),
          contribution(
            "three",
            "standard",
            72,
            ["pipeline"],
          ),
        ]
          .map(
            (value) =>
              normalizeTrendRecord(
                value,
              ),
          )
          .filter(
            (
              value,
            ): value is NonNullable<
              typeof value
            > => value !== null,
          );

        const summary =
          buildTrendDashboardSummary(
            records,
            new Date(
              "2026-07-27T13:00:00.000Z",
            ),
          );

        expect(
          summary.scores
            .sanityScore.average,
        ).toBe(71);
        expect(
          summary.signals[0].count,
        ).toBe(2);
        expect(
          summary.categories[0]
            .publishable,
        ).toBe(true);
      },
    );

    it(
      "suppresses category score details below the privacy threshold during export",
      () => {
        expect(
          MIN_PUBLIC_GROUP_SIZE,
        ).toBe(3);

        const records = [
          contribution(
            "one",
            "government",
            80,
          ),
          contribution(
            "two",
            "government",
            90,
          ),
        ]
          .map(
            normalizeTrendRecord,
          )
          .filter(
            (
              value,
            ): value is NonNullable<
              typeof value
            > => value !== null,
          );

        const summary =
          aggregateSummaryForExport(
            buildTrendDashboardSummary(
              records,
            ),
          );

        expect(
          summary.categories[0]
            .publishable,
        ).toBe(false);
        expect(
          summary.categories[0]
            .scores.sanityScore
            .average,
        ).toBeNull();
      },
    );
  },
);
