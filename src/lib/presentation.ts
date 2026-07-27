import type {
  AnalysisResult,
  Signal,
} from "./analysis-types";

import type {
  EvidenceComparison,
  ReconciliationResult,
} from "./reconciliation-types";

import type { VerificationResult } from "./verification-types";

export type HealthBand =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "critical"
  | "unknown";

export type HealthMetricId =
  | "listing-quality"
  | "personal-safety"
  | "evidence-quality";

export type EvidenceDetailTone =
  | "positive"
  | "warning"
  | "neutral";

export interface EvidenceDetail {
  id: string;
  statement: string;
  points: number;
  tone: EvidenceDetailTone;
}

export interface JobHealthMetric {
  id: HealthMetricId;
  label: string;
  score: number | null;
  band: HealthBand;
  statusLabel: string;
  explanation: string;
  evidenceDetails?: EvidenceDetail[];
  improvementPrompt?: string;
  scoreNote?: string;
}

export interface JobHealthProfile {
  overallScore: number;
  overallBand: HealthBand;
  overallLabel: string;
  summary: string;
  metrics: JobHealthMetric[];
  evidenceQualityMissing: boolean;
  scoreCount: number;
  urlEvidenceIncluded: boolean;
}

export interface PlainLanguageSignal {
  found: string;
  whyItMatters: string;
  nextStep: string;
  impactText: string;
}

export type NextStepGroupId =
  | "gather-information"
  | "red-flags"
  | "green-flags";

export interface NextStepGroup {
  id: NextStepGroupId;
  title: string;
  summary: string;
  items: string[];
}

function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function average(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce(
    (sum, value) => sum + value,
    0,
  );

  return Math.ceil(
    total / values.length,
  );
}

function uniqueStrings(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function uniqueEvidenceDetails(
  values: EvidenceDetail[],
): EvidenceDetail[] {
  const seen = new Set<string>();

  return values.filter((item) => {
    const key = [
      item.statement,
      item.points,
    ]
      .join("|")
      .toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function signedPoints(
  value: number,
): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function toneForPoints(
  points: number,
): EvidenceDetailTone {
  if (points > 0) {
    return "positive";
  }

  if (points < 0) {
    return "warning";
  }

  return "neutral";
}

export function healthBandForScore(
  score: number | null,
): HealthBand {
  if (score === null) {
    return "unknown";
  }

  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "good";
  }

  if (score >= 50) {
    return "fair";
  }

  if (score >= 25) {
    return "poor";
  }

  return "critical";
}

export function healthLabelForScore(
  score: number | null,
): string {
  switch (
    healthBandForScore(score)
  ) {
    case "excellent":
      return "Excellent";

    case "good":
      return "Good";

    case "fair":
      return "Needs review";

    case "poor":
      return "Concerning";

    case "critical":
      return "Serious danger";

    default:
      return "Not enough information";
  }
}

function createMetric(
  values: Omit<
    JobHealthMetric,
    "band" | "statusLabel"
  >,
): JobHealthMetric {
  return {
    ...values,
    band:
      healthBandForScore(
        values.score,
      ),
    statusLabel:
      healthLabelForScore(
        values.score,
      ),
  };
}

function hasTextEvidence(
  analysis: AnalysisResult,
): boolean {
  return analysis.signals.some(
    (signal) =>
      signal.target === "confidence" &&
      signal.points > 0,
  );
}

function verificationEvidenceScore(
  verification: VerificationResult,
): number {
  if (
    verification.officialSource &&
    verification.listingActive === true
  ) {
    return 90;
  }

  if (
    verification.officialSource &&
    verification.listingActive === false
  ) {
    return 15;
  }

  if (
    verification.status === "verified"
  ) {
    return 80;
  }

  if (
    verification.status === "reachable"
  ) {
    return 55;
  }

  if (
    verification.status === "not-found"
  ) {
    return 10;
  }

  if (
    verification.status === "blocked"
  ) {
    return 15;
  }

  return 20;
}

function evidenceQualityScore(
  analysis: AnalysisResult,
  verification:
    VerificationResult | null,
  reconciliation:
    ReconciliationResult | null,
): number | null {
  const textEvidenceAvailable =
    hasTextEvidence(analysis);

  if (reconciliation) {
    return clamp(
      reconciliation.adjustedConfidence,
    );
  }

  if (
    verification &&
    textEvidenceAvailable
  ) {
    return Math.ceil(
      (
        clamp(analysis.confidence) +
        verificationEvidenceScore(
          verification,
        )
      ) / 2,
    );
  }

  if (verification) {
    return verificationEvidenceScore(
      verification,
    );
  }

  if (textEvidenceAvailable) {
    return clamp(
      analysis.confidence,
    );
  }

  return null;
}

function overallSummary(
  overallScore: number,
  personalSafety: number,
  evidenceQualityMissing: boolean,
  urlEvidenceIncluded: boolean,
): string {
  if (personalSafety < 25) {
    return "Serious safety warnings were found. Stop before sharing information, sending money, or continuing the application.";
  }

  if (personalSafety < 50) {
    return "The posting contains important safety concerns. Verify the employer and recruiter before continuing.";
  }

  if (overallScore >= 85) {
    if (evidenceQualityMissing) {
      return "The available scores look strong, but more job details are needed before the evidence-quality score can be shown.";
    }

    return urlEvidenceIncluded
      ? "The submitted information and URL findings look strong overall. Continue normal employer and recruiter verification."
      : "The submitted information looks strong overall. Checking the official URL can provide more evidence.";
  }

  if (overallScore >= 70) {
    if (evidenceQualityMissing) {
      return "The available scores look fairly strong. Add more job details to reveal the evidence-quality score.";
    }

    return urlEvidenceIncluded
      ? "The job looks fairly strong after including the URL findings, but a few details should still be confirmed."
      : "The job looks fairly strong, but a few details and the official URL should still be checked.";
  }

  if (overallScore >= 50) {
    return urlEvidenceIncluded
      ? "The listing and URL findings show a mixed pattern. Review the concerns before investing more time."
      : "The submitted information shows a mixed pattern. Review the concerns and check the official URL.";
  }

  if (overallScore >= 25) {
    return urlEvidenceIncluded
      ? "The listing and URL findings show several concerns. Verify the opportunity carefully before continuing."
      : "The listing has several concerns. Verify it carefully before continuing.";
  }

  return "The posting contains serious concerns or very little reliable information.";
}

function searchableSignalText(
  signal: Signal,
): string {
  return [
    signal.id,
    signal.title,
    signal.explanation,
  ]
    .join(" ")
    .toLowerCase();
}

function impactText(
  signal: Signal,
): string {
  if (
    signal.target === "confidence"
  ) {
    return `Raises evidence quality by ${signal.points} points`;
  }

  if (
    signal.target === "ghost"
  ) {
    return `Lowers listing quality by ${signal.points} points`;
  }

  return `Lowers personal safety by ${signal.points} points`;
}

export function explainSignal(
  signal: Signal,
): PlainLanguageSignal {
  const text =
    searchableSignalText(signal);

  if (
    /social security|ssn|bank|routing|credit card|debit card|government id|passport|driver.?s license|birthdate/.test(
      text,
    )
  ) {
    return {
      found:
        "Sensitive personal or financial information was requested.",
      whyItMatters:
        "This information can be used for identity theft or financial fraud.",
      nextStep:
        "Do not provide Social Security, banking, birthdate, passport, license, or government-ID information until the employer and onboarding process are independently verified.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /gift card|bitcoin|crypto|wire transfer|application fee|training fee|equipment|fake check|deposit.*check|payment/.test(
      text,
    )
  ) {
    return {
      found:
        "The opportunity includes an unusual request involving money, checks, fees, or equipment.",
      whyItMatters:
        "Job scams often use fake checks, equipment purchases, fees, gift cards, or money transfers.",
      nextStep:
        "Do not pay a fee, deposit a check, buy equipment, purchase gift cards, or transfer money.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /telegram|whatsapp|signal app|messaging app/.test(
      text,
    )
  ) {
    return {
      found:
        "The recruiter wants to use a messaging application.",
      whyItMatters:
        "Messaging applications can make the recruiter’s identity harder to confirm.",
      nextStep:
        "Confirm the recruiter through the employer’s official website before continuing.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /no interview|instant job offer|hired immediately|without an interview/.test(
      text,
    )
  ) {
    return {
      found:
        "The job may be offered without a normal interview.",
      whyItMatters:
        "A normal interview helps confirm the job, manager, employer, and expectations.",
      nextStep:
        "Do not accept the offer until you have completed a real interview and verified the employer.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /gmail|yahoo|outlook|hotmail|personal email/.test(
      text,
    )
  ) {
    return {
      found:
        "The recruiter may be using a personal email account.",
      whyItMatters:
        "A personal email address does not prove that the sender works for the employer.",
      nextStep:
        "Confirm the recruiter using the employer’s official careers contact or staff directory.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /urgent|immediately|limited slots|respond within/.test(
      text,
    )
  ) {
    return {
      found:
        "The message uses urgency or pressure.",
      whyItMatters:
        "Pressure can cause applicants to act before checking the opportunity.",
      nextStep:
        "Pause and verify the job before responding.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /pipeline|proposal|contingent|award|talent pool|evergreen/.test(
      text,
    )
  ) {
    return {
      found:
        "The position may not be a currently funded opening.",
      whyItMatters:
        "The employer may be collecting applicants before funding, approval, or a contract award exists.",
      nextStep:
        "Ask whether the position is funded, currently open, and actively interviewing.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /salary|compensation|pay range/.test(
      text,
    )
  ) {
    if (
      signal.target === "confidence"
    ) {
      return {
        found:
          "Pay information was included.",
        whyItMatters:
          "A pay range makes the opportunity easier to evaluate.",
        nextStep:
          "Confirm whether the stated pay applies to your location and experience.",
        impactText:
          impactText(signal),
      };
    }

    return {
      found:
        "The listing does not clearly state the pay.",
      whyItMatters:
        "Missing pay information makes the opportunity harder to evaluate.",
      nextStep:
        "Ask for the salary or hourly range before investing substantial time.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /requisition|posting id|job id|req id/.test(
      text,
    )
  ) {
    if (
      signal.target === "confidence"
    ) {
      return {
        found:
          "A job or requisition number was included.",
        whyItMatters:
          "A job number makes the official posting easier to find.",
        nextStep:
          "Use the number when searching the employer’s careers site.",
        impactText:
          impactText(signal),
      };
    }

    return {
      found:
        "The listing does not include a clear job number.",
      whyItMatters:
        "Without a job number, confirming the exact opening may be harder.",
      nextStep:
        "Ask the recruiter for the official job or requisition number.",
      impactText:
        impactText(signal),
    };
  }

  if (
    /short|brief|limited detail|description/.test(
      text,
    ) &&
    signal.target === "ghost"
  ) {
    return {
      found:
        "The listing provides limited information.",
      whyItMatters:
        "Important details about the work, pay, location, manager, or hiring process may be missing.",
      nextStep:
        "Request the complete job description.",
      impactText:
        impactText(signal),
    };
  }

  if (
    signal.target === "scam"
  ) {
    return {
      found: signal.title,
      whyItMatters:
        signal.explanation,
      nextStep:
        "Pause and independently verify the employer, recruiter, and requested action.",
      impactText:
        impactText(signal),
    };
  }

  if (
    signal.target === "ghost"
  ) {
    return {
      found: signal.title,
      whyItMatters:
        signal.explanation,
      nextStep:
        "Ask whether the role is active, funded, and currently interviewing.",
      impactText:
        impactText(signal),
    };
  }

  return {
    found: signal.title,
    whyItMatters:
      signal.explanation,
    nextStep:
      "Keep this information and continue checking the opportunity.",
    impactText:
      impactText(signal),
  };
}

function buildTextEvidence(
  analysis: AnalysisResult,
): EvidenceDetail[] {
  return analysis.signals
    .filter(
      (signal) =>
        signal.type === "positive" &&
        signal.target === "confidence",
    )
    .map((signal) => ({
      id: `text-${signal.id}`,
      statement:
        explainSignal(signal).found,
      points: signal.points,
      tone:
        toneForPoints(
          signal.points,
        ),
    }));
}

function comparisonStatement(
  comparison: EvidenceComparison,
): string {
  const parts = [
    comparison.explanation,
  ];

  if (
    comparison.submittedValue &&
    comparison.verifiedValue
  ) {
    parts.push(
      `The submitted information was “${comparison.submittedValue},” while the URL returned “${comparison.verifiedValue}.”`,
    );
  } else if (
    comparison.verifiedValue
  ) {
    parts.push(
      `The URL returned “${comparison.verifiedValue}.”`,
    );
  }

  return parts.join(" ");
}

function buildUrlEvidence(
  verification:
    VerificationResult | null,
  reconciliation:
    ReconciliationResult | null,
): EvidenceDetail[] {
  if (!verification) {
    return [];
  }

  const details:
    EvidenceDetail[] = [];

  if (reconciliation) {
    reconciliation.comparisons.forEach(
      (comparison) => {
        details.push({
          id:
            `comparison-${comparison.field}`,
          statement:
            comparisonStatement(
              comparison,
            ),
          points:
            comparison.adjustment,
          tone:
            toneForPoints(
              comparison.adjustment,
            ),
        });
      },
    );
  } else {
    details.push({
      id: "url-reachable",
      statement:
        verification.officialSource
          ? "The URL returned a supported public job source."
          : "The webpage was reachable, but an official employer source was not established.",
      points:
        verification.officialSource
          ? 10
          : 3,
      tone:
        verification.officialSource
          ? "positive"
          : "neutral",
    });

    if (
      verification.listingActive === true
    ) {
      details.push({
        id: "url-active",
        statement:
          "The public job record appears active.",
        points: 12,
        tone: "positive",
      });
    }

    if (
      verification.listingActive === false
    ) {
      details.push({
        id: "url-inactive",
        statement:
          "The public job record does not appear active.",
        points: -25,
        tone: "warning",
      });
    }
  }

  verification.evidence.forEach(
    (evidence, index) => {
      details.push({
        id:
          `url-detail-${index}`,
        statement:
          evidence.value,
        points: 0,
        tone:
          evidence.kind === "warning"
            ? "warning"
            : evidence.kind ===
                "positive"
              ? "positive"
              : "neutral",
      });
    },
  );

  verification.warnings.forEach(
    (warning, index) => {
      details.push({
        id:
          `url-warning-${index}`,
        statement: warning,
        points: 0,
        tone: "warning",
      });
    },
  );

  return details;
}

export function buildJobHealthProfile(
  analysis: AnalysisResult,
  verification:
    VerificationResult | null = null,
  reconciliation:
    ReconciliationResult | null = null,
): JobHealthProfile {
  const listingQuality = clamp(
    100 - analysis.ghostRisk,
  );

  const personalSafety = clamp(
    100 - analysis.scamRisk,
  );

  const evidenceQuality =
    evidenceQualityScore(
      analysis,
      verification,
      reconciliation,
    );

  const evidenceDetails =
    uniqueEvidenceDetails([
      ...buildTextEvidence(
        analysis,
      ),
      ...buildUrlEvidence(
        verification,
        reconciliation,
      ),
    ]);

  const scores = [
    listingQuality,
    personalSafety,
    evidenceQuality,
  ].filter(
    (score): score is number =>
      score !== null,
  );

  const overallScore =
    average(scores);

  const urlEvidenceIncluded =
    verification !== null;

  let scoreNote: string;

  if (reconciliation) {
    scoreNote = [
      `The text-only evidence score was ${analysis.confidence}.`,
      `The URL check changed it by ${signedPoints(
        reconciliation.adjustment,
      )} points.`,
      `The current Evidence quality score is ${evidenceQuality}.`,
      "Individual findings below show their rule values. The final URL adjustment may be capped by the scoring engine.",
    ].join(" ");
  } else if (verification) {
    scoreNote =
      `The URL findings are included in the current Evidence quality score of ${evidenceQuality}.`;
  } else if (
    evidenceQuality !== null
  ) {
    scoreNote =
      `The current score of ${evidenceQuality} uses only the job listing and recruiter message.`;
  } else {
    scoreNote =
      "There is not enough evidence to calculate this score yet.";
  }

  const metrics:
    JobHealthMetric[] = [
    createMetric({
      id: "listing-quality",
      label: "Listing quality",
      score: listingQuality,
      explanation:
        "How complete and current the job appears. This includes pay, job number, detail, funding, and signs that the employer is actively hiring.",
    }),

    createMetric({
      id: "personal-safety",
      label: "Personal safety",
      score: personalSafety,
      explanation:
        "How safely the recruiter handles money, personal information, interviews, communication, and onboarding.",
    }),

    createMetric({
      id: "evidence-quality",
      label: "Evidence quality",
      score: evidenceQuality,
      explanation:
        evidenceQuality === null
          ? "There is not enough concrete information to score this area yet."
          : "How much useful and consistent information was found in the listing, recruiter message, and completed URL check.",
      evidenceDetails,
      scoreNote,
      improvementPrompt:
        evidenceQuality === null
          ? "Find additional details and paste them into the Job listing or Recruiter message boxes. Add the official job URL and click Check URL."
          : "Add any new details you find to the text boxes and run the check again. Check the official URL when available.",
    }),
  ];

  return {
    overallScore,
    overallBand:
      healthBandForScore(
        overallScore,
      ),
    overallLabel:
      healthLabelForScore(
        overallScore,
      ),
    summary:
      overallSummary(
        overallScore,
        personalSafety,
        evidenceQuality === null,
        urlEvidenceIncluded,
      ),
    metrics,
    evidenceQualityMissing:
      evidenceQuality === null,
    scoreCount: scores.length,
    urlEvidenceIncluded,
  };
}

export function buildNextStepGroups(
  analysis: AnalysisResult,
  verification:
    VerificationResult | null,
  hasListingUrl: boolean,
): NextStepGroup[] {
  const redSignals =
    analysis.signals.filter(
      (signal) =>
        signal.type !== "positive",
    );

  const greenSignals =
    analysis.signals.filter(
      (signal) =>
        signal.type === "positive",
    );

  const gatherItems =
    uniqueStrings([
      "Find the full posting on the employer’s official careers website. Paste the complete description into the Job listing box.",

      "Ask the recruiter or hiring manager for missing details, such as pay, job number, work location, schedule, interview steps, funding status, and hiring timeline. Paste their response into the Recruiter message box.",

      "Enter the employer’s name in the Company box so the report can compare the information more clearly.",

      hasListingUrl
        ? verification
          ? "Review the URL findings inside the Evidence quality card. Add any useful missing details to the text boxes."
          : "Click Check URL below the Public job URL box. The results will be added to Evidence quality and Job health."
        : "Find the job on the employer’s official careers website. Paste that address into the Public job URL box and click Check URL.",

      "After adding more information, click Check this job again to update the scores.",

      ...analysis.questions.map(
        (question) =>
          `${question} Add the answer to the Job listing or Recruiter message box.`,
      ),
    ]);

  const redFlagItems =
    uniqueStrings([
      ...redSignals.map(
        (signal) =>
          explainSignal(signal)
            .nextStep,
      ),

      ...(analysis.scamRisk >= 60
        ? [
            "Do not provide personal information, send money, deposit checks, or follow onboarding instructions until the employer is independently verified.",
          ]
        : []),

      ...(analysis.scamRisk >= 80
        ? [
            "Do not continue the application if the employer or recruiter cannot be verified through an official source.",
          ]
        : []),

      ...(analysis.ghostRisk >= 70
        ? [
            "Do not spend more time on the application until the employer confirms that the role is active and funded.",
          ]
        : []),

      ...(redSignals.length === 0
        ? [
            "No major red flags were found in the submitted text. Continue normal caution.",
          ]
        : []),
    ]);

  const greenFlagItems =
    uniqueStrings([
      ...greenSignals.map(
        (signal) =>
          explainSignal(signal)
            .found,
      ),

      ...(verification
        ?.officialSource &&
      verification.listingActive ===
        true
        ? [
            "The URL check returned an active public job record.",
          ]
        : []),

      ...(greenSignals.length > 0
        ? [
            "Proceed with the application if the role fits your goals and the remaining questions are answered.",
          ]
        : [
            "Not enough green flags were found yet. Gather more information and submit it in the form before applying.",
          ]),
    ]);

  return [
    {
      id: "gather-information",
      title:
        "Gather more information",
      summary:
        "Find missing details, paste them into the form, and run the check again.",
      items: gatherItems,
    },

    {
      id: "red-flags",
      title:
        "Review the red flags",
      summary:
        "Protect your time, money, and personal information.",
      items: redFlagItems,
    },

    {
      id: "green-flags",
      title:
        "Review the green flags",
      summary:
        "Use the stronger evidence to decide whether to proceed.",
      items: greenFlagItems,
    },
  ];
}