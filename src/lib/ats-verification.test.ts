import { describe, expect, it } from "vitest";

import { parseAtsUrl } from "./ats-verification";

describe("parseAtsUrl", () => {
  it("recognizes a Greenhouse listing", () => {
    const result = parseAtsUrl(
      "https://job-boards.greenhouse.io/examplecompany/jobs/1234567",
    );

    expect(result).toMatchObject({
      provider: "greenhouse",
      boardToken: "examplecompany",
      postingId: "1234567",
      apiUrl:
        "https://boards-api.greenhouse.io/v1/boards/examplecompany/jobs/1234567",
    });
  });

  it("recognizes a Lever listing", () => {
    const result = parseAtsUrl(
      "https://jobs.lever.co/examplecompany/11111111-2222-3333-4444-555555555555",
    );

    expect(result).toMatchObject({
      provider: "lever",
      site: "examplecompany",
      postingId:
        "11111111-2222-3333-4444-555555555555",
      apiUrl:
        "https://api.lever.co/v0/postings/examplecompany/11111111-2222-3333-4444-555555555555?mode=json",
    });
  });

  it("recognizes a European Lever listing", () => {
    const result = parseAtsUrl(
      "https://jobs.eu.lever.co/examplecompany/11111111-2222-3333-4444-555555555555",
    );

    expect(result).toMatchObject({
      provider: "lever",
      apiUrl:
        "https://api.eu.lever.co/v0/postings/examplecompany/11111111-2222-3333-4444-555555555555?mode=json",
    });
  });

  it("leaves an unsupported site as generic", () => {
    const result = parseAtsUrl(
      "https://example.com/careers/data-analyst",
    );

    expect(result).toBeNull();
  });
});