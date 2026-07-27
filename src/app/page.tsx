import ListingAnalyzer from "@/components/listing-analyzer";

const relatedResources = [
  {
    label: "GhostJobs detector",
    href: "https://ghostjobs.app/",
  },
  {
    label: "Ghost Jobs reports",
    href: "https://ghostjobs.net/",
  },
  {
    label: "Ghost-job law tracker",
    href: "https://ghostjobtracking.com/",
  },
  {
    label:
      "AI hiring credit-report lawsuit",
    href:
      "https://www.jdsupra.com/legalnews/ai-hiring-tools-and-consumer-reports-4231005/",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border-2 border-slate-300 bg-white p-6 shadow-lg sm:p-10">
          <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
            Job Listing Reality Check
          </h1>

          <p className="mt-5 max-w-4xl text-xl font-bold leading-9 text-slate-800 sm:text-2xl">
            Post your job, get a score to
            rate how realistic it is. Based
            on modern trends.
          </p>

          <nav
            aria-label="Related job-listing resources"
            className="mt-6"
          >
            <p className="text-sm font-black uppercase tracking-widest text-violet-800">
              Related resources
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {relatedResources.map(
                (resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-violet-600 bg-violet-50 px-4 py-2 text-sm font-black text-violet-950 underline decoration-2 underline-offset-4 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
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

          <p className="mt-7 rounded-2xl border-2 border-amber-600 bg-amber-50 p-5 text-base font-black leading-7 text-amber-950 sm:text-lg">
            Note: This is an additional
            screening tool. Never send money
            or sensitive information based
            solely on this report.
          </p>
        </header>

        <div className="mt-8">
          <ListingAnalyzer />
        </div>
      </div>
    </main>
  );
}