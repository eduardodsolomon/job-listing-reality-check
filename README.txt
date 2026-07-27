VERSION 10.1 PATCH

From the job-listing-reality-check project root:

1. Extract this ZIP.
2. Run:
   python apply_version10_1.py
3. Validate:
   npm run typecheck && npm test && rm -rf .next && npm run dev

This patch:
- preserves/restores a high-contrast black header
- removes the Related resources heading while keeping the links
- moves Type of Job above Recruiter message
- moves optional/required guidance into controls
- adds a red required asterisk to Job Description
- updates saved-report helper text
- removes known generated backup/install artifacts
- audits exact duplicate source files without deleting source code
