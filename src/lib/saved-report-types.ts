import type {
  AnalysisInput,
  AnalysisResult,
} from "./analysis-types";

import type {
  ReconciliationResult,
} from "./reconciliation-types";

import type {
  VerificationResult,
} from "./verification-types";

export interface SavedReportDraft {
  form: AnalysisInput;
  analysisResult: AnalysisResult;
  verificationResult:
    VerificationResult | null;
  reconciliationResult:
    ReconciliationResult | null;
}

export interface SavedReport
  extends SavedReportDraft {
  id: string;
  savedAt: string;
}
