import { analyzeListing } from "./analyze-listing";
import type { AnalysisInput, AnalysisResult } from "./analysis-types";
import { buildJobHealthProfile, type JobHealthProfile } from "./presentation";
import { analyzeSpecializedProfile } from "./opportunity-analysis";
import { applySpecializedProfile } from "./specialized-presentation";
import type { OpportunitySubtype, OpportunityType } from "./specialized-analysis-types";

export const MAX_BATCH_JOBS = 50;

export interface BatchJobInput extends AnalysisInput {
  sourceRow: number;
}

export interface BatchJobResult {
  input: BatchJobInput;
  analysis: AnalysisResult;
  profile: JobHealthProfile;
}

export interface BatchParseResult {
  jobs: BatchJobInput[];
  errors: string[];
}

const HEADER_ALIASES: Record<string, keyof AnalysisInput> = {
  company: "company",
  companyname: "company",
  employer: "company",
  employername: "company",
  jobdescription: "listingText",
  description: "listingText",
  listing: "listingText",
  listingtext: "listingText",
  joblisting: "listingText",
  recruiter: "recruiterMessage",
  recruitermessage: "recruiterMessage",
  message: "recruiterMessage",
  joburl: "listingUrl",
  officialjoburl: "listingUrl",
  listingurl: "listingUrl",
  url: "listingUrl",
  jobtype: "opportunityType",
  opportunitytype: "opportunityType",
  jobsubtype: "opportunitySubtype",
  opportunitysubtype: "opportunitySubtype",
};

const TYPE_ALIASES: Record<string, OpportunityType> = {
  standard: "standard",
  employee: "standard",
  w2: "standard",
  contract: "contract",
  "1099": "contract",
  contractor: "contract",
  government: "government",
  publicsector: "government",
  nonprofit: "nonprofit",
  ngo: "nonprofit",
  internship: "internship",
  fellowship: "internship",
  volunteer: "volunteer",
  service: "volunteer",
  unsure: "not-sure",
  notsure: "not-sure",
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeType(value: string): OpportunityType {
  return TYPE_ALIASES[normalizeHeader(value)] ?? "not-sure";
}

function normalizeSubtype(value: string): OpportunitySubtype | undefined {
  const normalized = value.trim();
  return normalized ? normalized as OpportunitySubtype : undefined;
}

function detectDelimiter(input: string): "," | "\t" {
  const firstLine = input.split(/\r?\n/).find((line) => line.trim()) ?? "";
  return firstLine.split("\t").length > firstLine.split(",").length ? "\t" : ",";
}

function parseDelimitedRows(input: string, delimiter: "," | "\t"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }

      row.push(cell.trim());
      cell = "";

      if (row.some((value) => value.trim())) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += character;
  }

  row.push(cell.trim());

  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

export function parseBatchJobs(input: string): BatchParseResult {
  const errors: string[] = [];

  if (!input.trim()) {
    return {
      jobs: [],
      errors: ["Paste CSV or TSV data, or upload a file."],
    };
  }

  const rows = parseDelimitedRows(input, detectDelimiter(input));

  if (rows.length < 2) {
    return {
      jobs: [],
      errors: ["Include a header row and at least one job."],
    };
  }

  const headers = rows[0].map(
    (header) => HEADER_ALIASES[normalizeHeader(header)],
  );

  if (!headers.includes("listingText")) {
    return {
      jobs: [],
      errors: ['The file needs a "job_description" column.'],
    };
  }

  const dataRows = rows.slice(1);

  if (dataRows.length > MAX_BATCH_JOBS) {
    errors.push(`Only the first ${MAX_BATCH_JOBS} jobs were analyzed.`);
  }

  const jobs: BatchJobInput[] = [];

  dataRows.slice(0, MAX_BATCH_JOBS).forEach((values, index) => {
    const sourceRow = index + 2;

    const draft: AnalysisInput = {
      company: "",
      listingUrl: "",
      listingText: "",
      recruiterMessage: "",
      opportunityType: "standard",
      opportunitySubtype: undefined,
    };

    headers.forEach((header, column) => {
      if (!header) {
        return;
      }

      const value = values[column] ?? "";

      if (header === "opportunityType") {
        draft.opportunityType = normalizeType(value);
        return;
      }

      if (header === "opportunitySubtype") {
        draft.opportunitySubtype = normalizeSubtype(value);
        return;
      }

      draft[header] = value;
    });

    if (!draft.listingText.trim()) {
      errors.push(
        `Row ${sourceRow} was skipped because the job description is empty.`,
      );
      return;
    }

    jobs.push({
      ...draft,
      sourceRow,
    });
  });

  return { jobs, errors };
}

export function analyzeBatchJobs(jobs: BatchJobInput[]): BatchJobResult[] {
  return jobs.map((input) => {
    const analysis = analyzeListing(input);
    const baseProfile = buildJobHealthProfile(analysis);
    const specialized = analyzeSpecializedProfile(input);
    const profile = applySpecializedProfile(baseProfile, specialized);

    return {
      input,
      analysis,
      profile,
    };
  });
}

export function batchResultMatches(
  result: BatchJobResult,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const searchable = [
    result.input.company,
    result.input.listingText,
    result.input.recruiterMessage,
    result.input.listingUrl,
    result.input.opportunityType,
    result.input.opportunitySubtype,
    result.profile.overallLabel,
    ...result.analysis.signals.map(
      (signal) => `${signal.title} ${signal.explanation}`,
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalized);
}

export const BATCH_TEMPLATE = [
  [
    "company",
    "job_description",
    "recruiter_message",
    "job_url",
    "job_type",
    "job_subtype",
  ].join(","),
  [
    "Example Company",
    '"Paste the complete job description here"',
    '"Optional recruiter message"',
    "https://example.com/jobs/123",
    "standard",
    "",
  ].join(","),
].join("\n");
