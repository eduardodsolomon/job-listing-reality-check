"use client";

import {
  useState,
} from "react";

import BatchAnalyzer from "@/components/batch-analyzer";
import ListingAnalyzer from "@/components/listing-analyzer";
import TrendsDashboard from "@/components/trends-dashboard";

type WorkspaceMode =
  | "single"
  | "batch"
  | "trends";

function tabClasses(
  selected: boolean,
): string {
  return `min-h-14 rounded-2xl px-5 py-3 text-lg font-black ${
    selected
      ? "bg-violet-800 text-white"
      : "bg-slate-100 text-slate-950 hover:bg-slate-200"
  }`;
}

export default function JobRealityWorkspace() {
  const [mode, setMode] =
    useState<WorkspaceMode>(
      "single",
    );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Job Reality Check workspace"
        className="mb-8 grid gap-3 rounded-[2rem] border-2 border-slate-300 bg-white p-3 shadow-lg sm:grid-cols-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={
            mode === "single"
          }
          onClick={() => {
            setMode("single");
          }}
          className={tabClasses(
            mode === "single",
          )}
        >
          Check one job
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            mode === "batch"
          }
          onClick={() => {
            setMode("batch");
          }}
          className={tabClasses(
            mode === "batch",
          )}
        >
          Check up to 25 jobs
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            mode === "trends"
          }
          onClick={() => {
            setMode("trends");
          }}
          className={tabClasses(
            mode === "trends",
          )}
        >
          View aggregate trends
        </button>
      </div>

      {mode === "single" && (
        <ListingAnalyzer />
      )}

      {mode === "batch" && (
        <BatchAnalyzer />
      )}

      {mode === "trends" && (
        <TrendsDashboard />
      )}
    </div>
  );
}
