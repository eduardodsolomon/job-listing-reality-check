import type { DetectionRule } from "../lib/analysis-types";

import {
  CONTINGENT_AWARD_PATTERN,
  PIPELINE_PATTERN,
  REQUISITION_PATTERN,
  SALARY_PATTERN,
} from "./patterns";

export const ghostRules: DetectionRule[] = [
  {
    id: "missing-requisition",
    category: "listing-quality",
    target: "ghost",
    title: "No requisition ID detected",
    explanation:
      "A requisition or job ID makes it easier to confirm that the position is active on the employer’s official website.",
    points: 15,
    type: "warning",
    question:
      "Could you provide the official requisition ID and company careers-page link?",
    matches: ({ listingText }) =>
      !REQUISITION_PATTERN.test(listingText),
  },
  {
    id: "missing-salary",
    category: "listing-quality",
    target: "ghost",
    title: "No compensation range detected",
    explanation:
      "Missing compensation does not prove that a listing is false, but it reduces transparency.",
    points: 10,
    type: "warning",
    question:
      "What is the approved salary or hourly compensation range for this position?",
    matches: ({ listingText }) => !SALARY_PATTERN.test(listingText),
  },
  {
    id: "pipeline-language",
    category: "listing-quality",
    target: "ghost",
    title: "Pipeline or evergreen language detected",
    explanation:
      "The employer may be collecting candidates for future openings rather than filling one immediate vacancy.",
    points: 30,
    type: "warning",
    question:
      "Is this an actively funded opening, an evergreen requisition, or a future talent-pipeline position?",
    matches: ({ listingText }) => PIPELINE_PATTERN.test(listingText),
  },
  {
    id: "contingent-award",
    category: "listing-quality",
    target: "ghost",
    title: "Position may depend on a future award",
    explanation:
      "The role appears contingent on funding, a contract award, or another event that may not have occurred.",
    points: 35,
    type: "warning",
    question:
      "Has the contract or funding already been awarded, and what is the confirmed start date?",
    matches: ({ listingText }) =>
      CONTINGENT_AWARD_PATTERN.test(listingText),
  },
  {
    id: "short-description",
    category: "listing-quality",
    target: "ghost",
    title: "Very limited job information",
    explanation:
      "The pasted listing contains fewer than 100 words, which limits meaningful verification.",
    points: 15,
    type: "warning",
    matches: ({ wordCount }) => wordCount < 100,
  },
];