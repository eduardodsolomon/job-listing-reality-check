import { UI_COPY } from "../content/ui-copy";

import PointBadge from "@/components/point-badge";

import type {
  Signal,
} from "@/lib/analysis-types";

import {
  buildThingsToCheckQuestions,
  prepareDecisionGroups,
} from "@/lib/decision-guidance";

import type {
  NextStepGroup,
} from "@/lib/presentation";

import type {
  ResearchTask,
} from "@/lib/research-assistant";

import {
  signalScoreImpact,
} from "@/lib/score-impact";

import type {
  SpecializedAnalysisResult,
  SpecializedFinding,
} from "@/lib/specialized-analysis-types";

interface ActionPlanProps {
  groups: NextStepGroup[];
  warningSignals: Signal[];
  specializedResult?:
    SpecializedAnalysisResult | null;
  researchTasks?: ResearchTask[];
}

interface NextStepItem {
  id: string;
  title: string;
  detail?: string;
  points: number | null;
  searchQuery?: string | null;
}

function normalizeMeaning(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(
      /https?:\/\/\S+/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(
      /\b(the|a|an|this|that|your|you|job|role|listing|posting)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function uniqueItems(
  items: NextStepItem[],
): NextStepItem[] {
  const seen =
    new Set<string>();

  return items.filter(
    (item) => {
      const key =
        normalizeMeaning(
          `${item.title} ${item.detail ?? ""}`,
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    },
  );
}

function groupById(
  groups: NextStepGroup[],
  id: NextStepGroup["id"],
): NextStepGroup | undefined {
  return groups.find(
    (group) =>
      group.id === id,
  );
}

function genericItems(
  values: string[],
  prefix: string,
): NextStepItem[] {
  return values.map(
    (value, index) => ({
      id: `${prefix}-${index}`,
      title: value,
      points: null,
    }),
  );
}

function signalItems(
  signals: Signal[],
): NextStepItem[] {
  return signals.map(
    (signal) => ({
      id: `signal-${signal.id}`,
      title: signal.title,
      detail:
        signal.explanation,
      points:
        signalScoreImpact(
          signal,
        ),
    }),
  );
}

function specializedItems(
  findings:
    SpecializedFinding[],
): NextStepItem[] {
  return findings.map(
    (finding) => ({
      id: `specialized-${finding.id}`,
      title: finding.title,
      detail: [
        finding.explanation,
        finding.nextStep,
      ]
        .filter(Boolean)
        .join(" "),
      points:
        Math.ceil(
          finding.points,
        ),
    }),
  );
}

function researchItems(
  tasks: ResearchTask[],
): NextStepItem[] {
  return tasks.map(
    (task) => ({
      id: `research-${task.id}`,
      title: task.title,
      detail: [
        task.reason,
        task.action,
      ]
        .filter(Boolean)
        .join(" "),
      points: null,
      searchQuery:
        task.searchQuery,
    }),
  );
}

function itemClasses(
  points: number | null,
): string {
  if (
    points !== null &&
    points < 0
  ) {
    return "border-red-300 bg-red-50";
  }

  if (
    points !== null &&
    points > 0
  ) {
    return "border-emerald-300 bg-emerald-50";
  }

  return "border-slate-300 bg-white";
}

function NextStepList({
  items,
}: {
  items: NextStepItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="mt-4 space-y-3">
      {items.map(
        (item) => (
          <li
            key={item.id}
            className={`flex gap-3 rounded-2xl border-2 p-4 ${itemClasses(
              item.points,
            )}`}
          >
            <PointBadge
              points={item.points}
            />

            <div className="min-w-0">
              <p className="text-base font-black leading-7 text-slate-950">
                {item.title}
              </p>

              {item.detail && (
                <p className="mt-1 text-base leading-7 text-slate-800">
                  {item.detail}
                </p>
              )}

              {item.searchQuery && (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    item.searchQuery,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center rounded-xl border-2 border-cyan-800 bg-white px-4 py-2 text-sm font-black text-cyan-950 underline decoration-2 underline-offset-4"
                >
                  Search this question
                  <span className="sr-only">
                    {" "}
                    in a new tab
                  </span>
                </a>
              )}
            </div>
          </li>
        ),
      )}
    </ul>
  );
}

export default function ActionPlan({
  groups,
  warningSignals,
  specializedResult,
  researchTasks = [],
}: ActionPlanProps) {
  const preparedGroups =
    prepareDecisionGroups(
      groups,
    );

  const gatherGroup =
    groupById(
      preparedGroups,
      "gather-information",
    );

  const redGroup =
    groupById(
      preparedGroups,
      "red-flags",
    );

  const greenGroup =
    groupById(
      preparedGroups,
      "green-flags",
    );

  const thingsToCheck =
    buildThingsToCheckQuestions(
      warningSignals,
      gatherGroup?.items ?? [],
    );

  const specializedFindings =
    specializedResult
      ?.findings ?? [];

  const negativeSpecialized =
    specializedFindings.filter(
      (finding) =>
        finding.points < 0,
    );

  const positiveSpecialized =
    specializedFindings.filter(
      (finding) =>
        finding.points >= 0,
    );

  const gatherItems =
    uniqueItems([
      ...genericItems(
        gatherGroup?.items ?? [],
        "gather",
      ),
      ...genericItems(
        thingsToCheck,
        "check",
      ),
      ...genericItems(
        specializedResult
          ?.questions ?? [],
        "specialized-question",
      ),
      ...researchItems(
        researchTasks,
      ),
    ]);

  const concernSignals =
    warningSignals.filter(
      (signal) =>
        signalScoreImpact(
          signal,
        ) < 0,
    );

  const supportingSignals =
    warningSignals.filter(
      (signal) =>
        signalScoreImpact(
          signal,
        ) >= 0,
    );

  const concernItems =
    uniqueItems([
      ...genericItems(
        redGroup?.items ?? [],
        "red-question",
      ),
      ...signalItems(
        concernSignals,
      ),
      ...specializedItems(
        negativeSpecialized,
      ),
    ]);

  const supportingItems =
    uniqueItems([
      ...genericItems(
        greenGroup?.items ?? [],
        "green-question",
      ),
      ...signalItems(
        supportingSignals,
      ),
      ...specializedItems(
        positiveSpecialized,
      ),
    ]);

  return (
    <section className="rounded-[2rem] border-2 border-slate-400 bg-white p-5 shadow-lg sm:p-8">
      <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
        {UI_COPY.app.nextSteps}
      </h2>

      <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-800">
        Use this combined list to fill
        information gaps, review concerns,
        and confirm the evidence that supports
        the opportunity. Repeated advice has
        been removed.
      </p>

      {gatherItems.length > 0 && (
        <section className="mt-6 rounded-3xl border-2 border-blue-700 bg-blue-50 p-5 sm:p-6">
          <h3 className="text-2xl font-black text-blue-950">
            Gather More Information
          </h3>

          <p className="mt-2 text-base leading-7 text-blue-950">
            Research or ask only the questions
            that remain unanswered.
          </p>

          <NextStepList
            items={gatherItems}
          />
        </section>
      )}

      {concernItems.length > 0 && (
        <section className="mt-5 rounded-3xl border-2 border-red-700 bg-red-50 p-5 sm:p-6">
          <h3 className="text-2xl font-black text-red-950">
            Review Concerns
          </h3>

          <p className="mt-2 text-base leading-7 text-red-950">
            Ask yourself whether each concern
            has been resolved before applying,
            paying, or sharing more information.
          </p>

          <NextStepList
            items={concernItems}
          />
        </section>
      )}

      {supportingItems.length > 0 && (
        <section className="mt-5 rounded-3xl border-2 border-emerald-700 bg-emerald-50 p-5 sm:p-6">
          <h3 className="text-2xl font-black text-emerald-950">
            Review Supporting Evidence
          </h3>

          <p className="mt-2 text-base leading-7 text-emerald-950">
            Confirm that these positive signals
            come from reliable and current
            sources.
          </p>

          <NextStepList
            items={supportingItems}
          />
        </section>
      )}
    </section>
  );
}
