export type SignalType = "positive" | "warning" | "critical";

export type RiskLabel = "Low" | "Moderate" | "High" | "Critical";

export interface AnalysisInput {
  company: string;
  listingUrl: string;
  listingText: string;
  recruiterMessage: string;
}

export interface Signal {
  id: string;
  title: string;
  explanation: string;
  points: number;
  type: SignalType;
}

export interface AnalysisResult {
  ghostRisk: number;
  ghostLabel: RiskLabel;
  scamRisk: number;
  scamLabel: RiskLabel;
  confidence: number;
  confidenceLabel: RiskLabel;
  recommendation: string;
  signals: Signal[];
  questions: string[];
}

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

function confidenceLabel(score: number): RiskLabel {
  if (score >= 80) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function analyzeListing(input: AnalysisInput): AnalysisResult {
  const listingText = normalizeText(input.listingText);
  const recruiterMessage = normalizeText(input.recruiterMessage);
  const combinedText = `${listingText} ${recruiterMessage}`;
  const wordCount = listingText.split(/\s+/).filter(Boolean).length;

  let ghostRisk = 0;
  let scamRisk = 0;
  let confidence = 20;

  const signals: Signal[] = [];
  const questions: string[] = [];

  const requisitionPattern =
    /\b(?:req(?:uisition)?(?:\s*(?:id|number|#))?|job\s*(?:id|number|#)|posting\s*(?:id|number|#))\s*[:#-]?\s*[a-z0-9][a-z0-9-]{2,}\b/i;

  const salaryPattern =
    /(?:\$\s?\d{2,3}(?:,\d{3})?(?:\.\d{1,2})?(?:\s*(?:-|–|to)\s*\$?\s?\d{2,3}(?:,\d{3})?(?:\.\d{1,2})?)?|\b(?:salary|compensation|pay range|hourly rate)\s*[:=-])/i;

  const pipelinePattern =
    /\b(?:pipeline role|proposal role|proposal-based|talent pool|talent community|evergreen requisition|future opportunities|anticipated opening)\b/i;

  const contingentAwardPattern =
    /\b(?:contingent upon|subject to|pending)\s+(?:contract|task order|funding|award)|\bcontract award pending\b/i;

  const sensitiveInformationPattern =
    /\b(?:social security(?: number)?|ssn|bank account|routing number|online banking login|credit card|debit card)\b/i;

  const paymentPattern =
    /\b(?:gift card|bitcoin|cryptocurrency|crypto payment|wire transfer|send money|pay a fee|application fee|training fee|purchase equipment|buy equipment)\b/i;

  const fakeCheckPattern =
    /\b(?:deposit|cash|mobile deposit)\b.{0,50}\bcheck\b|\bcheck\b.{0,50}\b(?:equipment|vendor|reimburse|purchase)\b/i;

  const messagingAppPattern =
    /\b(?:telegram|whatsapp|signal app)\b/i;

  const noInterviewPattern =
    /\b(?:no interview required|hired immediately|instant job offer|offer without an interview)\b/i;

  const personalEmailPattern =
    /\b[a-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|aol)\.com\b/i;

  const urgencyPattern =
    /\b(?:act immediately|respond immediately|urgent response|limited slots|respond within \d+ hours)\b/i;

  const hasRequisitionId = requisitionPattern.test(listingText);
  const hasSalary = salaryPattern.test(listingText);
  const hasPipelineLanguage = pipelinePattern.test(listingText);
  const isContingent = contingentAwardPattern.test(listingText);

  // Ghost-job and low-intent signals

  if (!hasRequisitionId) {
    ghostRisk += 15;
    signals.push({
      id: "missing-requisition",
      title: "No requisition ID detected",
      explanation:
        "A requisition or job ID makes it easier to confirm that the position is active on the employer’s official website.",
      points: 15,
      type: "warning",
    });

    questions.push(
      "Could you provide the official requisition ID and company careers-page link?",
    );
  } else {
    confidence += 10;
    signals.push({
      id: "requisition-present",
      title: "Requisition ID detected",
      explanation:
        "The listing appears to include a job, posting, or requisition identifier that can later be verified.",
      points: 0,
      type: "positive",
    });
  }

  if (!hasSalary) {
    ghostRisk += 10;
    signals.push({
      id: "missing-salary",
      title: "No compensation range detected",
      explanation:
        "Missing compensation does not prove that a listing is false, but it reduces transparency.",
      points: 10,
      type: "warning",
    });

    questions.push(
      "What is the approved salary or hourly compensation range for this position?",
    );
  } else {
    confidence += 10;
    signals.push({
      id: "salary-present",
      title: "Compensation information detected",
      explanation:
        "The listing appears to provide salary, hourly-rate, or compensation information.",
      points: 0,
      type: "positive",
    });
  }

  if (hasPipelineLanguage) {
    ghostRisk += 30;
    signals.push({
      id: "pipeline-language",
      title: "Pipeline or evergreen language detected",
      explanation:
        "The employer may be collecting candidates for future openings rather than filling one immediate vacancy.",
      points: 30,
      type: "warning",
    });

    questions.push(
      "Is this an actively funded opening, an evergreen requisition, or a future talent-pipeline position?",
    );
  }

  if (isContingent) {
    ghostRisk += 35;
    signals.push({
      id: "contingent-award",
      title: "Position may depend on a future award",
      explanation:
        "The role appears contingent on funding, a contract award, or another event that may not have occurred.",
      points: 35,
      type: "warning",
    });

    questions.push(
      "Has the contract or funding already been awarded, and what is the confirmed start date?",
    );
  }

  if (wordCount < 100) {
    ghostRisk += 15;
    signals.push({
      id: "short-description",
      title: "Very limited job information",
      explanation:
        "The pasted listing contains fewer than 100 words, which limits meaningful verification.",
      points: 15,
      type: "warning",
    });
  } else if (wordCount >= 250) {
    confidence += 20;
  } else {
    confidence += 10;
  }

  // Scam and phishing signals

  if (sensitiveInformationPattern.test(combinedText)) {
    scamRisk += 65;
    signals.push({
      id: "sensitive-information",
      title: "Sensitive financial or identity information mentioned",
      explanation:
        "Requests for Social Security, bank, routing, or card information before formal onboarding are a critical warning.",
      points: 65,
      type: "critical",
    });
  }

  if (paymentPattern.test(combinedText)) {
    scamRisk += 75;
    signals.push({
      id: "payment-request",
      title: "Payment or purchase request detected",
      explanation:
        "Legitimate employers should not require applicants to send money, buy gift cards, transfer cryptocurrency, or pay application fees.",
      points: 75,
      type: "critical",
    });
  }

  if (fakeCheckPattern.test(combinedText)) {
    scamRisk += 75;
    signals.push({
      id: "fake-check",
      title: "Possible fake-check or equipment scheme",
      explanation:
        "The message appears to connect a check, deposit, reimbursement, vendor, or equipment purchase.",
      points: 75,
      type: "critical",
    });
  }

  if (messagingAppPattern.test(recruiterMessage)) {
    scamRisk += 25;
    signals.push({
      id: "messaging-app",
      title: "Informal messaging application detected",
      explanation:
        "Recruitment conducted primarily through Telegram, WhatsApp, or similar applications deserves additional verification.",
      points: 25,
      type: "warning",
    });
  }

  if (noInterviewPattern.test(combinedText)) {
    scamRisk += 40;
    signals.push({
      id: "no-interview",
      title: "Offer without a substantive interview",
      explanation:
        "An immediate offer or claim that no interview is required is a significant scam warning.",
      points: 40,
      type: "critical",
    });
  }

  if (personalEmailPattern.test(recruiterMessage)) {
    scamRisk += 25;
    signals.push({
      id: "personal-email",
      title: "Personal email provider detected",
      explanation:
        "A recruiter using a free personal email address should be independently verified through the employer’s official website.",
      points: 25,
      type: "warning",
    });
  }

  if (urgencyPattern.test(combinedText)) {
    scamRisk += 15;
    signals.push({
      id: "urgency",
      title: "Pressure or artificial urgency detected",
      explanation:
        "Scammers frequently pressure applicants to respond before they have time to verify the opportunity.",
      points: 15,
      type: "warning",
    });
  }

  // Confidence is based on how much evidence the user provided.

  if (input.company.trim()) confidence += 10;
  if (/^https?:\/\//i.test(input.listingUrl.trim())) confidence += 15;
  if (recruiterMessage.length > 0) confidence += 5;

  ghostRisk = clampScore(ghostRisk);
  scamRisk = clampScore(scamRisk);
  confidence = clampScore(confidence);

  let recommendation: string;

  if (scamRisk >= 60) {
    recommendation =
      "Stop and independently contact the employer through its official website before sharing information, depositing checks, purchasing anything, or continuing the conversation.";
  } else if (ghostRisk >= 60) {
    recommendation =
      "Treat this as a high-risk or low-intent listing. Verify that the job is active and funded before tailoring a résumé or investing substantial time.";
  } else if (ghostRisk >= 30 || scamRisk >= 30) {
    recommendation =
      "Verify the requisition, recruiter, and official careers-page listing before proceeding.";
  } else {
    recommendation =
      "The pasted text contains relatively few warning signals, but an official-site check is still needed before treating the job as verified.";
  }

  if (questions.length === 0) {
    questions.push(
      "Can you confirm that this position is currently active and accepting external applications?",
    );
  }

  if (scamRisk >= 30) {
    questions.push(
      "Can the employer confirm this recruiter and opening through contact information published on its official website?",
    );
  }

  return {
    ghostRisk,
    ghostLabel: riskLabel(ghostRisk),
    scamRisk,
    scamLabel: riskLabel(scamRisk),
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    recommendation,
    signals,
    questions: [...new Set(questions)],
  };
}