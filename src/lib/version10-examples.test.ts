import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AnalysisInput,
} from "./analysis-types";

import {
  analyzeListing,
} from "./analyze-listing";

import {
  buildJobHealthProfile,
  type JobHealthMetric,
} from "./presentation";

import {
  analyzeSpecializedProfile,
} from "./opportunity-analysis";

import {
  analyzeApplicantProtection,
} from "./applicant-protection";

import {
  analyzeBatchJobs,
  parseBatchJobs,
} from "./batch-analysis";

function input(
  overrides:
    Partial<AnalysisInput>,
): AnalysisInput {
  return {
    company: "",
    listingUrl: "",
    listingText: "",
    recruiterMessage: "",
    opportunityType:
      "standard",
    opportunitySubtype:
      undefined,
    ...overrides,
  };
}

function score(
  analysisInput:
    AnalysisInput,
): {
  overall: number;
  listing: number | null;
  safety: number | null;
  evidence: number | null;
} {
  const analysis =
    analyzeListing(
      analysisInput,
    );

  const base =
    buildJobHealthProfile(
      analysis,
    );

  const specialized =
    analyzeSpecializedProfile(
      analysisInput,
    );

  const profile =
    specialized
      ? {
          ...base,
          metrics:
            base.metrics.map(
              (metric) => {
                const adjustment =
                  metric.id ===
                    "listing-quality"
                    ? specialized
                        .adjustments
                        .listingQuality
                    : metric.id ===
                        "personal-safety"
                      ? specialized
                          .adjustments
                          .personalSafety
                      : 0;

                if (
                  metric.score ===
                  null
                ) {
                  return metric;
                }

                return {
                  ...metric,
                  score:
                    Math.min(
                      100,
                      Math.max(
                        0,
                        Math.ceil(
                          metric.score +
                            adjustment,
                        ),
                      ),
                    ),
                };
              },
            ),
        }
      : base;

  const getMetric = (
    id:
      | "listing-quality"
      | "personal-safety"
      | "evidence-quality",
  ): JobHealthMetric | undefined =>
    profile.metrics.find(
      (metric) =>
        metric.id === id,
    );

  const listing =
    getMetric(
      "listing-quality",
    )?.score ?? null;

  const safety =
    getMetric(
      "personal-safety",
    )?.score ?? null;

  const evidence =
    getMetric(
      "evidence-quality",
    )?.score ?? null;

  const available = [
    listing,
    safety,
    evidence,
  ].filter(
    (value): value is number =>
      value !== null,
  );

  const overall =
    Math.min(
      100,
      Math.ceil(
        available.reduce(
          (total, value) =>
            total + value,
          0,
        ) /
          available.length,
      ),
    );

  return {
    overall,
    listing,
    safety,
    evidence,
  };
}

describe(
  "Version 10 example tests",
  () => {
    it(
      "1. strong specific employee posting",
      () => {
        const result =
          score(
            input({
              company:
                "Example Health",
              listingText: `
                Senior Data Analyst

                Example Health is hiring a full-time Senior Data Analyst in Boston, Massachusetts.
                Salary range: $92,000 to $112,000.
                Hybrid schedule requiring two office days per week.
                Responsibilities include SQL validation, Power BI reporting,
                documentation, and collaboration with clinical and finance teams.
                Benefits include health, dental, vision, paid time off, and a 403(b).
                Requisition EH-2481.
                Applications close August 30, 2026.
              `,
            }),
          );

        expect(
          result.overall,
        ).toBeGreaterThanOrEqual(
          50,
        );

        expect(
          result.safety,
        ).toBeGreaterThanOrEqual(
          70,
        );

        expect(
          result.overall,
        ).toBeLessThanOrEqual(
          100,
        );
      },
    );

    it(
      "2. vague or potentially inactive posting",
      () => {
        const strong =
          score(
            input({
              company:
                "Example Health",
              listingText: `
                Senior Data Analyst.
                Salary range $92,000 to $112,000.
                Full-time hybrid role.
                Requisition EH-2481.
                Applications close August 30, 2026.
              `,
            }),
          );

        const vague =
          score(
            input({
              company:
                "Innovation Strategies Group",
              listingText: `
                We are always looking for talented professionals.
                Responsibilities and projects depend on future client needs.
                Compensation, location, schedule, start date, and hiring timeline
                will be discussed later.
                Submit your résumé so we can keep it on file.
              `,
            }),
          );

        expect(
          vague.listing,
        ).not.toBeNull();

        expect(
          strong.listing,
        ).not.toBeNull();

        expect(
          vague.listing as number,
        ).toBeLessThan(
          strong.listing as number,
        );
      },
    );

    it(
      "3. high-risk recruiter scam",
      () => {
        const analysisInput =
          input({
            company:
              "Global Remote Solutions",
            opportunityType:
              "contract",
            opportunitySubtype:
              "contract-1099",
            listingText: `
              Remote Data Entry Specialist.
              Immediate hire.
              No interview required.
              Earn $85 per hour from home.
            `,
            recruiterMessage: `
              Reply within one hour with your Social Security number,
              bank account and routing number, email password,
              and verification code.
              Deposit our check and purchase equipment.
            `,
          });

        const analysis =
          analyzeListing(
            analysisInput,
          );

        const protection =
          analyzeApplicantProtection(
            analysisInput,
          );

        expect(
          analysis.scamRisk,
        ).toBeGreaterThanOrEqual(
          50,
        );

        expect(
          protection?.adjustments
            .personalSafety,
        ).toBeLessThan(0);
      },
    );

    it(
      "4. government posting with identifiers",
      () => {
        const specialized =
          analyzeSpecializedProfile(
            input({
              company:
                "Massachusetts Department of Public Health",
              opportunityType:
                "government",
              opportunitySubtype:
                "government-state-local",
              listingUrl:
                "https://www.mass.gov/jobs/example",
              listingText: `
                Research Analyst III
                Position Number: 00684217
                Salary Range: $78,500 to $104,200
                Location: Boston, Massachusetts
                Schedule: Full-time, hybrid
                Application deadline: August 18, 2026
              `,
            }),
          );

        expect(
          specialized,
        ).not.toBeNull();

        expect(
          specialized?.adjustments
            .listingQuality,
        ).toBeGreaterThan(0);
      },
    );

    it(
      "5. problematic unpaid internship",
      () => {
        const specialized =
          analyzeSpecializedProfile(
            input({
              company:
                "Community Change Lab",
              opportunityType:
                "internship",
              opportunitySubtype:
                "internship-unpaid",
              listingText: `
                Full-time unpaid internship requiring 40 hours per week
                for six months.
                Applicants must pay a $250 training and placement fee.
                Supervision and academic credit are not provided.
              `,
            }),
          );

        expect(
          specialized,
        ).not.toBeNull();

        expect(
          specialized?.adjustments
            .personalSafety,
        ).toBeLessThan(0);

        expect(
          specialized?.findings.some(
            (finding) =>
              finding.points < 0 &&
              /unpaid|fee|supervision/i.test(
                `${finding.title} ${finding.explanation}`,
              ),
          ),
        ).toBe(true);
      },
    );

    it(
      "6. legitimate later-stage onboarding",
      () => {
        const protection =
          analyzeApplicantProtection(
            input({
              company:
                "Example Health",
              listingText: `
                After a candidate accepts a conditional written offer,
                new hires complete Form I-9 and direct-deposit information
                through Example Health's official secure onboarding portal.
                Applicants are not asked for banking or Social Security
                information during the application or interview.
              `,
            }),
          );

        expect(
          protection,
        ).not.toBeNull();

        expect(
          protection?.adjustments
            .personalSafety,
        ).toBe(0);
      },
    );

    it(
      "7. batch CSV sample",
      () => {
        const csv = [
          "company,job_description,recruiter_message,job_url,job_type,job_subtype",
          'Example Health,"Senior Data Analyst. Salary $92,000-$112,000. Full-time hybrid. Requisition EH-2481. Health, dental, vision, PTO, and 403(b).",,,standard,',
          'Innovation Strategies Group,"We are always accepting resumes for future client needs. Pay, schedule, location, and hiring timeline will be discussed later.",,,standard,',
          'Global Remote Solutions,"Remote data entry. Immediate hire. $85 per hour. No interview required.","Send your SSN, bank routing number, password, and verification code. Deposit our equipment check.",,contract,contract-1099',
        ].join("\n");

        const parsed =
          parseBatchJobs(csv);

        const results =
          analyzeBatchJobs(
            parsed.jobs,
          );

        expect(
          parsed.errors,
        ).toHaveLength(0);

        expect(
          results,
        ).toHaveLength(3);

        expect(
          results.every(
            (result) =>
              result.profile
                .overallScore <=
              100,
          ),
        ).toBe(true);

        expect(
          results[2].analysis
            .scamRisk,
        ).toBeGreaterThan(
          results[0].analysis
            .scamRisk,
        );
      },
    );
  },
);