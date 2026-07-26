import type { DetectionRule } from "../lib/analysis-types";

import {
  PUBLIC_URL_PATTERN,
  REQUISITION_PATTERN,
  SALARY_PATTERN,
} from "./patterns";

export const confidenceRules: DetectionRule[] = [
  {
    id: "requisition-present",
    category: "evidence-quality",
    target: "confidence",
    title: "Requisition ID detected",
    explanation:
      "The listing appears to include a job, posting, or requisition identifier that can later be verified.",
    points: 10,
    type: "positive",
    matches: ({ listingText }) =>
      REQUISITION_PATTERN.test(listingText),
  },
  {
    id: "salary-present",
    category: "evidence-quality",
    target: "confidence",
    title: "Compensation information detected",
    explanation:
      "The listing appears to provide salary, hourly-rate, or compensation information.",
    points: 10,
    type: "positive",
    matches: ({ listingText }) => SALARY_PATTERN.test(listingText),
  },
  {
    id: "adequate-description",
    category: "evidence-quality",
    target: "confidence",
    title: "Usable listing detail provided",
    explanation:
      "The pasted description contains enough text for a preliminary rules-based review.",
    points: 10,
    type: "positive",
    matches: ({ wordCount }) =>
      wordCount >= 100 && wordCount < 250,
  },
  {
    id: "detailed-description",
    category: "evidence-quality",
    target: "confidence",
    title: "Detailed listing provided",
    explanation:
      "The pasted description contains at least 250 words, providing more material for analysis.",
    points: 20,
    type: "positive",
    matches: ({ wordCount }) => wordCount >= 250,
  },
  {
    id: "company-provided",
    category: "evidence-quality",
    target: "confidence",
    title: "Company name provided",
    explanation:
      "The company name will support official-site verification in a future version.",
    points: 10,
    type: "positive",
    matches: ({ company }) => company.length > 0,
  },
  {
    id: "public-url-provided",
    category: "evidence-quality",
    target: "confidence",
    title: "Public listing URL provided",
    explanation:
      "A public URL can later be compared against an employer’s official career site.",
    points: 15,
    type: "positive",
    matches: ({ listingUrl }) =>
      PUBLIC_URL_PATTERN.test(listingUrl),
  },
  {
    id: "recruiter-message-provided",
    category: "evidence-quality",
    target: "confidence",
    title: "Recruiter communication provided",
    explanation:
      "The additional message allows the tool to screen for communication-based scam signals.",
    points: 5,
    type: "positive",
    matches: ({ recruiterMessage }) =>
      recruiterMessage.length > 0,
  },
];