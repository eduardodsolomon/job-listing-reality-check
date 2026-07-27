# Job Listing Reality Check

A privacy-conscious public-beta tool that helps job seekers assess job advertisements, recruiter messages, ghost-job indicators, scam risks, applicant-protection concerns, and the strength of the available evidence.

[Open the live public beta](https://job-listing-reality-check.vercel.app/) · [Report a bug or request a feature](https://github.com/eduardodsolomon/job-listing-reality-check/issues) · [Share feedback or ask a question](https://github.com/eduardodsolomon/job-listing-reality-check/discussions)

> **Public beta:** Job Listing Reality Check provides structured decision support. It cannot prove that a listing is active, funded, legitimate, safe, discriminatory, or appropriate. Always verify opportunities independently through official employer websites and trusted contact information.

## Why this project exists

Job seekers are often asked to evaluate incomplete, recycled, misleading, or potentially dangerous listings while navigating long application processes and inconsistent employer communication.

Job Listing Reality Check organizes those concerns into an explainable review. Instead of giving a single unexplained verdict, it shows:

- what evidence was detected;
- how each finding affected the scores;
- what information is missing;
- what may require caution;
- what the applicant can verify next.

The goal is not to tell someone whether they must apply. The goal is to help them make a more informed decision.

## Current release

**Version 15 public beta**

Version 15 combines the core analyzer with privacy-conscious research governance, local aggregate trends, workspace portability, accessible scoring explanations, and applicant-protection guidance.

## Features

### Individual analysis

Paste a job description and optionally add:

- company name;
- type of job;
- recruiter message;
- job URL;
- other context available to the applicant.

The analyzer reviews the material for low-intent or ghost-job indicators, scam risks, applicant-protection concerns, missing evidence, and positive signals.

### Explainable scores

| Score | Meaning |
| --- | --- |
| **Listing Quality** | Positive-facing score derived from ghost-job and low-intent risk. |
| **Personal Safety** | Positive-facing score derived from scam and applicant-protection risk. |
| **Evidence Quality** | Measures how much concrete, verifiable information supports the analysis. |
| **Sanity Score** | Rounded average of the available positive-facing scores. Missing metrics are excluded. |

Finding badges show how individual signals affect the analysis. The **Final Scoring Receipt** explains the calculation and rounding.

### Applicant-protection checks

The app looks for potentially dangerous or inappropriate requests, including:

- passwords or multifactor-authentication codes;
- early banking or direct-deposit information;
- Social Security or identity information;
- checks, fees, purchases, or money transfers;
- photographs and potentially discriminatory screening questions;
- suspicious urgency, communication, or hiring-process patterns.

A warning does not prove misconduct. It identifies something the applicant should pause and verify.

### Specialized job-type checks

Additional checks are available for:

- standard employment;
- contract or 1099 work;
- government jobs;
- nonprofit roles;
- internships;
- fellowships;
- volunteer roles;
- uncertain job types.

### Job URL verification

When a URL is provided, the app can attempt to verify whether the opportunity appears on a supported applicant-tracking system or public careers page.

URL verification is supporting evidence, not a guarantee. A legitimate job can be temporarily unavailable, and a fraudulent page can imitate a real employer.

### Batch analysis

Analyze CSV or TSV data for up to **25 jobs at a time**.

Batch results include:

- score summaries;
- detected findings;
- specialized job-type findings;
- filtering and search;
- local report saving;
- aggregate review.

The application deliberately prevents a twenty-sixth result from being analyzed in the same batch.

### Local reports and workspace portability

Users can save reports in their browser and export a workspace file for transfer or backup.

A workspace export may contain:

- pasted job descriptions;
- recruiter messages;
- URLs;
- saved reports;
- local research records;
- workspace settings.

Treat exported workspace files as private job-search information.

### Optional local research contribution

Users may create a structured, anonymized research record after reviewing exactly what it contains and providing explicit consent.

In the current public beta:

- participation is optional;
- the consent control starts unchecked;
- research records remain local unless the user exports them;
- raw job descriptions and recruiter messages are excluded from the structured research record;
- local records can be reviewed and deleted.

### Aggregate trends and governance

The local trends dashboard summarizes anonymized research records without creating public employer rankings.

Version 15 adds governance-oriented checks such as:

- schema-version review;
- duplicate-record detection;
- malformed-record detection;
- consent-state review;
- dataset-quality summaries;
- privacy-threshold suppression;
- controlled aggregate exports.

## How to use the app

1. Paste the complete job description.
2. Add any available context, such as the company, job type, recruiter message, or URL.
3. Select **Check this job**.
4. Read the Sanity Score and each component score.
5. Open the Final Scoring Receipt.
6. Review Immediate Danger Warnings before taking further action.
7. Use Next Steps to gather missing information and independently verify concerns.
8. Save or export a report only when appropriate.

Do not paste passwords, authentication codes, bank-account numbers, full Social Security numbers, or other secrets into the app.

## Interpreting results responsibly

### A low score does not prove fraud

A listing may score poorly because it is vague, incomplete, badly written, old, or difficult to verify. Those are reasons to investigate—not automatic proof of a scam.

### A high score does not guarantee a good outcome

A detailed and verifiable listing can still result in employer silence, a cancelled position, an unfair hiring process, or an unsafe workplace.

### Scores are decision support

The analyzer uses transparent rules and evidence categories. It does not replace:

- direct confirmation from the employer;
- professional judgment;
- legal advice;
- law-enforcement or consumer-protection assistance;
- emergency support.

## Privacy

The current public beta uses browser storage for saved reports, optional research records, aggregate trends, and workspace-profile information.

Important precautions:

- Browser storage is specific to the browser and device.
- Clearing browser data may delete saved information.
- Other people with access to the same browser profile may be able to view local records.
- Workspace exports may contain raw job-search information.
- Public GitHub issues and discussions are visible to others.
- Never include private applicant information in a public bug report.

The project does not currently provide an online user account or automatic cloud synchronization.

## Accessibility

The interface is being developed with attention to:

- keyboard navigation;
- visible focus states;
- semantic labels and headings;
- high contrast;
- plain-language explanations;
- consistent spacing;
- screen-reader status messages;
- score explanations that do not depend on color alone.

Accessibility feedback is especially welcome.

## Local development

### Requirements

- Node.js
- npm
- Git

### Install

```bash
git clone https://github.com/eduardodsolomon/job-listing-reality-check.git
cd job-listing-reality-check
npm install
```

### Start the development server

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Validate changes

Run each command separately:

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest
- Vercel

## Feedback and support

### Bugs and feature requests

Use [GitHub Issues](https://github.com/eduardodsolomon/job-listing-reality-check/issues) for:

- reproducible bugs;
- accessibility defects;
- incorrect or confusing findings;
- false positives or false negatives;
- feature requests;
- documentation problems.

Before posting, remove company-confidential information and personal applicant data.

### Questions and general feedback

Use [GitHub Discussions](https://github.com/eduardodsolomon/job-listing-reality-check/discussions) for:

- general feedback;
- questions about the project;
- ideas that are not yet defined as features;
- user experiences;
- research or methodology conversations.

### Security or privacy vulnerabilities

Do not report a security vulnerability in a public issue.

Use GitHub's private **Report a vulnerability** option under the repository's Security area when that feature is enabled.

## Contributing

Contributions are welcome during the public beta.

Before opening a pull request:

1. Search existing issues and discussions.
2. Open or comment on an issue describing the change.
3. Create a focused branch.
4. Add or update tests.
5. Run the typecheck, test suite, and production build.
6. Avoid using real applicant data in fixtures or screenshots.
7. Preserve accessibility and privacy safeguards.
8. Explain any scoring-rule change and its intended impact.

## Project principles

- **Explain findings instead of hiding them behind a verdict.**
- **Treat uncertainty as information.**
- **Protect applicants from unnecessary data exposure.**
- **Separate ghost-job risk from scam risk.**
- **Do not present scores as proof.**
- **Make research participation optional and reviewable.**
- **Prefer accessible, plain-language guidance.**

## Roadmap

Near-term priorities include:

- improving public feedback workflows;
- expanding regression tests and accessible examples;
- documenting scoring rules and known limitations;
- evaluating false positives and false negatives;
- strengthening privacy and research-governance documentation;
- improving release and deployment reliability.

## Acknowledgment

Job Listing Reality Check was developed as an independent public-interest technology project focused on applicant safety, transparency, and critical thinking during the hiring process.
