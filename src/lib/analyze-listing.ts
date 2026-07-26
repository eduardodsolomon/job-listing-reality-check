import { allRules, RULESET_VERSION } from "../rules";

import type {
  AnalysisContext,
  AnalysisInput,
  AnalysisResult,
  ConfidenceLabel,
  RiskLabel,
  Signal,
} from "./analysis-types";

export type {
  AnalysisInput,
  AnalysisResult,
  ConfidenceLabel,
  RiskLabel,
  Signal,
  SignalType,
} from "./analysis-types";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function riskLabel(score: number): RiskLabel {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
}

function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 80) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

function createContext(input: AnalysisInput): AnalysisContext {
  const company = normalizeText(input.company);
  const listingUrl = input.listingUrl.trim();
  const listingText = normalizeText(input.listingText);
  const recruiterMessage = normalizeText(input.recruiterMessage);

  return {
    company,
    listingUrl,
    listingText,
    recruiterMessage,
    combinedText: `${listingText} ${recruiterMessage}`.trim(),
    wordCount: listingText.split(/\s+/).filter(Boolean).length,
  };
}

function createRecommendation(
  ghostRisk: number,
  scamRisk: number,
): string {
  if (scamRisk >= 60) {
    return "Stop and independently contact the employer through its official website before sharing information, depositing checks, purchasing anything, or continuing the conversation.";
  }

  if (ghostRisk >= 60) {
    return "Treat this as a high-risk or low-intent listing. Verify that the job is active and funded before tailoring a résumé or investing substantial time.";
  }

  if (ghostRisk >= 30 || scamRisk >= 30) {
    return "Verify the requisition, recruiter, and official careers-page listing before proceeding.";
  }

  return "The pasted text contains relatively few warning signals, but an official-site check is still needed before treating the job as verified.";
}

export function analyzeListing(
  input: AnalysisInput,
): AnalysisResult {
  const context = createContext(input);

  let ghostRisk = 0;
  let scamRisk = 0;

  // Every analysis starts with limited baseline confidence.
  // Additional supplied evidence increases this score.
  let confidence = 20;

  const signals: Signal[] = [];
  const questions: string[] = [];

  for (const rule of allRules) {
    if (!rule.matches(context)) {
      continue;
    }

    if (rule.target === "ghost") {
      ghostRisk += rule.points;
    } else if (rule.target === "scam") {
      scamRisk += rule.points;
    } else {
      confidence += rule.points;
    }

    signals.push({
      id: rule.id,
      category: rule.category,
      target: rule.target,
      title: rule.title,
      explanation: rule.explanation,
      points: rule.points,
      type: rule.type,
    });

    if (rule.question) {
      questions.push(rule.question);
    }
  }

  ghostRisk = clampScore(ghostRisk);
  scamRisk = clampScore(scamRisk);
  confidence = clampScore(confidence);

  if (questions.length === 0) {
    questions.push(
      "Can you confirm that this position is currently active and accepting external applications?",
    );
  }

  if (
    scamRisk >= 30 &&
    !questions.some((question) =>
      question.toLowerCase().includes("confirm this recruiter"),
    )
  ) {
    questions.push(
      "Can the employer confirm this recruiter and opening through contact information published on its official website?",
    );
  }

  return {
    rulesetVersion: RULESET_VERSION,
    ghostRisk,
    ghostLabel: riskLabel(ghostRisk),
    scamRisk,
    scamLabel: riskLabel(scamRisk),
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    recommendation: createRecommendation(ghostRisk, scamRisk),
    signals,
    questions: [...new Set(questions)],
  };
}