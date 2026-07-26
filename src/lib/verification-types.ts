export type VerificationStatus =
  | "verified"
  | "reachable"
  | "not-found"
  | "blocked"
  | "error";

export type VerificationProvider =
  | "greenhouse"
  | "lever"
  | "generic";

export type EvidenceKind =
  | "positive"
  | "neutral"
  | "warning";

export interface VerificationEvidence {
  label: string;
  value: string;
  kind: EvidenceKind;
}

export interface VerificationResult {
  status: VerificationStatus;
  provider: VerificationProvider;
  checkedAt: string;
  requestedUrl: string;
  finalUrl?: string;
  httpStatus?: number;
  officialSource: boolean;
  listingActive: boolean | null;
  title?: string;
  company?: string;
  location?: string;
  postingId?: string;
  requisitionId?: string;
  datePosted?: string;
  validThrough?: string;
  evidence: VerificationEvidence[];
  warnings: string[];
}

export interface VerificationApiResponse {
  ok: boolean;
  result?: VerificationResult;
  error?: string;
}