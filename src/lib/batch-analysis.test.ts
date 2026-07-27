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
        "company,url\nExample,https://example.com",
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
          'Example,"Data analyst with salary range $70,000 to $80,000",standard',
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

  it("limits the batch to 50 jobs", () => {
    const rows = [
      "company,job_description",
      ...Array.from(
        { length: 55 },
        (_, index) =>
          `Company ${index},Description ${index}`,
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
  });

  it("creates score profiles for parsed jobs", () => {
    const parsed =
      parseBatchJobs(
        [
          "company,job_description",
          'Example,"Data Analyst salary range $70,000 to $80,000"',
        ].join("\n"),
      );

    const results =
      analyzeBatchJobs(
        parsed.jobs,
      );

    expect(
      results,
    ).toHaveLength(1);

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
