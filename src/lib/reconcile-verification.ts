import type {
  AnalysisInput,
  AnalysisResult,
  ConfidenceLabel,
} from "./analysis-types";

import type {
  ComparisonStatus,
  EvidenceComparison,
  ReconciliationResult,
} from "./reconciliation-types";

import type { VerificationResult } from "./verification-types";

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function normalizeText(
  value: string | undefined,
): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedContains(
  largerValue: string,
  smallerValue: string | undefined,
): boolean {
  const normalizedLarger =
    normalizeText(largerValue);

  const normalizedSmaller =
    normalizeText(smallerValue);

  if (
    normalizedLarger.length === 0 ||
    normalizedSmaller.length < 3
  ) {
    return false;
  }

  return normalizedLarger.includes(
    normalizedSmaller,
  );
}

function tokenOverlap(
  firstValue: string,
  secondValue: string,
): number {
  const firstTokens = new Set(
    normalizeText(firstValue)
      .split(" ")
      .filter((token) => token.length > 2),
  );

  const secondTokens = new Set(
    normalizeText(secondValue)
      .split(" ")
      .filter((token) => token.length > 2),
  );

  if (
    firstTokens.size === 0 ||
    secondTokens.size === 0
  ) {
    return 0;
  }

  let matchingTokens = 0;

  for (const token of firstTokens) {
    if (secondTokens.has(token)) {
      matchingTokens += 1;
    }
  }

  return (
    matchingTokens /
    Math.min(
      firstTokens.size,
      secondTokens.size,
    )
  );
}

function confidenceLabel(
  score: number,
): ConfidenceLabel {
  if (score >= 70) {
    return "High";
  }

  if (score >= 40) {
    return "Moderate";
  }

  return "Low";
}

function comparison(
  values: {
    field: EvidenceComparison["field"];
    label: string;
    status: ComparisonStatus;
    explanation: string;
    adjustment: number;
    submittedValue?: string;
    verifiedValue?: string;
  },
): EvidenceComparison {
  return values;
}

function sourceComparison(
  verification: VerificationResult,
): EvidenceComparison {
  if (verification.officialSource) {
    return comparison({
      field: "source",
      label: "Public source",
      status: "match",
      verifiedValue: verification.provider,
      explanation:
        "The posting was returned by a supported public applicant-tracking endpoint.",
      adjustment: 10,
    });
  }

  if (verification.status === "reachable") {
    return comparison({
      field: "source",
      label: "Public source",
      status: "partial",
      verifiedValue: verification.finalUrl,
      explanation:
        "The page was reachable, but the verifier could not establish that it was an official employer source.",
      adjustment: 3,
    });
  }

  return comparison({
    field: "source",
    label: "Public source",
    status: "unknown",
    verifiedValue: verification.finalUrl,
    explanation:
      "The verifier did not establish an official public source.",
    adjustment: 0,
  });
}

function activeStatusComparison(
  verification: VerificationResult,
): EvidenceComparison {
  if (verification.listingActive === true) {
    return comparison({
      field: "active-status",
      label: "Active posting status",
      status: "match",
      verifiedValue: "Appears active",
      explanation:
        "The public source returned an active posting record.",
      adjustment: 12,
    });
  }

  if (verification.listingActive === false) {
    return comparison({
      field: "active-status",
      label: "Active posting status",
      status: "mismatch",
      verifiedValue: "Not active",
      explanation:
        "The public source did not return an active posting.",
      adjustment: -25,
    });
  }

  return comparison({
    field: "active-status",
    label: "Active posting status",
    status: "unknown",
    verifiedValue: "Unknown",
    explanation:
      "The page was reachable, but its active status could not be established.",
    adjustment: 0,
  });
}

function titleComparison(
  input: AnalysisInput,
  verification: VerificationResult,
): EvidenceComparison {
  const verifiedTitle = verification.title;

  if (!verifiedTitle) {
    return comparison({
      field: "title",
      label: "Job title",
      status: "unknown",
      explanation:
        "The verifier did not return a job title.",
      adjustment: 0,
    });
  }

  const submittedText = [
    input.listingText,
    input.recruiterMessage,
  ].join(" ");

  if (
    normalizedContains(
      submittedText,
      verifiedTitle,
    )
  ) {
    return comparison({
      field: "title",
      label: "Job title",
      status: "match",
      submittedValue:
        "Found in submitted listing",
      verifiedValue: verifiedTitle,
      explanation:
        "The verified title appears in the submitted material.",
      adjustment: 5,
    });
  }

  const overlap = tokenOverlap(
    submittedText,
    verifiedTitle,
  );

  if (overlap >= 0.6) {
    return comparison({
      field: "title",
      label: "Job title",
      status: "partial",
      submittedValue:
        "Similar wording found",
      verifiedValue: verifiedTitle,
      explanation:
        "Most verified title words appear in the submitted material, but the wording is not identical.",
      adjustment: 2,
    });
  }

  return comparison({
    field: "title",
    label: "Job title",
    status: "mismatch",
    submittedValue:
      "No close title match found",
    verifiedValue: verifiedTitle,
    explanation:
      "The verified title does not closely match the submitted material.",
    adjustment: -10,
  });
}

function companyComparison(
  input: AnalysisInput,
  verification: VerificationResult,
): EvidenceComparison {
  const verifiedCompany =
    verification.company;

  if (!verifiedCompany) {
    return comparison({
      field: "company",
      label: "Company",
      status: "unknown",
      submittedValue:
        input.company || undefined,
      explanation:
        "The verifier did not return a company name.",
      adjustment: 0,
    });
  }

  if (input.company.trim()) {
    const directOverlap = Math.max(
      tokenOverlap(
        input.company,
        verifiedCompany,
      ),
      tokenOverlap(
        verifiedCompany,
        input.company,
      ),
    );

    if (
      normalizedContains(
        input.company,
        verifiedCompany,
      ) ||
      normalizedContains(
        verifiedCompany,
        input.company,
      ) ||
      directOverlap >= 0.7
    ) {
      return comparison({
        field: "company",
        label: "Company",
        status: "match",
        submittedValue: input.company,
        verifiedValue: verifiedCompany,
        explanation:
          "The submitted company matches the verified company.",
        adjustment: 5,
      });
    }

    return comparison({
      field: "company",
      label: "Company",
      status: "mismatch",
      submittedValue: input.company,
      verifiedValue: verifiedCompany,
      explanation:
        "The submitted company differs from the company returned by the public page.",
      adjustment: -20,
    });
  }

  if (
    normalizedContains(
      input.listingText,
      verifiedCompany,
    )
  ) {
    return comparison({
      field: "company",
      label: "Company",
      status: "match",
      submittedValue:
        "Found in submitted listing",
      verifiedValue: verifiedCompany,
      explanation:
        "The verified company appears in the submitted listing.",
      adjustment: 4,
    });
  }

  return comparison({
    field: "company",
    label: "Company",
    status: "unknown",
    verifiedValue: verifiedCompany,
    explanation:
      "No company was entered for a direct comparison.",
    adjustment: 0,
  });
}

function locationComparison(
  input: AnalysisInput,
  verification: VerificationResult,
): EvidenceComparison {
  const verifiedLocation =
    verification.location;

  if (!verifiedLocation) {
    return comparison({
      field: "location",
      label: "Location",
      status: "unknown",
      explanation:
        "The verifier did not return a location.",
      adjustment: 0,
    });
  }

  const submittedText = [
    input.listingText,
    input.recruiterMessage,
  ].join(" ");

  if (
    normalizedContains(
      submittedText,
      verifiedLocation,
    )
  ) {
    return comparison({
      field: "location",
      label: "Location",
      status: "match",
      submittedValue:
        "Found in submitted material",
      verifiedValue: verifiedLocation,
      explanation:
        "The verified location appears in the submitted material.",
      adjustment: 3,
    });
  }

  const overlap = tokenOverlap(
    submittedText,
    verifiedLocation,
  );

  if (overlap >= 0.5) {
    return comparison({
      field: "location",
      label: "Location",
      status: "partial",
      submittedValue:
        "Partial location match",
      verifiedValue: verifiedLocation,
      explanation:
        "Part of the verified location appears in the submitted material.",
      adjustment: 1,
    });
  }

  return comparison({
    field: "location",
    label: "Location",
    status: "unknown",
    verifiedValue: verifiedLocation,
    explanation:
      "The verified location was not clearly found in the submitted material.",
    adjustment: 0,
  });
}

function identifierComparison(
  input: AnalysisInput,
  verification: VerificationResult,
): EvidenceComparison {
  const identifier =
    verification.requisitionId ??
    verification.postingId;

  if (!identifier) {
    return comparison({
      field: "identifier",
      label: "Posting identifier",
      status: "unknown",
      explanation:
        "The verifier did not return a posting or requisition identifier.",
      adjustment: 0,
    });
  }

  const submittedText = [
    input.listingUrl,
    input.listingText,
    input.recruiterMessage,
  ].join(" ");

  if (
    submittedText
      .toLowerCase()
      .includes(identifier.toLowerCase())
  ) {
    return comparison({
      field: "identifier",
      label: "Posting identifier",
      status: "match",
      submittedValue:
        "Found in URL or submitted material",
      verifiedValue: identifier,
      explanation:
        "The verified identifier appears in the submitted URL or listing material.",
      adjustment: 3,
    });
  }

  return comparison({
    field: "identifier",
    label: "Posting identifier",
    status: "unknown",
    verifiedValue: identifier,
    explanation:
      "A verified identifier was returned, but it was not found in the submitted text.",
    adjustment: 0,
  });
}

function reconciliationSummary(
  adjustment: number,
): string {
  if (adjustment >= 20) {
    return "External verification substantially strengthens the available evidence.";
  }

  if (adjustment >= 8) {
    return "External verification moderately strengthens the available evidence.";
  }

  if (adjustment > 0) {
    return "External verification slightly strengthens the available evidence.";
  }

  if (adjustment <= -20) {
    return "External verification found a serious mismatch or inactive posting.";
  }

  if (adjustment < 0) {
    return "External verification weakens confidence in the submitted listing.";
  }

  return "External verification did not materially change the available evidence.";
}

export function reconcileVerification(
  input: AnalysisInput,
  analysis: AnalysisResult,
  verification: VerificationResult,
): ReconciliationResult {
  const comparisons = [
    sourceComparison(verification),
    activeStatusComparison(verification),
    titleComparison(input, verification),
    companyComparison(input, verification),
    locationComparison(input, verification),
    identifierComparison(input, verification),
  ];

  const rawAdjustment = comparisons.reduce(
    (total, item) =>
      total + item.adjustment,
    0,
  );

  const adjustment = clamp(
    rawAdjustment,
    -40,
    30,
  );

  const adjustedConfidence = clamp(
    analysis.confidence + adjustment,
    0,
    100,
  );

  return {
    adjustment,
    adjustedConfidence,
    adjustedConfidenceLabel:
      confidenceLabel(adjustedConfidence),
    summary:
      reconciliationSummary(adjustment),
    comparisons,
  };
}