import { UI_COPY } from "../content/ui-copy";

import type {
  HealthBand,
  JobHealthMetric,
  JobHealthProfile,
} from "@/lib/presentation";

interface JobHealthDashboardProps {
  profile?: JobHealthProfile;
  jobHealthProfile?: JobHealthProfile;
  healthProfile?: JobHealthProfile;
  [key: string]: unknown;
}

function bandClasses(
  band: HealthBand,
): string {
  switch (band) {
    case "excellent":
    case "good":
      return "border-emerald-700 bg-emerald-50 text-emerald-950";

    case "fair":
      return "border-amber-700 bg-amber-50 text-amber-950";

    case "poor":
      return "border-orange-700 bg-orange-50 text-orange-950";

    case "critical":
      return "border-red-700 bg-red-50 text-red-950";

    default:
      return "border-slate-500 bg-slate-100 text-slate-950";
  }
}

function scoreDescriptor(
  metric: JobHealthMetric,
): string {
  if (metric.score === null) {
    return "Missing";
  }

  switch (metric.band) {
    case "excellent":
      return "Very strong";

    case "good":
      return "Strong";

    case "fair":
      return "Mixed";

    case "poor":
      return "Weak";

    case "critical":
      return "Critical";

    default:
      return "Not enough evidence";
  }
}

function metricExplanation(
  metric: JobHealthMetric,
): string {
  const extended =
    metric as JobHealthMetric & {
      summary?: string;
      description?: string;
      explanation?: string;
    };

  return (
    extended.summary ??
    extended.description ??
    extended.explanation ??
    "This score reflects the information currently available."
  );
}

function formulaForMetric(
  metric: JobHealthMetric,
): string {
  switch (metric.id) {
    case "listing-quality":
      return "100 minus ghost-job risk, plus applicable job-type and applicant-protection adjustments.";

    case "personal-safety":
      return "100 minus scam and phishing risk, plus applicable applicant-protection adjustments.";

    case "evidence-quality":
      return "The evidence-confidence score after available URL verification and reconciliation.";

    default:
      return "Calculated from the available scoring evidence.";
  }
}

function ScoreCircle({
  score,
  band,
}: {
  score: number | null;
  band: HealthBand;
}) {
  return (
    <span
      className={`inline-flex h-20 min-w-20 shrink-0 items-center justify-center rounded-full border-4 px-3 text-3xl font-black ${bandClasses(
        band,
      )}`}
    >
      {score ?? "?"}
    </span>
  );
}

export default function JobHealthDashboard({
  profile,
  jobHealthProfile,
  healthProfile,
}: JobHealthDashboardProps) {
  const resolvedProfile =
    profile ??
    jobHealthProfile ??
    healthProfile;

  if (!resolvedProfile) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border-2 border-slate-400 bg-white p-5 shadow-lg sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
            {UI_COPY.scores.overall}
          </h2>

          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-800">
            {resolvedProfile.overallLabel}
            {" — "}
            {resolvedProfile.overallScore}
            {" points based on the available Listing Quality, Personal Safety, and Evidence Quality scores."}
          </p>
        </div>

        <ScoreCircle
          score={
            resolvedProfile.overallScore
          }
          band={
            resolvedProfile.overallBand
          }
        />
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {resolvedProfile.metrics.map(
          (metric) => (
            <article
              key={metric.id}
              className={`rounded-3xl border-2 p-5 ${bandClasses(
                metric.band,
              )}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">
                    {metric.label}
                  </h3>

                  <p className="mt-1 text-base font-black">
                    {scoreDescriptor(
                      metric,
                    )}
                    {metric.score ===
                    null
                      ? " — score unavailable"
                      : ` — ${metric.score} points`}
                  </p>
                </div>

                <ScoreCircle
                  score={metric.score}
                  band={metric.band}
                />
              </div>

              <p className="mt-4 text-base leading-7">
                {metricExplanation(
                  metric,
                )}
              </p>
            </article>
          ),
        )}
      </div>

      <details className="mt-7 rounded-3xl border-2 border-slate-500 bg-slate-50 p-5">
        <summary className="cursor-pointer text-xl font-black text-slate-950">
          {UI_COPY.app.scoringReceipt}
        </summary>

        <div className="mt-5 space-y-4">
          {resolvedProfile.metrics.map(
            (metric) => (
              <div
                key={`receipt-${metric.id}`}
                className="rounded-2xl border-2 border-slate-300 bg-white p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-black text-slate-950">
                    {metric.label}
                  </p>

                  <p className="font-black text-slate-950">
                    {metric.score ===
                    null
                      ? "Not included"
                      : `${metric.score} points`}
                  </p>
                </div>

                <p className="mt-2 text-base leading-7 text-slate-800">
                  {formulaForMetric(
                    metric,
                  )}
                </p>
              </div>
            ),
          )}

          <div className="rounded-2xl border-2 border-violet-700 bg-violet-50 p-4 text-violet-950">
            <p className="font-black">
              Final Sanity Score: {resolvedProfile.overallScore} points
            </p>

            <p className="mt-2 text-base leading-7">
              The final score is the rounded-up average of every available metric. Missing metrics are not averaged. Every score is capped between 0 and 100.
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}
