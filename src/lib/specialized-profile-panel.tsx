import { UI_COPY } from "../content/ui-copy";

import type {
  SpecializedAnalysisResult,
  SpecializedFinding,
  SpecializedFindingKind,
} from "@/lib/specialized-analysis-types";

interface SpecializedProfilePanelProps {
  result:
    SpecializedAnalysisResult | null;
}

function signedPoints(
  value: number,
): string {
  return value > 0
    ? `+${value}`
    : String(value);
}

function findingClasses(
  kind: SpecializedFindingKind,
): string {
  switch (kind) {
    case "positive":
      return "border-emerald-600 bg-emerald-50";

    case "critical":
      return "border-red-700 bg-red-50";

    case "warning":
      return "border-amber-600 bg-amber-50";

    default:
      return "border-blue-500 bg-blue-50";
  }
}

function pointsClasses(
  finding: SpecializedFinding,
): string {
  if (finding.points > 0) {
    return "bg-emerald-700 text-white";
  }

  if (finding.points < 0) {
    return "bg-red-700 text-white";
  }

  return "bg-blue-700 text-white";
}

function targetLabel(
  finding: SpecializedFinding,
): string {
  return finding.target ===
    "listing-quality"
    ? UI_COPY.scores.listingQuality
    : UI_COPY.scores.personalSafety;
}

export default function SpecializedProfilePanel({
  result,
}: SpecializedProfilePanelProps) {
  if (!result) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border-2 border-indigo-500 bg-white p-5 shadow-lg sm:p-8">
      <p className="text-base font-black uppercase tracking-widest text-indigo-800">
        Extra job-type checks
      </p>

      <h2 className="mt-2 text-3xl font-black text-slate-950">
        {result.profileLabel}
      </h2>

      {result.subtypeLabel && (
        <p className="mt-2 text-lg font-bold text-slate-700">
          {result.subtypeLabel}
        </p>
      )}

      <p className="mt-4 text-lg leading-8 text-slate-800">
        {result.summary}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-slate-400 bg-slate-50 p-4">
          <p className="font-black text-slate-700">
            Listing quality adjustment
          </p>

          <p className="mt-2 text-4xl font-black text-slate-950">
            {signedPoints(
              result.adjustments
                .listingQuality,
            )}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-slate-400 bg-slate-50 p-4">
          <p className="font-black text-slate-700">
            Personal safety adjustment
          </p>

          <p className="mt-2 text-4xl font-black text-slate-950">
            {signedPoints(
              result.adjustments
                .personalSafety,
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {result.findings.map(
          (finding) => (
            <article
              key={finding.id}
              className={`rounded-3xl border-2 p-5 ${findingClasses(
                finding.kind,
              )}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    {finding.title}
                  </h3>

                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-700">
                    {targetLabel(
                      finding,
                    )}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-lg font-black ${pointsClasses(
                    finding,
                  )}`}
                >
                  {signedPoints(
                    finding.points,
                  )}
                </span>
              </div>

              <p className="mt-4 text-base leading-7 text-slate-800">
                {finding.explanation}
              </p>

              <div className="mt-4 rounded-2xl bg-white p-4 text-base font-bold leading-7 text-slate-900">
                <strong>
                  What to do:
                </strong>{" "}
                {finding.nextStep}
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}