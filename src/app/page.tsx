import { UI_COPY } from "../content/ui-copy";

import JobRealityWorkspace from "@/components/job-reality-workspace";

const relatedResources = [
  {
    label: "GhostJobs detector",
    href: "https://ghostjobs.app/",
  },
  {
    label: "GhostJobs reports",
    href: "https://ghostjobs.net/",
  },
  {
    label: "GhostJob law tracker",
    href: "https://ghostjobtracking.com/",
  },
  {
    label: "AI resume filtering lawsuit",
    href: "https://www.jdsupra.com/legalnews/ai-hiring-tools-and-consumer-reports-4231005/",
  },
 {
    label: "Jobs who ghost YOU",
    href: "https://didtheyghostyou.com/",
  },
  
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border-2 border-slate-800 bg-slate-950 p-6 text-white shadow-lg sm:p-10">
          <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
            {UI_COPY.app.name}
          </h1>

<p className="mt-5 max-w-4xl text-xl font-bold leading-9 text-slate-100 sm:text-2xl">
            Post your job, get a score to
            rate how realistic it is. 
            
            Based on modern trends.
          </p>

          <nav
            aria-label="Related job-listing resources"
            className="mt-6"
          >

            <div className="mt-3 flex flex-wrap gap-3">
              {relatedResources.map(
                (resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-white bg-slate-900 px-4 py-2 text-sm font-black text-white underline decoration-2 underline-offset-4 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                  >
                    {resource.label}
                    <span className="sr-only">
                      {" "}
                      — opens in a new tab
                    </span>
                  </a>
                ),
              )}
            </div>
          </nav>

          <p className="mt-7 rounded-2xl border-2 border-amber-300 bg-amber-100 p-5 text-base font-black leading-7 text-slate-950 sm:text-lg">
            Note: This is an additional
            screening tool. Never send money
            or sensitive information based
            solely on this report.
          </p>
        </header>

        <div className="mt-8">
          <JobRealityWorkspace />
        </div>
      </div>
    </main>
  );
}