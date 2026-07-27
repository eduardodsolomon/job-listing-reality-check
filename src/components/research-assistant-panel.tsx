"use client";

import {
  useState,
} from "react";

import type {
  ResearchPriority,
  ResearchTask,
} from "@/lib/research-assistant";

interface ResearchAssistantPanelProps {
  tasks: ResearchTask[];
}

function priorityClasses(
  priority: ResearchPriority,
): string {
  switch (priority) {
    case "high":
      return "border-red-600 bg-red-50 text-red-950";

    case "medium":
      return "border-amber-600 bg-amber-50 text-amber-950";

    default:
      return "border-blue-500 bg-blue-50 text-blue-950";
  }
}

function priorityLabel(
  priority: ResearchPriority,
): string {
  switch (priority) {
    case "high":
      return "Check first";

    case "medium":
      return "Helpful";

    default:
      return "Good practice";
  }
}

export default function ResearchAssistantPanel({
  tasks,
}: ResearchAssistantPanelProps) {
  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  if (tasks.length === 0) {
    return null;
  }

  async function copyQuery(
    task: ResearchTask,
  ): Promise<void> {
    if (!task.searchQuery) {
      return;
    }

    await navigator.clipboard.writeText(
      task.searchQuery,
    );

    setCopiedId(task.id);

    window.setTimeout(
      () => {
        setCopiedId(
          (current) =>
            current === task.id
              ? null
              : current,
        );
      },
      1500,
    );
  }

  return (
    <section className="rounded-[2rem] border-2 border-cyan-700 bg-white p-5 shadow-lg sm:p-8">
      <p className="text-sm font-black uppercase tracking-widest text-cyan-800">
        Research assistant
      </p>

      <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
        Verify the opportunity
      </h2>

      <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-800">
        These tasks focus your research on
        the information most likely to change
        your decision. Search queries contain
        only the company and job information
        you entered.
      </p>

      <div className="mt-6 space-y-4">
        {tasks.map(
          (task) => (
            <article
              key={task.id}
              className={`rounded-3xl border-2 p-5 ${priorityClasses(
                task.priority,
              )}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded-full border-2 border-current bg-white px-3 py-1 text-xs font-black uppercase tracking-wide">
                    {priorityLabel(
                      task.priority,
                    )}
                  </span>

                  <h3 className="mt-3 text-xl font-black">
                    {task.title}
                  </h3>
                </div>
              </div>

              <p className="mt-3 text-base leading-7">
                <strong>
                  Why:
                </strong>{" "}
                {task.reason}
              </p>

              <p className="mt-2 text-base leading-7">
                <strong>
                  Action:
                </strong>{" "}
                {task.action}
              </p>

              {task.searchQuery && (
                <div className="mt-4 rounded-2xl border-2 border-white bg-white p-4 text-slate-950">
                  <p className="break-words font-mono text-sm">
                    {task.searchQuery}
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        void copyQuery(
                          task,
                        );
                      }}
                      className="min-h-11 rounded-xl border-2 border-cyan-700 px-4 py-2 text-sm font-black text-cyan-900"
                    >
                      {copiedId ===
                      task.id
                        ? "Copied"
                        : "Copy search"}
                    </button>

                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        task.searchQuery,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-500 px-4 py-2 text-sm font-black text-slate-900"
                    >
                      Open search
                      <span className="sr-only">
                        {" "}
                        in a new tab
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </article>
          ),
        )}
      </div>
    </section>
  );
}
