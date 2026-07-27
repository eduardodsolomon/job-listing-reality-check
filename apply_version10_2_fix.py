from __future__ import annotations

from pathlib import Path
import re
import shutil
import sys

ROOT = Path.cwd()
BACKUP_ROOT = ROOT / ".patch-backups" / "version10-2"

changed_files: list[str] = []
notes: list[str] = []


def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    print(
        "No original source file was deleted. "
        "Files changed before the error have backups in "
        ".patch-backups/version10-2.",
        file=sys.stderr,
    )
    raise SystemExit(1)


def require_project() -> None:
    required = [
        ROOT / "package.json",
        ROOT / "src" / "lib" / "applicant-protection.ts",
        ROOT / "src" / "lib" / "specialized-analysis.ts",
        ROOT / "src" / "lib" / "batch-analysis.ts",
        ROOT / "src" / "components" / "listing-analyzer.tsx",
    ]

    missing = [
        str(path.relative_to(ROOT))
        for path in required
        if not path.exists()
    ]

    if missing:
        fail(
            "Run this script from the job-listing-reality-check project root. "
            f"Missing: {', '.join(missing)}"
        )


def backup(path: Path) -> None:
    relative = path.relative_to(ROOT)
    destination = BACKUP_ROOT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)

    if not destination.exists():
        shutil.copy2(path, destination)


def write_if_changed(path: Path, original: str, updated: str) -> None:
    if updated == original:
        return

    backup(path)
    path.write_text(updated, encoding="utf-8")
    changed_files.append(str(path.relative_to(ROOT)))


def replace_once(
    text: str,
    old: str,
    new: str,
    description: str,
) -> str:
    if old in text:
        return text.replace(old, new, 1)

    if new in text:
        notes.append(f"Already fixed: {description}")
        return text

    fail(f"Could not find the expected text for: {description}")
    return text


def patch_placeholders() -> None:
    path = ROOT / "src" / "components" / "listing-analyzer.tsx"
    original = path.read_text(encoding="utf-8")
    updated = original

    replacements = [
        (
            'placeholder="Optional — Example: Example Health; recruiting agency: Talent Partners"',
            'placeholder="Optional — Acme Health; recruiting agency: Talent Partners"',
            "Company Name placeholder",
        ),
        (
            'placeholder="Required — Paste as much information about the listing as you can find. Example: job title, company, pay, location, schedule, duties, qualifications, benefits, job number, and application instructions."',
            'placeholder="Required — Paste as much information about the listing as you can find. Include the job title, company, pay, location, schedule, duties, qualifications, benefits, job number, and application instructions."',
            "Job Description placeholder",
        ),
        (
            'placeholder="Optional — Example: recruiter email, text, LinkedIn message, agency name, contact details, interview details, or follow-up answers."',
            'placeholder="Optional — Paste the recruiter email, text, LinkedIn message, agency name, contact details, interview details, or follow-up answers."',
            "Recruiter Message placeholder",
        ),
        (
            'placeholder="Optional, but highly recommended — Example: https://organization.org/careers/job-123"',
            'placeholder="Optional, but highly recommended — https://organization.org/careers/job-123"',
            "Job URL placeholder",
        ),
    ]

    for old, new, description in replacements:
        updated = replace_once(updated, old, new, description)

    remaining = re.findall(
        r'placeholder="[^"]*\bExample\b[^"]*"',
        updated,
    )

    if remaining:
        fail(
            "The word 'Example' remains in one or more placeholders: "
            + " | ".join(remaining)
        )

    write_if_changed(path, original, updated)


def patch_batch_limit() -> None:
    path = ROOT / "src" / "lib" / "batch-analysis.ts"
    original = path.read_text(encoding="utf-8")
    updated, count = re.subn(
        r"export const MAX_BATCH_JOBS\s*=\s*50\s*;",
        "export const MAX_BATCH_JOBS = 25;",
        original,
        count=1,
    )

    if count == 0 and not re.search(
        r"export const MAX_BATCH_JOBS\s*=\s*25\s*;",
        original,
    ):
        fail("Could not find MAX_BATCH_JOBS in src/lib/batch-analysis.ts")

    write_if_changed(path, original, updated)

    workspace = ROOT / "src" / "components" / "job-reality-workspace.tsx"

    if workspace.exists():
        original = workspace.read_text(encoding="utf-8")
        updated = original.replace(
            "Check up to 50 jobs",
            "Check up to 25 jobs",
        )
        write_if_changed(workspace, original, updated)

    test_path = ROOT / "src" / "lib" / "batch-analysis.test.ts"

    if test_path.exists():
        original = test_path.read_text(encoding="utf-8")
        updated = (
            original
            .replace("limits the batch to 50 jobs", "limits the batch to 25 jobs")
            .replace("{ length: 55 }", "{ length: 30 }")
        )
        write_if_changed(test_path, original, updated)


def patch_sensitive_request_detection() -> None:
    path = ROOT / "src" / "lib" / "applicant-protection.ts"
    original = path.read_text(encoding="utf-8")
    updated = original

    old_verbs = (
        r"(?:send|share|provide|submit|give|tell|reply with|upload|enter|confirm)"
    )
    new_verbs = (
        r"(?:send|share|provide|submit|give|tell|reply with|upload|enter|confirm|complete|fill out|fill in)"
    )

    updated = replace_once(
        updated,
        old_verbs,
        new_verbs,
        "sensitive-information request verbs",
    )

    old_financial = (
        r"/social security number|social security|ssn|bank account|routing number|credit card|debit card|taxpayer identification number|tax id/"
    )
    new_financial = (
        r"/social security number|social security|ssn|bank account|routing number|credit card|debit card|direct[- ]deposit information|direct[- ]deposit form|direct deposit|taxpayer identification number|tax id/"
    )

    updated = replace_once(
        updated,
        old_financial,
        new_financial,
        "direct-deposit detection",
    )

    write_if_changed(path, original, updated)


def patch_negated_supervision() -> None:
    path = ROOT / "src" / "lib" / "specialized-analysis.ts"
    original = path.read_text(encoding="utf-8")

    if "const supervisionMentioned = has(" in original:
        notes.append("Already fixed: negated internship supervision")
        return

    old = '''  const supervisionFound = has(
    text,
    /supervisor|supervision|mentor|mentorship|learning plan|training plan|professional development/i,
  );'''

    new = r'''  const supervisionMentioned = has(
    text,
    /supervisor|supervision|mentor|mentorship|learning plan|training plan|professional development/i,
  );

  const supervisionDenied = has(
    text,
    /(?:no|without)\s+(?:regular\s+)?(?:supervision|supervisor|mentor|mentorship|training|professional development)|(?:supervision|supervisor|mentor|mentorship|training|professional development)[^.!?\n]{0,60}(?:(?:is|are|was|were)\s+)?(?:not provided|not included|not available|unavailable|none)/i,
  );

  const supervisionFound =
    supervisionMentioned &&
    !supervisionDenied;'''

    updated = replace_once(
        original,
        old,
        new,
        "negated internship-supervision detection",
    )

    write_if_changed(path, original, updated)


def clean_generated_artifacts() -> None:
    docs = ROOT / "docs"
    docs.mkdir(exist_ok=True)

    old_examples = ROOT / "VERSION10_TEST_EXAMPLES.md"
    new_examples = docs / "TEST_EXAMPLES.md"

    if old_examples.exists():
        if new_examples.exists():
            old_examples.unlink()
        else:
            old_examples.replace(new_examples)
        changed_files.append("docs/TEST_EXAMPLES.md")

    generated = [
        ROOT / "README.txt",
        ROOT / "apply_version10.py",
        ROOT / "apply_version10_1.py",
        ROOT / "VERSION10_README.txt",
        ROOT / "job-listing-reality-check-version10-upgrade.zip",
        ROOT / "job-listing-reality-check-version10-1-patch.zip",
        ROOT / ".project-backups",
    ]

    removed: list[str] = []

    for path in generated:
        if not path.exists():
            continue

        relative = str(path.relative_to(ROOT))

        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()

        removed.append(relative)

    if removed:
        notes.append(
            "Removed generated artifacts: "
            + ", ".join(removed)
        )


def update_gitignore() -> None:
    path = ROOT / ".gitignore"
    original = (
        path.read_text(encoding="utf-8")
        if path.exists()
        else ""
    )

    entries = [
        ".project-backups/",
        ".patch-backups/",
        "*.v9-backup",
        "*.v10-backup",
        "apply_version*.py",
        "job-listing-reality-check-version*.zip",
        "__pycache__/",
        "*.pyc",
        "*.tsbuildinfo",
    ]

    existing_lines = set(original.splitlines())
    missing = [
        entry
        for entry in entries
        if entry not in existing_lines
    ]

    if not missing:
        return

    updated = (
        original.rstrip()
        + "\n\n# Local patch and backup artifacts\n"
        + "\n".join(missing)
        + "\n"
    )

    if path.exists():
        backup(path)

    path.write_text(updated, encoding="utf-8")
    changed_files.append(".gitignore")


def main() -> None:
    require_project()
    patch_placeholders()
    patch_batch_limit()
    patch_sensitive_request_detection()
    patch_negated_supervision()
    clean_generated_artifacts()
    update_gitignore()

    print("\nPATCH COMPLETED")

    if changed_files:
        print("\nChanged files:")
        for filename in changed_files:
            print(f"  - {filename}")
    else:
        print("\nNo file changes were necessary.")

    if notes:
        print("\nNotes:")
        for note in notes:
            print(f"  - {note}")

    print(
        "\nBackups of edited files are in "
        ".patch-backups/version10-2."
    )


if __name__ == "__main__":
    main()
