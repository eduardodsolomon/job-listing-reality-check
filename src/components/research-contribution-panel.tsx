"use client";



import { UI_COPY } from "../content/ui-copy";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  AnalysisInput,
  AnalysisResult,
} from "@/lib/analysis-types";

import type {
  JobHealthProfile,
} from "@/lib/presentation";

import {
  buildContributionReceipt,
  buildResearchContribution,
  clearResearchContributions,
  deleteResearchContribution,
  loadResearchContributions,
  MAX_RESEARCH_CONTRIBUTIONS,
  saveResearchContribution,
  type ResearchContributionRecord,
} from "@/lib/research-contribution";

export interface ResearchContributionPanelProps {
  form: AnalysisInput;
  analysisResult:
    AnalysisResult | null;
  profile:
    JobHealthProfile | null;
  verificationAttempted: boolean;
  reconciliationAvailable: boolean;
}

function downloadJson(
  value: unknown,
  filename: string,
): void {
  const blob = new Blob(
    [
      JSON.stringify(
        value,
        null,
        2,
      ),
    ],
    {
      type:
        "application/json;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function shortId(
  value: string,
): string {
  return value.slice(0, 8);
}

export default function ResearchContributionPanel({
  form,
  analysisResult,
  profile,
  verificationAttempted,
  reconciliationAvailable,
}: ResearchContributionPanelProps) {
  const [consent, setConsent] =
    useState(false);

  const [queue, setQueue] =
    useState<
      ResearchContributionRecord[]
    >([]);

  const [status, setStatus] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    setQueue(
      loadResearchContributions(),
    );
  }, []);

  const preview = useMemo(
    () =>
      analysisResult
        ? buildResearchContribution({
            form,
            analysisResult,
            profile,
            verificationAttempted,
            reconciliationAvailable,
          })
        : null,
    [
      form,
      analysisResult,
      profile,
      verificationAttempted,
      reconciliationAvailable,
    ],
  );

  if (!analysisResult || !preview) {
    return null;
  }

  function queueContribution(): void {
    if (!preview) {
      return;
    }

    if (!consent) {
      setStatus(
        "Review the preview and check the consent box first.",
      );
      return;
    }

    try {
      if (!preview) {
        return;
      }

      const updated =
        saveResearchContribution(
          preview,
        );

      setQueue(updated);
      setStatus(
        "The anonymized record was saved locally. Nothing was sent anywhere.",
      );
      setConsent(false);
    } catch {
      setStatus(
        "The record could not be saved in this browser.",
      );
    }
  }

  function downloadReceipt(): void {
    if (!preview) {
      return;
    }

    if (!consent) {
      setStatus(
        "Check the consent box before downloading a consent receipt.",
      );
      return;
    }

    downloadJson(
      buildContributionReceipt(
        preview,
      ),
      "research-contribution-receipt.json",
    );

    setStatus(
      "The consent receipt was downloaded. Nothing was sent anywhere.",
    );
  }

  function removeContribution(
    contributionId: string,
  ): void {
    setQueue(
      deleteResearchContribution(
        contributionId,
      ),
    );

    setStatus(
      "The locally queued record was deleted.",
    );
  }

  function clearQueue(): void {
    if (!preview) {
      return;
    }

    clearResearchContributions();
    setQueue([]);
    setStatus(
      "All locally queued research records were deleted.",
    );
  }

  return (
    <section className="rounded-[2rem] border-2 border-slate-400 bg-white p-5 shadow-lg sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-800">
            {UI_COPY.sectionLabels.researchParticipation}
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Optional Research Contribution
          </h2>

          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-800">
            Review an anonymized record of this analysis. Participation is off by default, and this version does not transmit data to a server.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 px-4 py-3 text-base font-black text-emerald-950">
          {UI_COPY.workspace.localOnly}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5">
          <h3 className="text-xl font-black text-slate-950">
            Included
          </h3>

          <ul className="mt-3 space-y-2 text-base leading-7 text-slate-800">
            <li>• Job type and subtype</li>
            <li>• Numeric Sanity Score components</li>
            <li>• Generic rule identifiers</li>
            <li>• Whether optional fields and verification were used</li>
            <li>• Text lengths, but not the text itself</li>
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5">
          <h3 className="text-xl font-black text-red-950">
            Not included
          </h3>

          <ul className="mt-3 space-y-2 text-base leading-7 text-red-950">
            <li>• Company or recruiter names</li>
            <li>• Job descriptions or recruiter messages</li>
            <li>• Job URLs</li>
            <li>• Email addresses or phone numbers</li>
            <li>• Passwords, account details, or identity documents</li>
          </ul>
        </div>
      </div>

      <details className="mt-6 rounded-2xl border-2 border-slate-400 bg-slate-950 text-white">
        <summary className="cursor-pointer px-5 py-4 text-lg font-black">
          Preview the exact anonymized record
        </summary>

        <div className="border-t border-slate-600 p-5">
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black p-4 text-sm leading-6 text-emerald-200">
            {JSON.stringify(
              preview,
              null,
              2,
            )}
          </pre>
        </div>
      </details>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-violet-400 bg-violet-50 p-5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(
              event.target.checked,
            );
            setStatus(null);
          }}
          className="mt-1 h-6 w-6 shrink-0 accent-violet-800"
        />

        <span className="text-base font-bold leading-7 text-slate-950">
          I reviewed the preview and understand that saving or downloading this record is optional. I understand that Version 12 stores it only in this browser unless I choose to export the file myself.
        </span>
      </label>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={queueContribution}
          disabled={!consent}
          className="min-h-14 rounded-2xl border-2 border-violet-800 bg-violet-800 px-5 py-3 text-lg font-black text-white disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400"
        >
          Save anonymized record locally
        </button>

        <button
          type="button"
          onClick={downloadReceipt}
          disabled={!consent}
          className="min-h-14 rounded-2xl border-2 border-slate-700 bg-white px-5 py-3 text-lg font-black text-slate-950 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          Download consent receipt
        </button>
      </div>

      {status && (
        <p
          role="status"
          className="mt-4 rounded-2xl border-2 border-slate-400 bg-slate-100 p-4 text-base font-bold leading-7 text-slate-950"
        >
          {status}
        </p>
      )}

      <div className="mt-8 border-t-2 border-slate-300 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-950">
              Locally queued records
            </h3>

            <p className="mt-1 text-base text-slate-700">
              {queue.length} of {MAX_RESEARCH_CONTRIBUTIONS} records stored in this browser
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={queue.length === 0}
              onClick={() => {
                downloadJson(
                  queue,
                  "anonymized-research-records.json",
                );
              }}
              className="min-h-12 rounded-xl border-2 border-slate-700 bg-white px-4 py-2 font-black text-slate-950 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            >
              Export local queue
            </button>

            <button
              type="button"
              disabled={queue.length === 0}
              onClick={clearQueue}
              className="min-h-12 rounded-xl border-2 border-red-800 bg-red-800 px-4 py-2 font-black text-white disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400"
            >
              Delete local queue
            </button>
          </div>
        </div>

        {queue.length > 0 && (
          <ul className="mt-5 space-y-3">
            {queue.map(
              (record) => (
                <li
                  key={record.id}
                  className="flex flex-col gap-3 rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-slate-950">
                      Record {shortId(record.id)}
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {new Date(
                        record.createdAt,
                      ).toLocaleString()}
                      {" · "}
                      {UI_COPY.scores.overall} {record.sanityScore ?? "unavailable"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      removeContribution(
                        record.id,
                      );
                    }}
                    className="min-h-11 rounded-xl border-2 border-red-700 bg-white px-4 py-2 font-black text-red-900"
                  >
                    Delete record
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
