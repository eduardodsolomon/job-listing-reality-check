/**
 * Central user-facing language for Job Listing Reality Check.
 *
 * This is the primary file to edit when visible wording changes.
 *
 * Keep language separate from application behavior:
 *
 * - Analysis files determine which state applies.
 * - Components determine where information is displayed.
 * - This file determines how that information is worded.
 *
 * Do not place scoring values, regular expressions, storage keys,
 * database field names, or internal identifiers in this file.
 */

export const COPY_REVISION =
  "2026-07-27";

export const PROJECT_LINKS = {
  repository:
    "https://github.com/eduardodsolomon/job-listing-reality-check",

  issues:
    "https://github.com/eduardodsolomon/job-listing-reality-check/issues",

  newIssue:
    "https://github.com/eduardodsolomon/job-listing-reality-check/issues/new",

  discussions:
    "https://github.com/eduardodsolomon/job-listing-reality-check/discussions",
} as const;

export const UI_COPY = {
  app: {
    name:
      "Job Listing Reality Check",

    publicBeta:
      "Public beta",

    checkJob:
      "Check this job",

    clear:
      "Clear",

    nextSteps:
      "Next Steps",

    scoringReceipt:
      "Final Scoring Receipt",

    immediateDangerWarning:
      "Immediate Danger Warning",
  },

  form: {
    company:
      "Company name",

    jobType:
      "Type of Job",

    recruiterMessage:
      "Recruiter Message",

    jobDescription:
      "Job description",

    jobUrl:
      "Job URL",
  },

  jobHealth: {
    excellent:
      "Excellent",

    good:
      "Good",

    needsReview:
      "Needs review",

    concerning:
      "Concerning",

    seriousDanger:
      "Serious danger",

    notEnoughInformation:
      "Not enough information",
  },

  scores: {
    overall:
      "Sanity Score",

    listingQuality:
      "Listing quality",

    personalSafety:
      "Personal safety",

    evidenceQuality:
      "Evidence quality",
  },

  signals: {
    sensitiveInformation:
      "Sensitive information",

    moneyChecksEquipmentOrFees:
      "Money, checks, equipment, or fees",

    messagingApplications:
      "Messaging applications",

    noInterviewOffers:
      "No-interview offers",

    personalEmailAccounts:
      "Personal email accounts",

    urgencyOrPressure:
      "Urgency or pressure",

    contingentRoles:
      "Pipeline, proposal, evergreen, or contingent roles",

    salaryInformation:
      "Missing or present salary",

    requisitionNumber:
      "Missing or present requisition number",

    incompleteDescription:
      "Short or incomplete descriptions",

    genericScamWarning:
      "Generic scam warning",

    genericInactiveListingWarning:
      "Generic inactive-listing warning",

    genericPositiveEvidence:
      "Generic positive evidence",
  },

  nextSteps: {
    gatherInformation:
      "Gather more information",

    reviewRedFlags:
      "Review red flags",

    reviewGreenFlags:
      "Review green flags and decide whether to proceed",
  },

  urlVerification: {
    status: {
      publicRecordVerified:
        "Public job record verified",

      webpageReached:
        "Webpage reached",

      listingNotFound:
        "Listing not found",

      safetyCheckBlocked:
        "Safety check blocked",

      incomplete:
        "Verification incomplete",
    },

    source: {
      greenhouse:
        "Greenhouse public job system",

      lever:
        "Lever public job system",

      generalWebpage:
        "General webpage",
    },

    activity: {
      active:
        "Appears active",

      inactive:
        "Does not appear active",

      unknown:
        "Unknown",
    },

    comparison: {
      match:
        "Match",

      partialMatch:
        "Partial match",

      mismatch:
        "Mismatch",

      notEstablished:
        "Not established",
    },
  },

  savedReports: {
    nothingSaved:
      "Nothing saved",

    noSavedReports:
      "No saved reports yet",

    saved:
      "Report saved",

    savedInBrowser:
      "Report saved in this browser",

    exported:
      "Report exported",

    downloaded:
      "Report downloaded",

    deleted:
      "Report deleted",

    removed:
      "Report removed",

    allDeleted:
      "All reports deleted",

    allRemoved:
      "All saved reports removed",

    unavailable:
      "Saving or export unavailable until both checks are complete",
  },

  communityContribution: {
    category:
      "Community contribution",

    heading:
      "Contribute to community insights",

    introduction:
      "You may voluntarily contribute a de-identified record to help identify broader patterns in job listings and hiring practices.",

    agreement:
      "Yes, submit this information for public good. It will be verified and de-identified before being presented in aggregate.",

    optionalNotice:
      "Submitting is optional and does not affect your use of this tool.",

    privacyReminder:
      "Do not include names, contact information, or confidential details.",

    previewHeading:
      "Review what will be submitted",

    submitButton:
      "Submit community contribution",

    submitting:
      "Submitting contribution",

    submitted:
      "Contribution submitted",

    unavailable:
      "Community contribution is temporarily unavailable",
  },

  feedback: {
    heading:
      "Help improve this project",

    reportBug:
      "Report a bug",

    suggestImprovement:
      "Suggest an improvement",

    suggestLanguage:
      "Suggest clearer wording",

    joinDiscussion:
      "Join the discussion",

    viewSource:
      "View source on GitHub",

    privacyReminder:
      "Do not include private applicant information in a public GitHub post.",
  },

  sectionLabels: {
    researchParticipation:
      "Research participation",

    aggregateInsights:
      "Aggregate insights",

    localWorkspace:
      "Your local workspace",

    dataReview:
      "Research data review",
  },

  workspace: {
    heading:
      "Local workspace profile",

    localOnly:
      "Local only",

    workspaceName:
      "Workspace name",

    workspaceId:
      "Workspace ID",

    loading:
      "Loading",

    saveProfile:
      "Save profile",

    removeProfileName:
      "Remove profile name",

    transferWorkspace:
      "Transfer this workspace",

    exportWorkspace:
      "Export workspace",

    selectWorkspaceFile:
      "Select workspace file",

    importWorkspace:
      "Import selected workspace",

    storedInBrowser:
      "This workspace is stored only in this browser.",

    profileSaved:
      "Local workspace profile saved.",

    bundleDownloaded:
      "Workspace bundle downloaded. It may contain saved job descriptions, so store it securely.",

    validBundle:
      "Valid workspace bundle selected. Review the warning before importing.",

    invalidBundle:
      "That file is not a valid Job Listing Reality Check workspace bundle.",

    unreadableBundle:
      "The selected file could not be read as JSON.",

    profileNameRemoved:
      "The local profile name was removed. Saved reports and research records were not deleted.",

    importedRecords:
      (count: number) =>
        "Imported " +
        count +
        " local workspace records. Reloading the page.",
  },

  common: {
    unknown:
      "Unknown",

    match:
      "Match",

    mismatch:
      "Mismatch",

    loading:
      "Loading",
  },
} as const;

export type UiCopy =
  typeof UI_COPY;
