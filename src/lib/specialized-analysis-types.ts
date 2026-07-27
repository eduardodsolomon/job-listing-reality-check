export type OpportunityType =
  | "standard"
  | "contract"
  | "government"
  | "nonprofit"
  | "internship"
  | "volunteer"
  | "not-sure";

export type OpportunitySubtype =
  | "contract-1099"
  | "contract-staffing"
  | "contract-c2c"
  | "contract-unsure"
  | "government-federal"
  | "government-state-local"
  | "government-contractor"
  | "government-unsure"
  | "nonprofit-paid"
  | "nonprofit-grant-funded"
  | "nonprofit-fellowship"
  | "nonprofit-unsure"
  | "internship-paid"
  | "internship-unpaid"
  | "internship-credit"
  | "internship-unsure"
  | "volunteer-ongoing"
  | "volunteer-board"
  | "volunteer-service-program"
  | "volunteer-unsure";

export interface OpportunityOption<
  TValue extends string,
> {
  value: TValue;
  label: string;
  description: string;
}

export const OPPORTUNITY_TYPE_OPTIONS: OpportunityOption<OpportunityType>[] =
  [
    {
      value: "standard",
      label: "Standard employee job",
      description:
        "A regular W-2 employee position.",
    },
    {
      value: "contract",
      label: "Contract or 1099 job",
      description:
        "Independent contractor, staffing, consulting, or C2C work.",
    },
    {
      value: "government",
      label: "Government job",
      description:
        "A direct government role or a government-contractor role.",
    },
    {
      value: "nonprofit",
      label: "Nonprofit job",
      description:
        "Paid nonprofit employment, grant-funded work, or a fellowship.",
    },
    {
      value: "internship",
      label: "Internship or fellowship",
      description:
        "Paid, unpaid, academic-credit, or training-focused work.",
    },
    {
      value: "volunteer",
      label: "Volunteer or service role",
      description:
        "An unpaid volunteer, board, or service-program opportunity.",
    },
    {
      value: "not-sure",
      label: "Not sure",
      description:
        "Use the general job checks without a specialized profile.",
    },
  ];

const CONTRACT_SUBTYPES: OpportunityOption<OpportunitySubtype>[] =
  [
    {
      value: "contract-1099",
      label: "1099 independent contractor",
      description:
        "You would work as an independent contractor rather than an employee.",
    },
    {
      value: "contract-staffing",
      label: "Staffing-agency contract",
      description:
        "A staffing company would employ or place you with a client.",
    },
    {
      value: "contract-c2c",
      label: "Corp-to-corp or consulting",
      description:
        "The arrangement may require a business entity or consulting company.",
    },
    {
      value: "contract-unsure",
      label: "Contract type unclear",
      description:
        "The recruiter has not clearly explained the arrangement.",
    },
  ];

const GOVERNMENT_SUBTYPES: OpportunityOption<OpportunitySubtype>[] =
  [
    {
      value: "government-federal",
      label: "Federal government",
      description:
        "A direct federal-government position.",
    },
    {
      value: "government-state-local",
      label: "State or local government",
      description:
        "A state, county, city, town, authority, or other public-agency role.",
    },
    {
      value: "government-contractor",
      label: "Government contractor",
      description:
        "A private employer performing work for a government client.",
    },
    {
      value: "government-unsure",
      label: "Government relationship unclear",
      description:
        "It is not clear whether the role is direct government employment or contract work.",
    },
  ];

const NONPROFIT_SUBTYPES: OpportunityOption<OpportunitySubtype>[] =
  [
    {
      value: "nonprofit-paid",
      label: "Paid nonprofit staff role",
      description:
        "A regular paid position with a nonprofit organization.",
    },
    {
      value: "nonprofit-grant-funded",
      label: "Grant-funded position",
      description:
        "The job may depend on a grant or limited funding period.",
    },
    {
      value: "nonprofit-fellowship",
      label: "Nonprofit fellowship",
      description:
        "A time-limited fellowship, service, or professional-development role.",
    },
    {
      value: "nonprofit-unsure",
      label: "Nonprofit arrangement unclear",
      description:
        "Pay, funding, or employment status has not been clearly explained.",
    },
  ];

const INTERNSHIP_SUBTYPES: OpportunityOption<OpportunitySubtype>[] =
  [
    {
      value: "internship-paid",
      label: "Paid internship",
      description:
        "The internship provides wages or a stated stipend.",
    },
    {
      value: "internship-unpaid",
      label: "Unpaid internship",
      description:
        "The internship does not provide wages.",
    },
    {
      value: "internship-credit",
      label: "Academic-credit internship",
      description:
        "The internship is connected to school credit or a practicum requirement.",
    },
    {
      value: "internship-unsure",
      label: "Internship terms unclear",
      description:
        "Pay, hours, duration, or academic-credit terms are unclear.",
    },
  ];

const VOLUNTEER_SUBTYPES: OpportunityOption<OpportunitySubtype>[] =
  [
    {
      value: "volunteer-ongoing",
      label: "Ongoing volunteer role",
      description:
        "A recurring unpaid volunteer commitment.",
    },
    {
      value: "volunteer-board",
      label: "Board or committee service",
      description:
        "An unpaid board, advisory, governance, or committee role.",
    },
    {
      value: "volunteer-service-program",
      label: "Service program",
      description:
        "A structured service role that may include a stipend or benefits.",
    },
    {
      value: "volunteer-unsure",
      label: "Volunteer terms unclear",
      description:
        "The time commitment, duties, or unpaid status is unclear.",
    },
  ];

export function getOpportunitySubtypeOptions(
  type: OpportunityType,
): OpportunityOption<OpportunitySubtype>[] {
  switch (type) {
    case "contract":
      return CONTRACT_SUBTYPES;

    case "government":
      return GOVERNMENT_SUBTYPES;

    case "nonprofit":
      return NONPROFIT_SUBTYPES;

    case "internship":
      return INTERNSHIP_SUBTYPES;

    case "volunteer":
      return VOLUNTEER_SUBTYPES;

    default:
      return [];
  }
}

export function getOpportunityTypeLabel(
  type: OpportunityType,
): string {
  return (
    OPPORTUNITY_TYPE_OPTIONS.find(
      (option) =>
        option.value === type,
    )?.label ?? "Standard employee job"
  );
}

export function getOpportunitySubtypeLabel(
  subtype:
    OpportunitySubtype | undefined,
): string | null {
  if (!subtype) {
    return null;
  }

  const allOptions = [
    ...CONTRACT_SUBTYPES,
    ...GOVERNMENT_SUBTYPES,
    ...NONPROFIT_SUBTYPES,
    ...INTERNSHIP_SUBTYPES,
    ...VOLUNTEER_SUBTYPES,
  ];

  return (
    allOptions.find(
      (option) =>
        option.value === subtype,
    )?.label ?? null
  );
}

export type SpecializedScoreTarget =
  | "listing-quality"
  | "personal-safety";

export type SpecializedFindingKind =
  | "positive"
  | "warning"
  | "critical"
  | "information";

export interface SpecializedFinding {
  id: string;
  title: string;
  explanation: string;
  nextStep: string;
  points: number;
  target: SpecializedScoreTarget;
  kind: SpecializedFindingKind;
}

export interface SpecializedAdjustments {
  listingQuality: number;
  personalSafety: number;
}

export interface SpecializedAnalysisResult {
  profileType: OpportunityType;
  profileLabel: string;
  subtype:
    OpportunitySubtype | undefined;
  subtypeLabel: string | null;
  summary: string;
  adjustments: SpecializedAdjustments;
  findings: SpecializedFinding[];
  questions: string[];
}