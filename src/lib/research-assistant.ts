import type {
  AnalysisInput,
  AnalysisResult,
  Signal,
} from "./analysis-types";

import type {
  ReconciliationResult,
} from "./reconciliation-types";

import type {
  VerificationResult,
} from "./verification-types";

export type ResearchPriority =
  | "high"
  | "medium"
  | "low";

export interface ResearchTask {
  id: string;
  title: string;
  reason: string;
  action: string;
  searchQuery: string | null;
  priority: ResearchPriority;
}

function uniqueTasks(
  tasks: ResearchTask[],
): ResearchTask[] {
  const seen =
    new Set<string>();

  return tasks.filter(
    (task) => {
      const key =
        task.title
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            " ",
          )
          .trim();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    },
  );
}

function probableTitle(
  description: string,
): string {
  const firstLine =
    description
      .split(/\r?\n/)
      .map(
        (line) => line.trim(),
      )
      .find(Boolean);

  if (
    !firstLine ||
    firstLine.length > 100
  ) {
    return "job";
  }

  return firstLine;
}

function signalText(
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

export function buildResearchTasks(
  form: AnalysisInput,
  analysis:
    AnalysisResult | null,
  verification:
    VerificationResult | null,
  reconciliation:
    ReconciliationResult | null,
): ResearchTask[] {
  if (!analysis) {
    return [];
  }

  const company =
    form.company.trim();

  const title =
    probableTitle(
      form.listingText,
    );

  const employerTerm =
    company || "employer";

  const tasks: ResearchTask[] = [];

  if (!company) {
    tasks.push({
      id: "identify-employer",
      title:
        "Identify every organization involved",
      reason:
        "The company or recruiting agency was not provided.",
      action:
        "Find the employer name and any staffing or recruiting agency attached to the listing, then add them to Company Name.",
      searchQuery: null,
      priority: "high",
    });
  }

  if (!form.listingUrl.trim()) {
    tasks.push({
      id: "find-official-listing",
      title:
        "Find the official job listing",
      reason:
        "An official URL is one of the strongest ways to confirm that the opening exists.",
      action:
        "Search the organization’s careers site for the same title, location, and job number.",
      searchQuery:
        `${employerTerm} careers "${title}"`,
      priority: "high",
    });
  } else if (!verification) {
    tasks.push({
      id: "check-url",
      title:
        "Run the URL check",
      reason:
        "A URL was provided but has not been checked.",
      action:
        "Click Check URL and review how the returned information changes Evidence quality.",
      searchQuery: null,
      priority: "high",
    });
  }

  if (
    verification &&
    !verification.officialSource
  ) {
    tasks.push({
      id: "official-source",
      title:
        "Locate an official organization source",
      reason:
        "The checked page did not establish an official employer source.",
      action:
        "Search the organization’s own careers website for the same opening.",
      searchQuery:
        `${employerTerm} official careers "${title}"`,
      priority: "high",
    });
  }

  if (
    verification?.listingActive ===
    false
  ) {
    tasks.push({
      id: "inactive-listing",
      title:
        "Confirm whether the opening is still active",
      reason:
        "The public job record did not appear active.",
      action:
        "Ask the employer whether applications are still being accepted and whether the role has been filled, paused, or canceled.",
      searchQuery:
        `${employerTerm} "${title}" active job`,
      priority: "high",
    });
  }

  reconciliation?.comparisons
    .filter(
      (comparison) =>
        comparison.status ===
        "mismatch",
    )
    .forEach(
      (comparison) => {
        tasks.push({
          id:
            `resolve-${comparison.field}`,
          title:
            `Resolve the ${comparison.label.toLowerCase()} mismatch`,
          reason:
            comparison.explanation,
          action:
            "Compare the recruiter message, submitted description, and official listing. Ask the recruiter to explain the difference in writing.",
          searchQuery:
            `${employerTerm} "${title}" ${comparison.label}`,
          priority: "high",
        });
      },
    );

  analysis.questions.forEach(
    (question, index) => {
      tasks.push({
        id: `question-${index}`,
        title: question,
        reason:
          "The submitted information did not answer this question.",
        action:
          "Check the official listing first. If it remains unanswered, ask the recruiter or hiring manager and paste the answer into the form.",
        searchQuery:
          company
            ? `${company} "${title}" ${question}`
            : null,
        priority: "medium",
      });
    },
  );

  analysis.signals.forEach(
    (signal) => {
      const text =
        signalText(signal);

      if (
        /gmail|yahoo|hotmail|outlook|personal email/.test(
          text,
        )
      ) {
        tasks.push({
          id: "verify-recruiter",
          title:
            "Verify the recruiter’s identity",
          reason:
            "The contact may be using a personal email address.",
          action:
            "Look for the recruiter in the employer or agency staff directory and contact the organization through a separately located phone number or email.",
          searchQuery:
            `${employerTerm} recruiter staff directory`,
          priority: "high",
        });
      }

      if (
        /pipeline|contingent|award|funding|evergreen|proposal/.test(
          text,
        )
      ) {
        tasks.push({
          id: "verify-funding",
          title:
            "Verify that the role is funded and approved",
          reason:
            "The listing may describe a pipeline, proposal, contingent, or future-funded role.",
          action:
            "Ask whether funding or the contract award is final and whether the employer is interviewing for an approved vacancy now.",
          searchQuery:
            `${employerTerm} "${title}" funding contract award`,
          priority: "high",
        });
      }

      if (
        /salary|pay range|compensation/.test(
          text,
        ) &&
        signal.type !== "positive"
      ) {
        tasks.push({
          id: "research-pay",
          title:
            "Find a reliable compensation range",
          reason:
            "The submitted information did not establish clear pay.",
          action:
            "Check the official posting, applicable public salary schedule, union agreement, or recruiter response.",
          searchQuery:
            `${employerTerm} "${title}" salary range`,
          priority: "medium",
        });
      }

      if (
        /requisition|job id|posting id|position number/.test(
          text,
        ) &&
        signal.type !== "positive"
      ) {
        tasks.push({
          id: "research-job-number",
          title:
            "Find the official job number",
          reason:
            "A job or requisition number was not established.",
          action:
            "Look for a requisition, posting, announcement, or position number on the official listing.",
          searchQuery:
            `${employerTerm} "${title}" requisition`,
          priority: "medium",
        });
      }
    },
  );

  tasks.push({
    id: "archive-evidence",
    title:
      "Save supporting evidence",
    reason:
      "Listings and recruiter messages can change or disappear.",
    action:
      "Save the official URL, posting date, job number, recruiter contact, and a copy or screenshot of the description before applying.",
    searchQuery: null,
    priority: "low",
  });

  const priorityOrder:
    Record<
      ResearchPriority,
      number
    > = {
      high: 0,
      medium: 1,
      low: 2,
    };

  return uniqueTasks(tasks)
    .sort(
      (left, right) =>
        priorityOrder[
          left.priority
        ] -
        priorityOrder[
          right.priority
        ],
    )
    .slice(0, 10);
}
