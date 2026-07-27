import type { AnalysisInput } from "./analysis-types";

import type {
  SpecializedAdjustments,
  SpecializedFinding,
  SpecializedFindingKind,
  SpecializedScoreTarget,
} from "./specialized-analysis-types";

export interface ApplicantProtectionResult {
  summary: string;
  adjustments: SpecializedAdjustments;
  findings: SpecializedFinding[];
  questions: string[];
}

interface FindingInput {
  id: string;
  title: string;
  explanation: string;
  nextStep: string;
  points: number;
  target: SpecializedScoreTarget;
  question?: string;
}

interface ProtectionBuilder {
  findings: SpecializedFinding[];
  questions: string[];
  listingQuality: number;
  personalSafety: number;
}

function clampAdjustment(
  value: number,
): number {
  return Math.max(
    -30,
    Math.min(20, Math.ceil(value)),
  );
}

function findingKind(
  points: number,
): SpecializedFindingKind {
  if (points > 0) {
    return "positive";
  }

  if (points <= -10) {
    return "critical";
  }

  if (points < 0) {
    return "warning";
  }

  return "information";
}

function addFinding(
  builder: ProtectionBuilder,
  finding: FindingInput,
): void {
  builder.findings.push({
    id: `protection-${finding.id}`,
    title: finding.title,
    explanation:
      finding.explanation,
    nextStep: finding.nextStep,
    points: finding.points,
    target: finding.target,
    kind:
      findingKind(
        finding.points,
      ),
  });

  if (
    finding.target ===
    "listing-quality"
  ) {
    builder.listingQuality +=
      finding.points;
  } else {
    builder.personalSafety +=
      finding.points;
  }

  if (finding.question) {
    builder.questions.push(
      finding.question,
    );
  }
}

function unique(
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

function contains(
  text: string,
  pattern: RegExp,
): boolean {
  return pattern.test(text);
}

function requests(
  text: string,
  subject: RegExp,
): boolean {
  const requestBefore =
    new RegExp(
      String.raw`(?:send|share|provide|submit|give|tell|reply with|upload|enter|confirm)[^.!?\n]{0,80}(?:${subject.source})`,
      "i",
    );

  const requestAfter =
    new RegExp(
      String.raw`(?:${subject.source})[^.!?\n]{0,80}(?:required|needed|requested|must be provided|must be submitted)`,
      "i",
    );

  return (
    requestBefore.test(text) ||
    requestAfter.test(text)
  );
}

function summarize(
  findings: SpecializedFinding[],
): string {
  const serious =
    findings.filter(
      (finding) =>
        finding.kind ===
        "critical",
    ).length;

  const warnings =
    findings.filter(
      (finding) =>
        finding.kind ===
        "warning",
    ).length;

  const positives =
    findings.filter(
      (finding) =>
        finding.kind ===
        "positive",
    ).length;

  if (serious > 0) {
    return `Applicant-protection checks found ${serious} serious concern${serious === 1 ? "" : "s"}.`;
  }

  if (warnings > 0) {
    return `Applicant-protection checks found ${warnings} item${warnings === 1 ? "" : "s"} that should be reviewed.`;
  }

  if (positives > 0) {
    return "Applicant-protection checks found signs of a more transparent application process.";
  }

  return "Applicant-protection checks recorded additional application information.";
}

export function analyzeApplicantProtection(
  input: AnalysisInput,
): ApplicantProtectionResult | null {
  const text = [
    input.listingText,
    input.recruiterMessage,
  ]
    .join("\n")
    .toLowerCase();

  if (!text.trim()) {
    return null;
  }

  const builder: ProtectionBuilder = {
    findings: [],
    questions: [],
    listingQuality: 0,
    personalSafety: 0,
  };

  const laterStageLanguage =
    contains(
      text,
      /after (?:a |the )?(?:conditional )?offer|after you are hired|new[- ]hire onboarding|official onboarding portal|onboarding after hire|form i-9|i-9 verification|after accepting the offer/i,
    );

  const officialPortalLanguage =
    contains(
      text,
      /secure(?:\s+\w+){0,3}\s+portal|official(?:\s+\w+){0,3}\s+portal|employee portal|applicant portal|government portal|company onboarding system/i,
    );

  const voluntaryDemographics =
    contains(
      text,
      /voluntary self-identification|voluntary demographic|optional demographic|equal employment opportunity|eeo survey|you may decline to answer|prefer not to answer/i,
    );

  const roleSpecificLegalRequirement =
    contains(
      text,
      /security clearance|federal contract requirement|required by law|legal requirement|export control|itar|law enforcement position|sworn officer|citizenship is required by statute/i,
    );

  const creativeAppearanceRole =
    contains(
      text,
      /actor|acting role|model|modeling|performer|on-camera role|photo shoot|casting call/i,
    );

  const credentialRequest =
    requests(
      text,
      /password|login credentials|verification code|one[- ]time passcode|otp code|mfa code|two[- ]factor code|security code|account recovery code/,
    );

  if (credentialRequest) {
    addFinding(builder, {
      id: "credentials",
      title:
        "The message requests a password or account-security code.",
      explanation:
        "A legitimate employer should not ask for your password, multifactor-authentication code, one-time passcode, or account-recovery code.",
      nextStep:
        "Do not send the requested credential. Change any credential already shared and contact the employer through an independently verified channel.",
      points: -30,
      target: "personal-safety",
    });
  }

  const financialRequest =
    requests(
      text,
      /social security number|social security|ssn|bank account|routing number|credit card|debit card|taxpayer identification number|tax id/,
    );

  if (financialRequest) {
    if (
      laterStageLanguage &&
      officialPortalLanguage
    ) {
      addFinding(builder, {
        id: "later-stage-financial-data",
        title:
          "Sensitive onboarding information is requested after hiring through a stated portal.",
        explanation:
          "Tax, identity, and direct-deposit information may be required after a legitimate offer, but the portal and employer must still be verified.",
        nextStep:
          "Open the onboarding portal through the employer’s official website rather than through an unexpected email or message link.",
        points: 0,
        target: "personal-safety",
      });
    } else {
      addFinding(builder, {
        id: "early-financial-data",
        title:
          "Sensitive financial or identity information is requested too early.",
        explanation:
          "Social Security, tax, banking, or card information should not normally be sent to a recruiter during an initial application or interview.",
        nextStep:
          "Do not provide the information until there is a verified offer and a verified employer onboarding process.",
        points: -12,
        target: "personal-safety",
        question:
          "Why is sensitive financial or identity information needed at this stage?",
      });
    }
  }

  const identityDocumentRequest =
    requests(
      text,
      /passport|driver'?s license|government id|state id|identity document|birth certificate|full date of birth|date of birth|home address/,
    );

  if (identityDocumentRequest) {
    if (laterStageLanguage) {
      addFinding(builder, {
        id: "later-stage-id",
        title:
          "Identity documents are described as part of later-stage onboarding.",
        explanation:
          "Identity verification may occur after a legitimate offer, but applicants should confirm the employer, timing, and secure submission method.",
        nextStep:
          "Submit documents only through a verified employer or authorized background-check portal.",
        points: 0,
        target: "personal-safety",
      });
    } else {
      addFinding(builder, {
        id: "early-id",
        title:
          "Detailed identity information is requested before a verified offer.",
        explanation:
          "A passport, license, government ID, full birthdate, or full home address can expose an applicant to identity theft.",
        nextStep:
          "Do not provide the information until the employer, role, and secure onboarding process are independently verified.",
        points: -8,
        target: "personal-safety",
        question:
          "Can this identity request wait until after a verified conditional offer?",
      });
    }
  }

  const feeOrPaymentRequest =
    contains(
      text,
      /application fee|processing fee|training fee|registration fee|background check fee|pay to apply|pay to start|deposit (?:the |a )?check|cashier'?s check|gift card|wire transfer|send money|purchase equipment/i,
    );

  if (feeOrPaymentRequest) {
    addFinding(builder, {
      id: "fee-or-payment",
      title:
        "The application includes a fee, payment, check, or purchase request.",
      explanation:
        "This pattern is commonly associated with fake-check, equipment-purchase, and advance-fee job scams.",
      nextStep:
        "Do not send money, deposit a check, buy equipment, or purchase gift cards for the recruiter.",
      points: 0,
      target: "personal-safety",
    });
  }

  const photoRequest =
    requests(
      text,
      /photo|headshot|full-body picture|full body picture|selfie|recent picture/,
    );

  if (photoRequest) {
    if (creativeAppearanceRole) {
      addFinding(builder, {
        id: "role-related-photo",
        title:
          "A photo is requested for an appearance-based creative role.",
        explanation:
          "Photos may be relevant to casting, modeling, performance, or other appearance-based work.",
        nextStep:
          "Verify the company, intended use, storage method, and whether the request is appropriate for the role.",
        points: 0,
        target: "listing-quality",
      });
    } else {
      addFinding(builder, {
        id: "unrelated-photo",
        title:
          "The application requests a photo or headshot unrelated to the work.",
        explanation:
          "A photo can expose applicants to appearance-based screening and is not normally needed for most applications.",
        nextStep:
          "Ask why the photo is needed and whether the application can proceed without it.",
        points: -5,
        target: "listing-quality",
        question:
          "Why is a photo necessary for this position?",
      });
    }
  }

  const familyOrRelationshipQuestion =
    contains(
      text,
      /are you married|marital status|do you have children|how many children|planning to have children|pregnant|pregnancy status|childcare arrangements|spouse'?s name|partner'?s name/i,
    );

  if (familyOrRelationshipQuestion) {
    addFinding(builder, {
      id: "family-status",
      title:
        "The application asks about marriage, pregnancy, children, or family arrangements.",
      explanation:
        "These questions may be unrelated to the applicant’s ability to perform the job and may create discrimination concerns.",
      nextStep:
        "Do not provide unnecessary personal details. Ask how the question relates to the essential duties or schedule.",
      points: -7,
      target: "listing-quality",
      question:
        "How does this family-status question relate to the essential duties of the job?",
    });
  }

  const religionQuestion =
    contains(
      text,
      /what is your religion|religious affiliation|church membership|place of worship|religious beliefs|which religion/i,
    );

  if (religionQuestion) {
    addFinding(builder, {
      id: "religion",
      title:
        "The application asks about religion or religious affiliation.",
      explanation:
        "Religious questions may be unrelated to job duties and can create discrimination concerns, although some religious organizations may have role-specific requirements.",
      nextStep:
        "Ask whether the question is an essential and lawful requirement for the specific role.",
      points: -6,
      target: "listing-quality",
      question:
        "Why is religious affiliation relevant to this position?",
    });
  }

  const medicalQuestion =
    contains(
      text,
      /medical diagnosis|mental health diagnosis|disability diagnosis|list your disabilities|medical history|medications you take|health condition|psychiatric history/i,
    );

  if (medicalQuestion) {
    if (laterStageLanguage) {
      addFinding(builder, {
        id: "later-stage-medical",
        title:
          "Medical or disability information is described as a later-stage requirement.",
        explanation:
          "Some post-offer medical or accommodation processes may be legitimate, but the request should be job-related and handled confidentially.",
        nextStep:
          "Confirm who receives the information, why it is needed, and how it will be protected.",
        points: 0,
        target: "listing-quality",
      });
    } else {
      addFinding(builder, {
        id: "early-medical",
        title:
          "The application asks for medical, disability, or medication details before an offer.",
        explanation:
          "Detailed health questions may be inappropriate during an initial application and can create discrimination or privacy concerns.",
        nextStep:
          "Do not provide unnecessary medical details. Ask whether the employer only needs to know if you can perform the essential duties with or without accommodation.",
        points: -7,
        target: "listing-quality",
        question:
          "Why is detailed medical information needed before a conditional offer?",
      });
    }
  }

  const ageQuestion =
    contains(
      text,
      /how old are you|what is your age|your exact age|year of birth|date of birth|birth date/i,
    );

  if (
    ageQuestion &&
    !identityDocumentRequest
  ) {
    addFinding(builder, {
      id: "age",
      title:
        "The application asks for an exact age or birth date.",
      explanation:
        "An employer may need to confirm that an applicant meets a lawful minimum-age requirement, but an exact age or birth date may be unnecessary during the application.",
      nextStep:
        "Ask whether the employer can instead confirm that applicants meet the required minimum age.",
      points: -5,
      target: "listing-quality",
      question:
        "Can the employer ask only whether the applicant meets the lawful minimum-age requirement?",
    });
  }

  const nationalityQuestion =
    contains(
      text,
      /what is your nationality|country of origin|place of birth|where were you born|are you a citizen|proof of citizenship|citizenship status|\bcitizenship\b/i,
    );

  if (nationalityQuestion) {
    if (roleSpecificLegalRequirement) {
      addFinding(builder, {
        id: "role-specific-citizenship",
        title:
          "The posting links citizenship to a stated legal or clearance requirement.",
        explanation:
          "Some roles may have lawful citizenship, export-control, or security-clearance restrictions.",
        nextStep:
          "Confirm the exact legal requirement and whether permanent residents or other authorized workers qualify.",
        points: 0,
        target: "listing-quality",
      });
    } else {
      addFinding(builder, {
        id: "nationality",
        title:
          "The application asks about citizenship, nationality, or place of birth without explaining why.",
        explanation:
          "Employers commonly ask about authorization to work and sponsorship needs rather than nationality or birthplace.",
        nextStep:
          "Ask whether the employer can use standard work-authorization and sponsorship questions instead.",
        points: -5,
        target: "listing-quality",
        question:
          "Why is citizenship or nationality required instead of standard work-authorization information?",
      });
    }
  }

  const standardAuthorizationQuestion =
    contains(
      text,
      /authorized to work|legally authorized to work|require sponsorship|need sponsorship|employment authorization|work authorization/i,
    );

  if (
    standardAuthorizationQuestion &&
    !nationalityQuestion
  ) {
    addFinding(builder, {
      id: "work-authorization",
      title:
        "The posting uses standard work-authorization or sponsorship language.",
      explanation:
        "Asking whether an applicant is authorized to work or will require sponsorship is a common employment-process question.",
      nextStep:
        "Answer accurately and review any stated sponsorship restrictions.",
      points: 2,
      target: "listing-quality",
    });
  }

  if (voluntaryDemographics) {
    addFinding(builder, {
      id: "voluntary-demographics",
      title:
        "Demographic questions are described as voluntary or optional.",
      explanation:
        "A separate voluntary demographic survey may be used for equal-employment monitoring and should allow applicants to decline.",
      nextStep:
        "Confirm that the questions are optional, separate from hiring decisions, and include a prefer-not-to-answer option.",
      points: 2,
      target: "listing-quality",
    });
  } else {
    const mandatoryProtectedTraits =
      contains(
        text,
        /race required|ethnicity required|gender required|sexual orientation required|disability status required|veteran status required/i,
      );

    if (mandatoryProtectedTraits) {
      addFinding(builder, {
        id: "mandatory-demographics",
        title:
          "Protected demographic information appears to be mandatory.",
        explanation:
          "Demographic monitoring questions are usually presented separately and voluntarily rather than as required hiring criteria.",
        nextStep:
          "Ask whether the questions are optional and how the information is separated from hiring decisions.",
        points: -7,
        target: "listing-quality",
        question:
          "Are these demographic questions voluntary and separate from the hiring decision?",
      });
    }
  }

  const preOfferBackgroundOrMedicalTest =
    contains(
      text,
      /background check before interview|drug test before interview|medical exam before interview|background check before application|drug screening before application/i,
    );

  if (preOfferBackgroundOrMedicalTest) {
    addFinding(builder, {
      id: "pre-offer-screening",
      title:
        "A background, drug, or medical screening is requested unusually early.",
      explanation:
        "Screening requirements are often handled later in the process through a verified provider.",
      nextStep:
        "Verify the employer and screening company before providing information, samples, identification, or payment.",
      points: -6,
      target: "personal-safety",
      question:
        "Why is this screening required before a verified interview or conditional offer?",
    });
  }

  if (builder.findings.length === 0) {
    return null;
  }

  return {
    summary:
      summarize(
        builder.findings,
      ),
    adjustments: {
      listingQuality:
        clampAdjustment(
          builder.listingQuality,
        ),
      personalSafety:
        clampAdjustment(
          builder.personalSafety,
        ),
    },
    findings:
      builder.findings,
    questions:
      unique(
        builder.questions,
      ),
  };
}