import ListingAnalyzer from "@/components/listing-analyzer";
import { RULESET_VERSION } from "@/rules";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b-4 border-violet-700 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-base font-black uppercase tracking-[0.18em] text-violet-300">
            Simple job safety check
          </p>

          <h1 className="mt-3 max-w-5xl text-4xl font-black leading-tight sm:text-6xl">
            Job Listing Reality Check
          </h1>

          <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-200">
            Get one easy job-health score,
            then see exactly what helped or
            hurt it.
          </p>

          <div className="mt-7 rounded-3xl border-2 border-slate-600 bg-slate-900 p-5 text-lg font-bold leading-8">
            <span className="text-red-300">
              0 means poor.
            </span>{" "}
            <span className="text-emerald-300">
              100 means strong.
            </span>{" "}
            Red always means concern. Green
            always means stronger evidence.
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-8 rounded-3xl border-2 border-blue-500 bg-blue-50 p-5 text-lg leading-8 text-blue-950 sm:p-6">
          <p className="font-black">
            This is a screening tool
          </p>

          <p className="mt-2">
            It cannot prove that a job is
            legitimate or fraudulent. Do not
            send money, banking information,
            identity documents, or sensitive
            personal information based only
            on this report.
          </p>
        </div>

        <ListingAnalyzer />
      </div>

      <footer className="mt-14 border-t-2 border-slate-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-base leading-7 text-slate-700 sm:px-8">
          <p className="font-black text-slate-950">
            Job Listing Reality Check
          </p>

          <p className="mt-2">
            Interface version 6 · Ruleset{" "}
            {RULESET_VERSION}
          </p>

          <p className="mt-3 max-w-4xl">
            Educational screening information
            only. This is not legal advice or
            definitive employer verification.
          </p>
        </div>
      </footer>
    </main>
  );
}