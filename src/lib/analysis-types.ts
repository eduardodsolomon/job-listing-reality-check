import type {
  OpportunitySubtype,
  OpportunityType,
} from "./specialized-analysis-types";

export type SignalType =
  | "positive"
  | "warning"
  | "critical";

export type ScoreTarget =
  | "ghost"
  | "scam"
  | "confidence";

export type RuleCategory =
  | "listing-quality"
  | "phishing-safety"
  | "evidence-quality";

export type RiskLabel =
  | "Low"
  | "Moderate"
  | "High"
  | "Critical";

export type ConfidenceLabel =
  | "Low"
  | "Moderate"
  | "High";

export interface AnalysisInput {
  company: string;
  listingUrl: string;
  listingText: string;
  recruiterMessage: string;
  opportunityType?: OpportunityType;
  opportunitySubtype?: OpportunitySubtype;
}

export interface AnalysisContext {
  company: string;
  listingUrl: string;
  listingText: string;
  recruiterMessage: string;
  combinedText: string;
  wordCount: number;
}

export interface DetectionRule {
  id: string;
  category: RuleCategory;
  target: ScoreTarget;
  title: string;
  explanation: string;
  points: number;
  type: SignalType;
  question?: string;
  matches: (
    context: AnalysisContext,
  ) => boolean;
}

export interface Signal {
  id: string;
  category: RuleCategory;
  target: ScoreTarget;
  title: string;
  explanation: string;
  points: number;
  type: SignalType;
}

export interface AnalysisResult {
  rulesetVersion: string;
  ghostRisk: number;
  ghostLabel: RiskLabel;
  scamRisk: number;
  scamLabel: RiskLabel;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  recommendation: string;
  signals: Signal[];
  questions: string[];
}