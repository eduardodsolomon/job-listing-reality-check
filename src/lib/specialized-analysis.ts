import type { AnalysisInput } from "./analysis-types";

import {
  getOpportunitySubtypeLabel,
  getOpportunityTypeLabel,
  type SpecializedAnalysisResult,
  type SpecializedFinding,
  type SpecializedFindingKind,
  type SpecializedScoreTarget,
} from "./specialized-analysis-types";

interface FindingInput {
  id: string;
  title: string;
  explanation: string;
  nextStep: string;
  points: number;
  target: SpecializedScoreTarget;
  question?: string;
}

interface AnalysisBuilder {
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
    Math.min(20, value),
  );
}

function findingKind(
  points: number,
): SpecializedFindingKind {
  if (points >= 0) {
    return points === 0
      ? "information"
      : "positive";
  }

  if (points <= -10) {
    return "critical";
  }

  return "warning";
}

function addFinding(
  builder: AnalysisBuilder,
  finding: FindingInput,
): void {
  builder.findings.push({
    id: finding.id,
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

function has(
  text: string,
  pattern: RegExp,
): boolean {
  return pattern.test(text);
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

function analyzeContract(
  text: string,
  builder: AnalysisBuilder,
): void {
  const classificationFound =
    has(
      text,
      /\b1099\b|independent contractor|contractor classification|w-2|w2|corp[- ]to[- ]corp|\bc2c\b|staffing agency|consulting agreement/i,
    );

  addFinding(builder, {
    id: "contract-classification",
    title: classificationFound
      ? "The worker classification is described."
      : "The worker classification is unclear.",
    explanation:
      classificationFound
        ? "The posting identifies at least part of the employment or contracting arrangement."
        : "It is not clear whether the worker would be a W-2 employee, 1099 contractor, staffing employee, or business-to-business consultant.",
    nextStep:
      classificationFound
        ? "Confirm that the written agreement uses the same classification."
        : "Ask whether the role is W-2, 1099, staffing-agency employment, or corp-to-corp.",
    points:
      classificationFound
        ? 5
        : -6,
    target: "listing-quality",
    question:
      classificationFound
        ? undefined
        : "What is the exact worker classification: W-2, 1099, staffing employee, or corp-to-corp?",
  });

  const payFound = has(
    text,
    /\$\s?\d|hourly rate|hourly pay|project fee|contract rate|compensation|pay range|salary range/i,
  );

  addFinding(builder, {
    id: "contract-pay",
    title: payFound
      ? "The contract pay is described."
      : "The contract pay is missing.",
    explanation:
      payFound
        ? "The posting includes compensation information."
        : "The posting does not clearly state an hourly rate, project fee, or payment amount.",
    nextStep:
      payFound
        ? "Confirm whether the amount includes taxes, expenses, and unpaid administrative time."
        : "Ask for the hourly rate, project fee, overtime terms, and any unpaid time expectations.",
    points: payFound ? 6 : -6,
    target: "listing-quality",
    question:
      payFound
        ? undefined
        : "What is the hourly rate or total project fee?",
  });

  const durationFound = has(
    text,
    /\b\d+\s*(week|weeks|month|months|year|years)\b|contract duration|contract term|end date|through\s+\w+\s+\d{4}/i,
  );

  addFinding(builder, {
    id: "contract-duration",
    title: durationFound
      ? "The contract duration is described."
      : "The contract duration is missing.",
    explanation:
      durationFound
        ? "The posting includes a time period or end date."
        : "The posting does not clearly state how long the contract is expected to last.",
    nextStep:
      durationFound
        ? "Confirm whether the contract may end early or be extended."
        : "Ask for the expected start date, end date, renewal terms, and early-termination rules.",
    points:
      durationFound ? 4 : -4,
    target: "listing-quality",
    question:
      durationFound
        ? undefined
        : "What are the expected start date, end date, and renewal terms?",
  });

  const hoursFound = has(
    text,
    /hours per week|weekly hours|\b\d+\s*hours\b|full[- ]time|part[- ]time|work schedule/i,
  );

  addFinding(builder, {
    id: "contract-hours",
    title: hoursFound
      ? "The expected hours are described."
      : "The expected hours are unclear.",
    explanation:
      hoursFound
        ? "The opportunity provides some information about workload or schedule."
        : "The posting does not clearly state the expected weekly commitment.",
    nextStep:
      hoursFound
        ? "Confirm whether all required meetings and administrative work are paid."
        : "Ask how many hours are expected each week and which hours are billable.",
    points: hoursFound ? 3 : -3,
    target: "listing-quality",
    question:
      hoursFound
        ? undefined
        : "How many weekly hours are expected, and which hours are billable?",
  });

  const paymentScheduleFound =
    has(
      text,
      /paid weekly|paid biweekly|paid monthly|net[- ]?\d+|payment schedule|invoice|invoicing/i,
    );

  if (paymentScheduleFound) {
    addFinding(builder, {
      id: "contract-payment-schedule",
      title:
        "The payment schedule is described.",
      explanation:
        "The posting explains when or how contractor payments are made.",
      nextStep:
        "Confirm the invoicing process and late-payment terms in writing.",
      points: 3,
      target: "listing-quality",
    });
  } else {
    builder.questions.push(
      "When are invoices submitted and when are contractors paid?",
    );
  }

  const dangerousFee = has(
    text,
    /application fee|training fee|registration fee|processing fee|pay to start|purchase.*equipment|buy.*equipment|deposit.*check/i,
  );

  if (dangerousFee) {
    addFinding(builder, {
      id: "contract-fee",
      title:
        "The contract includes an unusual payment or equipment request.",
      explanation:
        "Applicants should not normally have to pay fees, deposit checks, or purchase equipment through a recruiter.",
      nextStep:
        "Do not pay, deposit a check, or purchase equipment. Verify the company independently.",
      points: -15,
      target: "personal-safety",
    });
  }

  const unpaidTest = has(
    text,
    /unpaid test|unpaid trial|free trial project|complete.*without pay|sample project.*unpaid/i,
  );

  if (unpaidTest) {
    addFinding(builder, {
      id: "contract-unpaid-test",
      title:
        "The employer requests unpaid work.",
      explanation:
        "An unpaid test may produce useful work for the employer without compensation.",
      nextStep:
        "Ask for a short, limited evaluation or a paid work sample instead.",
      points: -10,
      target: "personal-safety",
    });
  }
}

function analyzeGovernment(
  text: string,
  url: string,
  subtype: string | undefined,
  builder: AnalysisBuilder,
): void {
  const contractorProfile =
    subtype ===
    "government-contractor";

  const officialSource =
    /\.gov(?:\/|$)/i.test(url);

  if (contractorProfile) {
    addFinding(builder, {
      id:
        "government-contractor-source",
      title:
        officialSource
          ? "A government source is included."
          : "The role appears to be posted by a contractor.",
      explanation:
        officialSource
          ? "The URL uses a government domain."
          : "Government-contractor jobs are commonly posted on the private employer’s own careers website.",
      nextStep:
        officialSource
          ? "Confirm that the application stays on the official site."
          : "Verify the contractor on its official careers site and ask which agency or contract supports the role.",
      points:
        officialSource ? 6 : 2,
      target: "listing-quality",
    });
  } else {
    addFinding(builder, {
      id: "government-source",
      title: officialSource
        ? "The URL uses a government domain."
        : "An official government source was not identified.",
      explanation:
        officialSource
          ? "A .gov address provides stronger evidence that the posting comes from a public agency."
          : "Direct government jobs are usually available through an official government employment system.",
      nextStep:
        officialSource
          ? "Confirm that the entire application remains on the official government website."
          : "Search for the job on the agency’s official .gov careers page.",
      points:
        officialSource ? 8 : -6,
      target: "listing-quality",
      question:
        officialSource
          ? undefined
          : "Where is this job posted on the agency’s official government website?",
    });
  }

  const jobNumberFound = has(
    text,
    /requisition|job id|posting id|announcement number|vacancy number|position number|req(?:uisition)?\s*#?\s*[a-z0-9-]+/i,
  );

  addFinding(builder, {
    id: "government-job-number",
    title: jobNumberFound
      ? "A job or announcement number is included."
      : "A job or announcement number is missing.",
    explanation:
      jobNumberFound
        ? "The number can help confirm the exact public opening."
        : "Government postings commonly include a vacancy, requisition, announcement, or position number.",
    nextStep:
      jobNumberFound
        ? "Use the number when searching the official careers system."
        : "Ask for the official vacancy, requisition, announcement, or position number.",
    points:
      jobNumberFound ? 5 : -5,
    target: "listing-quality",
    question:
      jobNumberFound
        ? undefined
        : "What is the official vacancy, announcement, or position number?",
  });

  const payFound = has(
    text,
    /\$\s?\d|salary range|pay range|pay grade|salary grade|grade\s+\d+|\bgs-\d+/i,
  );

  addFinding(builder, {
    id: "government-pay",
    title: payFound
      ? "Government pay information is included."
      : "Government pay information is missing.",
    explanation:
      payFound
        ? "The posting includes a salary, grade, or pay range."
        : "The posting does not clearly state the salary range or pay grade.",
    nextStep:
      payFound
        ? "Confirm the hiring step within the stated grade or range."
        : "Ask for the salary range, grade, and expected hiring step.",
    points: payFound ? 5 : -4,
    target: "listing-quality",
    question:
      payFound
        ? undefined
        : "What is the salary range, grade, and expected hiring step?",
  });

  const deadlineFound = has(
    text,
    /application deadline|closing date|closes on|open until|apply by|deadline/i,
  );

  addFinding(builder, {
    id: "government-deadline",
    title: deadlineFound
      ? "An application deadline is included."
      : "The application deadline is unclear.",
    explanation:
      deadlineFound
        ? "The posting explains when applications close."
        : "Many public-sector postings use a formal closing date.",
    nextStep:
      deadlineFound
        ? "Submit through the official system before the deadline."
        : "Confirm whether the posting has a closing date or is continuously open.",
    points:
      deadlineFound ? 3 : -2,
    target: "listing-quality",
    question:
      deadlineFound
        ? undefined
        : "What is the official application deadline?",
  });

  const contingent = has(
    text,
    /contingent on award|pending contract award|proposal position|anticipated award|pipeline role|subject to funding/i,
  );

  if (contingent) {
    addFinding(builder, {
      id: "government-contingent",
      title:
        "The role may depend on future funding or a contract award.",
      explanation:
        "The employer may be collecting applicants before the work is formally approved.",
      nextStep:
        "Ask whether the contract or funding has been awarded and whether the role is currently approved.",
      points:
        contractorProfile ? -4 : -8,
      target: "listing-quality",
    });
  }

  const feeFound = has(
    text,
    /application fee|processing fee|background check fee|security clearance fee|pay.*clearance/i,
  );

  if (feeFound) {
    addFinding(builder, {
      id: "government-fee",
      title:
        "The application requests an unusual fee.",
      explanation:
        "Government applicants generally should not pay a recruiter for an application, clearance, or background check.",
      nextStep:
        "Do not pay the fee. Contact the agency or contractor through its official website.",
      points: -15,
      target: "personal-safety",
    });
  }
}

function analyzeNonprofit(
  text: string,
  builder: AnalysisBuilder,
): void {
  const compensationFound = has(
    text,
    /\$\s?\d|salary range|pay range|hourly rate|stipend|compensation|paid position/i,
  );

  const unpaidLanguage = has(
    text,
    /\bunpaid\b|volunteer position|volunteer role|without compensation/i,
  );

  addFinding(builder, {
    id: "nonprofit-compensation",
    title: compensationFound
      ? "Compensation is described."
      : unpaidLanguage
        ? "The role appears to be unpaid."
        : "Compensation is unclear.",
    explanation:
      compensationFound
        ? "The posting includes salary, pay, or stipend information."
        : unpaidLanguage
          ? "The opportunity identifies itself as unpaid or volunteer work."
          : "The posting does not clearly explain whether the role is paid.",
    nextStep:
      compensationFound
        ? "Confirm whether the compensation is guaranteed for the full role."
        : "Ask whether the role is paid, salaried, hourly, stipended, or entirely volunteer.",
    points:
      compensationFound
        ? 5
        : unpaidLanguage
          ? -6
          : -4,
    target: "listing-quality",
    question:
      compensationFound
        ? undefined
        : "Is the role paid, stipended, or entirely volunteer?",
  });

  const benefitsFound = has(
    text,
    /health insurance|medical insurance|dental|vision|retirement|401k|403b|paid time off|\bpto\b|benefits package/i,
  );

  addFinding(builder, {
    id: "nonprofit-benefits",
    title: benefitsFound
      ? "Benefits are described."
      : "Benefits are not described.",
    explanation:
      benefitsFound
        ? "The posting includes at least some employee benefits."
        : "The posting does not clearly explain whether benefits are provided.",
    nextStep:
      benefitsFound
        ? "Confirm eligibility dates and employee costs."
        : "Ask whether the role includes health insurance, leave, retirement, or other benefits.",
    points:
      benefitsFound ? 3 : -1,
    target: "listing-quality",
    question:
      benefitsFound
        ? undefined
        : "What benefits are included, and when does eligibility begin?",
  });

  const fundingFound = has(
    text,
    /grant[- ]funded|funding through|funded through|subject to grant|renewal funding|multi[- ]year grant|one[- ]year grant/i,
  );

  if (fundingFound) {
    addFinding(builder, {
      id: "nonprofit-funding",
      title:
        "The funding arrangement is disclosed.",
      explanation:
        "The posting explains that the role depends on grant or limited-term funding.",
      nextStep:
        "Ask what happens if the grant is not renewed.",
      points: 3,
      target: "listing-quality",
    });
  }

  const personalFundraising = has(
    text,
    /personal fundraising|fundraising requirement|raise\s+\$|required to fundraise|bring in donors|secure donations/i,
  );

  if (personalFundraising) {
    addFinding(builder, {
      id:
        "nonprofit-fundraising",
      title:
        "The role includes a personal fundraising requirement.",
      explanation:
        "Applicants may be expected to raise money or use their personal networks as a condition of participation.",
      nextStep:
        "Ask for the exact fundraising requirement and whether personal contributions are expected.",
      points: -8,
      target: "listing-quality",
    });
  }

  const fullTimeUnpaid =
    unpaidLanguage &&
    has(
      text,
      /full[- ]time|40\s*hours|35\s*hours|five days a week/i,
    );

  if (fullTimeUnpaid) {
    addFinding(builder, {
      id:
        "nonprofit-full-time-unpaid",
      title:
        "The unpaid role appears to require full-time work.",
      explanation:
        "A full-time unpaid commitment may place substantial costs and risks on the worker.",
      nextStep:
        "Clarify whether the duties should instead be performed by a paid employee.",
      points: -12,
      target: "personal-safety",
    });
  }
}

function analyzeInternship(
  text: string,
  builder: AnalysisBuilder,
): void {
  const paid = has(
    text,
    /\$\s?\d|paid internship|hourly pay|salary|stipend|compensation/i,
  );

  const unpaid = has(
    text,
    /unpaid internship|without compensation|\bunpaid\b/i,
  );

  addFinding(builder, {
    id: "internship-pay",
    title: paid
      ? "Internship compensation is described."
      : unpaid
        ? "The internship is described as unpaid."
        : "Internship compensation is unclear.",
    explanation:
      paid
        ? "The posting includes wages or a stipend."
        : unpaid
          ? "The posting states that the internship is unpaid."
          : "The posting does not clearly state whether the internship is paid.",
    nextStep:
      paid
        ? "Confirm the amount, pay schedule, and total expected hours."
        : "Ask whether the internship is paid, stipended, or connected to academic credit.",
    points:
      paid ? 6 : unpaid ? -5 : -4,
    target: "listing-quality",
    question:
      paid
        ? undefined
        : "Is the internship paid, stipended, unpaid, or offered only for academic credit?",
  });

  const durationFound = has(
    text,
    /\b\d+\s*(week|weeks|month|months)\b|semester|summer internship|fall internship|spring internship|start date|end date/i,
  );

  addFinding(builder, {
    id: "internship-duration",
    title: durationFound
      ? "The internship duration is described."
      : "The internship duration is missing.",
    explanation:
      durationFound
        ? "The posting provides a term, season, or date range."
        : "The posting does not clearly state how long the internship lasts.",
    nextStep:
      durationFound
        ? "Confirm the start date, end date, and extension expectations."
        : "Ask for the exact start date, end date, and total length.",
    points:
      durationFound ? 4 : -3,
    target: "listing-quality",
    question:
      durationFound
        ? undefined
        : "What are the internship start date, end date, and total duration?",
  });

  const hoursFound = has(
    text,
    /hours per week|weekly hours|\b\d+\s*hours\b|part[- ]time|full[- ]time|schedule/i,
  );

  addFinding(builder, {
    id: "internship-hours",
    title: hoursFound
      ? "The expected hours are described."
      : "The expected hours are unclear.",
    explanation:
      hoursFound
        ? "The posting includes workload or schedule information."
        : "The posting does not clearly state the weekly time commitment.",
    nextStep:
      hoursFound
        ? "Confirm whether meetings, training, and preparation time are included."
        : "Ask how many hours are expected each week.",
    points: hoursFound ? 3 : -2,
    target: "listing-quality",
    question:
      hoursFound
        ? undefined
        : "How many hours per week are expected?",
  });

  const supervisionMentioned = has(
    text,
    /supervisor|supervision|mentor|mentorship|learning plan|training plan|professional development/i,
  );

  const supervisionDenied = has(
    text,
    /(?:no|without)\s+(?:regular\s+)?(?:supervision|supervisor|mentor|mentorship|training|professional development)|(?:supervision|supervisor|mentor|mentorship|training|professional development)[^.!?\n]{0,60}(?:(?:is|are|was|were)\s+)?(?:not provided|not included|not available|unavailable|none)/i,
  );

  const supervisionFound =
    supervisionMentioned &&
    !supervisionDenied;

  addFinding(builder, {
    id: "internship-supervision",
    title: supervisionFound
      ? "Supervision or mentorship is described."
      : "Supervision is not described.",
    explanation:
      supervisionFound
        ? "The posting includes training, supervision, or mentorship."
        : "The posting does not clearly identify who will supervise or teach the intern.",
    nextStep:
      supervisionFound
        ? "Confirm how often supervision and feedback occur."
        : "Ask who supervises the internship and what training or feedback is provided.",
    points:
      supervisionFound ? 4 : -3,
    target: "listing-quality",
    question:
      supervisionFound
        ? undefined
        : "Who supervises the internship, and how often is feedback provided?",
  });

  const fullTimeUnpaid =
    unpaid &&
    has(
      text,
      /full[- ]time|40\s*hours|35\s*hours|five days a week/i,
    );

  if (fullTimeUnpaid) {
    addFinding(builder, {
      id:
        "internship-full-time-unpaid",
      title:
        "The unpaid internship appears to require full-time work.",
      explanation:
        "A full-time unpaid schedule can shift substantial costs onto the intern.",
      nextStep:
        "Ask whether compensation, reduced hours, academic credit, transportation, or other support is available.",
      points: -10,
      target: "personal-safety",
    });
  }

  const feeFound = has(
    text,
    /application fee|program fee|placement fee|training fee|pay to participate/i,
  );

  if (feeFound) {
    addFinding(builder, {
      id: "internship-fee",
      title:
        "The internship requires an unusual fee.",
      explanation:
        "Applicants should be cautious when asked to pay for access to an internship.",
      nextStep:
        "Do not pay until the program and fee are independently verified.",
      points: -15,
      target: "personal-safety",
    });
  }
}

function analyzeVolunteer(
  text: string,
  builder: AnalysisBuilder,
): void {
  const volunteerStatus = has(
    text,
    /volunteer|unpaid service|board service|committee service|service opportunity/i,
  );

  addFinding(builder, {
    id: "volunteer-status",
    title: volunteerStatus
      ? "The unpaid or volunteer status is stated."
      : "The volunteer status is unclear.",
    explanation:
      volunteerStatus
        ? "The opportunity identifies itself as volunteer or unpaid service."
        : "The posting does not clearly explain whether the role is paid or unpaid.",
    nextStep:
      volunteerStatus
        ? "Confirm that all required duties and costs are disclosed."
        : "Ask whether the role is paid, stipended, or entirely unpaid.",
    points:
      volunteerStatus ? 4 : -4,
    target: "listing-quality",
    question:
      volunteerStatus
        ? undefined
        : "Is this role paid, stipended, or entirely unpaid?",
  });

  const hoursFound = has(
    text,
    /hours per week|weekly commitment|monthly commitment|\b\d+\s*hours\b|meeting schedule|time commitment/i,
  );

  addFinding(builder, {
    id: "volunteer-hours",
    title: hoursFound
      ? "The time commitment is described."
      : "The time commitment is unclear.",
    explanation:
      hoursFound
        ? "The posting provides information about the expected schedule."
        : "The posting does not clearly state how much time volunteers are expected to contribute.",
    nextStep:
      hoursFound
        ? "Confirm whether preparation, travel, and meetings are included."
        : "Ask for the weekly or monthly time commitment.",
    points: hoursFound ? 4 : -3,
    target: "listing-quality",
    question:
      hoursFound
        ? undefined
        : "What is the expected weekly or monthly time commitment?",
  });

  const supportFound = has(
    text,
    /training|orientation|supervisor|supervision|mentor|staff support|reimbursement|travel reimbursement|expense reimbursement/i,
  );

  if (supportFound) {
    addFinding(builder, {
      id: "volunteer-support",
      title:
        "Training, supervision, or expense support is described.",
      explanation:
        "The organization provides at least some structure or support for volunteers.",
      nextStep:
        "Confirm which expenses are reimbursed and who supervises the work.",
      points: 3,
      target: "listing-quality",
    });
  } else {
    builder.questions.push(
      "What training, supervision, insurance, and expense reimbursement are provided?",
    );
  }

  const fullTimeUnpaid =
    volunteerStatus &&
    has(
      text,
      /full[- ]time|40\s*hours|35\s*hours|five days a week/i,
    );

  if (fullTimeUnpaid) {
    addFinding(builder, {
      id:
        "volunteer-full-time",
      title:
        "The unpaid role appears to require full-time work.",
      explanation:
        "A full-time volunteer schedule may resemble paid staff work while shifting costs to the volunteer.",
      nextStep:
        "Ask why the duties are unpaid and whether a paid role should perform them.",
      points: -12,
      target: "listing-quality",
    });
  }

  const feeFound = has(
    text,
    /application fee|program fee|membership fee|training fee|purchase.*equipment|buy.*uniform/i,
  );

  if (feeFound) {
    addFinding(builder, {
      id: "volunteer-fee",
      title:
        "The volunteer role requires an unusual fee or purchase.",
      explanation:
        "Fees or required purchases can make an unpaid opportunity financially risky.",
      nextStep:
        "Do not pay until the organization, requirement, and refund terms are independently verified.",
      points: -12,
      target: "personal-safety",
    });
  }
}

function resultSummary(
  findings: SpecializedFinding[],
  profileLabel: string,
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
    return `${profileLabel} checks found ${serious} serious concern${serious === 1 ? "" : "s"}.`;
  }

  if (warnings > 0) {
    return `${profileLabel} checks found ${warnings} item${warnings === 1 ? "" : "s"} that should be clarified.`;
  }

  if (positives > 0) {
    return `${profileLabel} checks found several useful details.`;
  }

  return `No additional ${profileLabel.toLowerCase()} findings were generated.`;
}

export function analyzeSpecializedProfile(
  input: AnalysisInput,
): SpecializedAnalysisResult | null {
  const profileType =
    input.opportunityType ??
    "standard";

  if (
    profileType === "standard" ||
    profileType === "not-sure"
  ) {
    return null;
  }

  const subtype =
    input.opportunitySubtype;

  const text = [
    input.company,
    input.listingText,
    input.recruiterMessage,
  ]
    .join(" ")
    .toLowerCase();

  const url =
    input.listingUrl
      .trim()
      .toLowerCase();

  const builder: AnalysisBuilder = {
    findings: [],
    questions: [],
    listingQuality: 0,
    personalSafety: 0,
  };

  switch (profileType) {
    case "contract":
      analyzeContract(
        text,
        builder,
      );
      break;

    case "government":
      analyzeGovernment(
        text,
        url,
        subtype,
        builder,
      );
      break;

    case "nonprofit":
      analyzeNonprofit(
        text,
        builder,
      );
      break;

    case "internship":
      analyzeInternship(
        text,
        builder,
      );
      break;

    case "volunteer":
      analyzeVolunteer(
        text,
        builder,
      );
      break;
  }

  const profileLabel =
    getOpportunityTypeLabel(
      profileType,
    );

  return {
    profileType,
    profileLabel,
    subtype,
    subtypeLabel:
      getOpportunitySubtypeLabel(
        subtype,
      ),
    summary:
      resultSummary(
        builder.findings,
        profileLabel,
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