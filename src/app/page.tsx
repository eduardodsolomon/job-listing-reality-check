import ListingAnalyzer from "@/components/listing-analyzer";

import { RULESET_VERSION } from "@/rules";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-600">
            Job Listing Reality Check
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Check a job listing before you invest your time or information.
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-700">
            Paste a listing to identify ghost-job warning signs,
            recruitment scams, phishing risks, and missing information.
            Every result explains which signals affected the score.
          </p>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            This prototype performs text-based screening and on-demand URL
            verification. Greenhouse and Lever postings can be checked
            through their public job endpoints. Other websites receive a
            limited reachability and structured-data check. Results do not
            prove employer intent.
          </div>
        </header>

        <ListingAnalyzer />

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">
          Methodology version {RULESET_VERSION}. Results describe risk signals and verification gaps, not statistical probabilities.
        </footer>
      </div>
    </main>
  );
}