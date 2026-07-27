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

interface ActionPlanProps {
  groups: NextStepGroup[];
  warningSignals: Signal[];
}

function groupClasses(
  id: NextStepGroup["id"],
): string {
  switch (id) {
    case "red-flags":
      return "border-red-700 bg-red-50";

    case "green-flags":
      return "border-emerald-600 bg-emerald-50";

    default:
      return "border-blue-600 bg-blue-50";
  }
}

function questionSymbol(
  id: NextStepGroup["id"],
): string {
  switch (id) {
    case "red-flags":
      return "?";

    case "green-flags":
      return "✓";

    default:
      return "•";
  }
}

export default function ActionPlan({
  groups,
  warningSignals,
}: ActionPlanProps) {
  const preparedGroups =
    prepareDecisionGroups(groups);

  const gatherGroup =
    preparedGroups.find(
      (group) =>
        group.id ===
        "gather-information",
    );

  const reviewGroups =
    preparedGroups.filter(
      (group) =>
        group.id !==
        "gather-information",
    );

  const thingsToCheck =
    buildThingsToCheckQuestions(
      warningSignals,
      gatherGroup?.items ?? [],
    );

  return (
    <section className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-8">
      <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
        What to consider next
      </h2>

      {gatherGroup && (
        <article
          className={`mt-6 rounded-3xl border-2 p-5 sm:p-6 ${groupClasses(
            gatherGroup.id,
          )}`}
        >
          <h3 className="text-2xl font-black text-slate-950">
            {gatherGroup.title}
          </h3>

          <p className="mt-2 text-base leading-7 text-slate-800">
            Find only the details that are
            still missing, add them to the
            form above, and check the job
            again.
          </p>

          {gatherGroup.items.length >
            0 && (
            <ul className="mt-4 space-y-3">
              {gatherGroup.items.map(
                (item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-2xl bg-white p-4 text-base font-bold leading-7 text-slate-900"
                  >
                    <span
                      aria-hidden="true"
                      className="font-black"
                    >
                      •
                    </span>

                    <span>{item}</span>
                  </li>
                ),
              )}
            </ul>
          )}

          {thingsToCheck.length >
            0 && (
            <section className="mt-6 rounded-3xl border-2 border-amber-600 bg-amber-50 p-5">
              <h4 className="text-2xl font-black text-amber-950">
                Things to check
              </h4>

              <p className="mt-2 text-base leading-7 text-amber-950">
                These questions come from
                details that were missing,
                unclear, or concerning.
              </p>

              <ul className="mt-4 space-y-3">
                {thingsToCheck.map(
                  (question) => (
                    <li
                      key={question}
                      className="flex gap-3 rounded-2xl bg-white p-4 text-base font-bold leading-7 text-slate-900"
                    >
                      <span
                        aria-hidden="true"
                        className="font-black text-amber-800"
                      >
                        ?
                      </span>

                      <span>
                        {question}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}
        </article>
      )}

      <div className="mt-6 space-y-5">
        {reviewGroups.map(
          (group) => (
            <article
              key={group.id}
              className={`rounded-3xl border-2 p-5 sm:p-6 ${groupClasses(
                group.id,
              )}`}
            >
              <h3 className="text-2xl font-black text-slate-950">
                {group.title}
              </h3>

              <p className="mt-2 text-base leading-7 text-slate-800">
                {group.summary}
              </p>

              <ul className="mt-4 space-y-3">
                {group.items.map(
                  (question) => (
                    <li
                      key={question}
                      className="flex gap-3 rounded-2xl bg-white p-4 text-base font-bold leading-7 text-slate-900"
                    >
                      <span
                        aria-hidden="true"
                        className="font-black"
                      >
                        {questionSymbol(
                          group.id,
                        )}
                      </span>

                      <span>
                        {question}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </article>
          ),
        )}
      </div>
    </section>
  );
}