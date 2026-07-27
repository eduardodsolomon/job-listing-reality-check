"use client";

import {
  useState,
} from "react";

import BatchAnalyzer from "@/components/batch-analyzer";
import ListingAnalyzer from "@/components/listing-analyzer";

type WorkspaceMode =
  | "single"
  | "batch";

export default function JobRealityWorkspace() {
  const [mode, setMode] =
    useState<WorkspaceMode>(
      "single",
    );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Analysis mode"
        className="mb-8 grid gap-3 rounded-[2rem] border-2 border-slate-300 bg-white p-3 shadow-lg sm:grid-cols-2"
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
          className={`min-h-14 rounded-2xl px-5 py-3 text-lg font-black ${
            mode === "single"
              ? "bg-violet-800 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
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
          className={`min-h-14 rounded-2xl px-5 py-3 text-lg font-black ${
            mode === "batch"
              ? "bg-violet-800 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
        >
          Check up to 50 jobs
        </button>
      </div>

      {mode === "single" ? (
        <ListingAnalyzer />
      ) : (
        <BatchAnalyzer />
      )}
    </div>
  );
}
