import type {
  AnalysisInput,
  AnalysisResult,
} from "./analysis-types";

import type { ReconciliationResult } from "./reconciliation-types";
import type { VerificationResult } from "./verification-types";

export const SAVED_REPORT_SCHEMA_VERSION =
  "1.0.0" as const;

export interface SavedReport {
  schemaVersion:
    typeof SAVED_REPORT_SCHEMA_VERSION;
  id: string;
  savedAt: string;
  form: AnalysisInput;
  analysisResult: AnalysisResult;
  verificationResult: VerificationResult;
  reconciliationResult: ReconciliationResult;
}

export type SavedReportDraft = Omit<
  SavedReport,
  "schemaVersion" | "id" | "savedAt"
>;