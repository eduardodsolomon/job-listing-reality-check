import {
  describe,
  expect,
  it,
} from "vitest";

import {
  analyzeBatchJobs,
  MAX_BATCH_JOBS,
  parseBatchJobs,
} from "./batch-analysis";

describe("batch analysis", () => {
  it("requires the job-description column", () => {
    const parsed =
      parseBatchJobs(
        "company,url\nAcme,https://organization.org",
      );

    expect(
      parsed.jobs,
    ).toHaveLength(0);

    expect(
      parsed.errors.join(" "),
    ).toContain(
      "job_description",
    );
  });

  it("parses CSV and skips empty descriptions", () => {
    const parsed =
      parseBatchJobs(
        [
          "company,job_description,job_type",
          'Acme,"Data analyst with salary range $70,000 to $80,000",standard',
          "Missing,,contract",
        ].join("\n"),
      );

    expect(
      parsed.jobs,
    ).toHaveLength(1);

    expect(
      parsed.errors.join(" "),
    ).toContain(
      "Row 3",
    );
  });

  it("never returns a twenty-sixth valid job", () => {
    const rows = [
      "company,job_description",
      ...Array.from(
        { length: 26 },
        (_, index) =>
          `Company ${index + 1},Description ${index + 1}`,
      ),
    ];

    const parsed =
      parseBatchJobs(
        rows.join("\n"),
      );

    expect(
      parsed.jobs,
    ).toHaveLength(
      MAX_BATCH_JOBS,
    );

    expect(
      parsed.jobs.some(
        (job) =>
          job.company ===
          "Company 26",
      ),
    ).toBe(false);

    expect(
      parsed.overflowCount,
    ).toBe(1);

    expect(
      parsed.errors.join(" "),
    ).toContain(
      "batch limit is 25",
    );
  });

  it("caps direct analysis input at 25 jobs", () => {
    const parsed =
      parseBatchJobs(
        [
          "company,job_description",
          ...Array.from(
            { length: 25 },
            (_, index) =>
              `Company ${index + 1},Description ${index + 1}`,
          ),
        ].join("\n"),
      );

    const duplicated = [
      ...parsed.jobs,
      {
        ...parsed.jobs[0],
        company:
          "Unexpected 26th job",
        sourceRow: 27,
      },
    ];

    const results =
      analyzeBatchJobs(
        duplicated,
      );

    expect(results).toHaveLength(25);

    expect(
      results.some(
        (result) =>
          result.input.company ===
          "Unexpected 26th job",
      ),
    ).toBe(false);
  });

  it("creates capped score profiles", () => {
    const parsed =
      parseBatchJobs(
        [
          "company,job_description",
          'Acme,"Data Analyst salary range $70,000 to $80,000"',
        ].join("\n"),
      );

    const results =
      analyzeBatchJobs(
        parsed.jobs,
      );

    expect(results).toHaveLength(1);

    expect(
      results[0].profile
        .overallScore,
    ).toBeGreaterThanOrEqual(0);

    expect(
      results[0].profile
        .overallScore,
    ).toBeLessThanOrEqual(100);
  });
});
