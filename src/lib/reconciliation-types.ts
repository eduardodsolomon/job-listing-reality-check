import type { ConfidenceLabel } from "./analysis-types";

export type ComparisonStatus =
  | "match"
  | "partial"
  | "mismatch"
  | "unknown";

export type ComparisonField =
  | "source"
  | "active-status"
  | "title"
  | "company"
  | "location"
  | "identifier";

export interface EvidenceComparison {
  field: ComparisonField;
  label: string;
  status: ComparisonStatus;
  submittedValue?: string;
  verifiedValue?: string;
  explanation: string;
  adjustment: number;
}

export interface ReconciliationResult {
  adjustment: number;
  adjustedConfidence: number;
  adjustedConfidenceLabel: ConfidenceLabel;
  summary: string;
  comparisons: EvidenceComparison[];
}