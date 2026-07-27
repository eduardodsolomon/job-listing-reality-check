from pathlib import Path
import hashlib
import re
import shutil

ROOT = Path.cwd()

if not (ROOT / "package.json").exists():
    raise SystemExit(
        "Run this script from the job-listing-reality-check project root."
    )

BACKUP_ROOT = ROOT / ".project-backups" / "version10-1"
BACKUP_ROOT.mkdir(parents=True, exist_ok=True)

def backup(relative: str) -> Path:
    source = ROOT / relative
    destination = BACKUP_ROOT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)

    if source.exists() and not destination.exists():
        shutil.copy2(source, destination)

    return source

def replace_once(
    text: str,
    old: str,
    new: str,
    description: str,
) -> str:
    if new in text:
        return text

    if old not in text:
        raise SystemExit(
            f"Could not find {description}. No changes were written to that file."
        )

    return text.replace(old, new, 1)

def patch_page() -> None:
    path = backup("src/app/page.tsx")
    text = path.read_text(encoding="utf-8")

    # Preserve a high-contrast black header.
    text = re.sub(
        r'className="rounded-\[2rem\] border-2 border-[^"]+ bg-[^"]+ p-6 shadow-lg sm:p-10"',
        'className="rounded-[2rem] border-2 border-slate-800 bg-slate-950 p-6 text-white shadow-lg sm:p-10"',
        text,
        count=1,
    )

    text = text.replace(
        'className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl"',
        'className="text-4xl font-black leading-tight text-white sm:text-6xl"',
    )

    text = text.replace(
        'className="mt-5 max-w-4xl text-xl font-bold leading-9 text-slate-800 sm:text-2xl"',
        'className="mt-5 max-w-4xl text-xl font-bold leading-9 text-slate-100 sm:text-2xl"',
    )

    # Remove the redundant Related resources heading while keeping the links.
    text = re.sub(
        r'\s*<p className="text-sm font-black uppercase tracking-widest text-violet-800">\s*'
        r'Related resources\s*</p>',
        "",
        text,
        count=1,
    )

    # Keep links readable against the black header.
    text = text.replace(
        'className="rounded-full border-2 border-violet-600 bg-violet-50 px-4 py-2 text-sm font-black text-violet-950 underline decoration-2 underline-offset-4 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"',
        'className="rounded-full border-2 border-white bg-slate-900 px-4 py-2 text-sm font-black text-white underline decoration-2 underline-offset-4 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"',
    )

    text = text.replace(
        'className="mt-7 rounded-2xl border-2 border-amber-600 bg-amber-50 p-5 text-base font-black leading-7 text-amber-950 sm:text-lg"',
        'className="mt-7 rounded-2xl border-2 border-amber-300 bg-amber-100 p-5 text-base font-black leading-7 text-slate-950 sm:text-lg"',
    )

    path.write_text(text, encoding="utf-8")
    print("Updated src/app/page.tsx")

def strip_help_spans(
    text: str,
    label_pattern: str,
    replacement_label: str,
) -> str:
    pattern = re.compile(
        rf'<span className="text-lg font-black text-slate-950">\s*'
        rf'{label_pattern}\s*</span>'
        rf'(?:\s*<span className="mt-1 block text-base font-black[^"]*">[\s\S]*?</span>)?'
        rf'(?:\s*<span className="mt-1 block text-base text-slate-700">[\s\S]*?</span>)?',
        re.MULTILINE,
    )

    replacement = (
        '<span className="text-lg font-black text-slate-950">'
        + replacement_label
        + "</span>"
    )

    updated, count = pattern.subn(
        replacement,
        text,
        count=1,
    )

    if count != 1:
        raise SystemExit(
            f"Could not update the field labeled {label_pattern}."
        )

    return updated

def patch_listing_analyzer() -> None:
    path = backup("src/components/listing-analyzer.tsx")
    text = path.read_text(encoding="utf-8")

    # Move the existing Type of Job block from the top area into the
    # right-hand column immediately above Recruiter message.
    type_block_pattern = re.compile(
        r'\n        (?P<block><div className="mt-7 grid gap-5 lg:grid-cols-2">[\s\S]*?</div>)'
        r'\n\n        (?=<label className="mt-6 block">\s*'
        r'<span className="text-lg font-black text-slate-950">\s*Company Name)',
        re.MULTILINE,
    )

    match = type_block_pattern.search(text)

    if match:
        type_block = match.group("block")
        text = (
            text[:match.start()]
            + "\n"
            + text[match.end():]
        )

        indented_block = "\n".join(
            "    " + line
            for line in type_block.splitlines()
        )

        recruiter_marker = re.compile(
            r'(\n          <div>\s*)'
            r'(?=<label className="block">\s*'
            r'<span className="text-lg font-black text-slate-950">\s*Recruiter message)',
            re.MULTILINE,
        )

        text, count = recruiter_marker.subn(
            r"\1\n" + indented_block + "\n\n            ",
            text,
            count=1,
        )

        if count != 1:
            raise SystemExit(
                "Found the Type of Job block but could not place it above Recruiter message."
            )

    elif text.find("Type of Job") < text.find("Recruiter message"):
        raise SystemExit(
            "Could not identify the Type of Job block to move."
        )

    # Consistent title treatment. Only the required field receives a red asterisk.
    text = strip_help_spans(
        text,
        r"Job Description and any additional context",
        'Job Description and any additional context '
        '<span aria-hidden="true" className="text-red-700">*</span>'
        '<span className="sr-only"> required</span>',
    )

    text = strip_help_spans(
        text,
        r"Recruiter message",
        "Recruiter message",
    )

    text = strip_help_spans(
        text,
        r"(?:Official )?Job URL",
        "Job URL",
    )

    text = strip_help_spans(
        text,
        r"Company Name",
        "Company Name",
    )

    # Remove the descriptive byline under Type of Job so formatting is consistent.
    type_help_pattern = re.compile(
        r'(<span className="text-lg font-black text-slate-950">\s*Type of Job\s*</span>)'
        r'\s*<span className="mt-1 block text-base text-slate-700">[\s\S]*?</span>',
        re.MULTILINE,
    )
    text = type_help_pattern.sub(r"\1", text, count=1)

    # Put instructions and examples directly inside the inputs.
    replacements = [
        (
            'placeholder="Example Health"',
            'placeholder="Optional — Example: Example Health; recruiting agency: Talent Partners"',
        ),
        (
            'placeholder="Paste the job listing here..."',
            'placeholder="Required — Paste as much information about the listing as you can find. Example: job title, company, pay, location, schedule, duties, qualifications, benefits, job number, and application instructions."',
        ),
        (
            'placeholder="Paste the recruiter message here..."',
            'placeholder="Optional — Example: recruiter email, text, LinkedIn message, agency name, contact details, interview details, or follow-up answers."',
        ),
        (
            'placeholder="https://example.com/jobs/123"',
            'placeholder="Optional, but highly recommended — Example: https://organization.org/careers/job-123"',
        ),
    ]

    for old, new in replacements:
        text = replace_once(
            text,
            old,
            new,
            old,
        )

    # Make the job-description requirement explicit to the browser and assistive technology.
    textarea_pattern = re.compile(
        r'(<textarea\s+value=\{form\.listingText\}[\s\S]*?)(\s+className=)',
        re.MULTILINE,
    )

    if not re.search(
        r'<textarea\s+value=\{form\.listingText\}[\s\S]*?\brequired\b',
        text,
    ):
        text, count = textarea_pattern.subn(
            r"\1\n              required\n              aria-required=\"true\"\2",
            text,
            count=1,
        )

        if count != 1:
            raise SystemExit(
                "Could not mark the job-description textarea as required."
            )

    # Put Optional inside the Type of Job control by prefixing the visible option labels.
    option_pattern = re.compile(
        r'(\{OPPORTUNITY_TYPE_OPTIONS\.map\(\s*'
        r'\(option\) => \(\s*'
        r'<option[\s\S]*?>\s*)'
        r'\{option\.label\}'
        r'(\s*</option>)',
        re.MULTILINE,
    )

    text, count = option_pattern.subn(
        r"\1{`Optional — ${option.label}`}\2",
        text,
        count=1,
    )

    if count == 0 and "Optional — ${option.label}" not in text:
        print(
            "Note: Type of Job option labels were not changed automatically."
        )

    path.write_text(text, encoding="utf-8")
    print("Updated src/components/listing-analyzer.tsx")

def patch_report_history() -> None:
    path = backup("src/components/report-history.tsx")
    text = path.read_text(encoding="utf-8")

    replacements = [
        (
            "Complete the job check to save a report. A Job URL is optional.",
            "Provide a job description in order to save a report.",
        ),
        (
            "Complete the job check to save a report.",
            "Provide a job description in order to save a report.",
        ),
        (
            "Run the job check before saving.",
            "Provide a job description in order to save a report.",
        ),
    ]

    changed = False

    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
            changed = True

    if not changed and "Provide a job description in order to save a report." not in text:
        print(
            "Note: the saved-report helper text did not match a known phrase."
        )

    path.write_text(text, encoding="utf-8")
    print("Updated src/components/report-history.tsx")

def remove_safe_generated_files() -> None:
    removed = []

    patterns = [
        "*.v9-backup",
        "*.v10-backup",
        "*.pyc",
        "*.tsbuildinfo",
    ]

    for pattern in patterns:
        for path in ROOT.rglob(pattern):
            if (
                ".git" in path.parts
                or "node_modules" in path.parts
                or ".project-backups" in path.parts
            ):
                continue

            if path.is_file():
                path.unlink()
                removed.append(path.relative_to(ROOT))

    generated_root_files = [
        "apply_version10.py",
        "VERSION10_README.txt",
        "job-listing-reality-check-version10-upgrade.zip",
    ]

    for relative in generated_root_files:
        path = ROOT / relative

        if path.exists() and path.is_file():
            path.unlink()
            removed.append(path.relative_to(ROOT))

    for directory in [
        ROOT / ".next",
        ROOT / "__pycache__",
    ]:
        if directory.exists():
            shutil.rmtree(directory)
            removed.append(directory.relative_to(ROOT))

    print()
    print("Removed safe generated artifacts:")

    if removed:
        for path in removed:
            print(f"  {path}")
    else:
        print("  None found.")

def report_exact_source_duplicates() -> None:
    groups = {}

    for path in (ROOT / "src").rglob("*"):
        if not path.is_file():
            continue

        if path.suffix not in {
            ".ts",
            ".tsx",
            ".css",
            ".json",
        }:
            continue

        digest = hashlib.sha256(
            path.read_bytes()
        ).hexdigest()

        groups.setdefault(
            digest,
            [],
        ).append(path)

    duplicates = [
        paths
        for paths in groups.values()
        if len(paths) > 1
    ]

    print()
    print("Exact duplicate source-file audit:")

    if not duplicates:
        print("  No exact duplicate source files found.")
        return

    for paths in duplicates:
        print("  Duplicate group:")
        for path in paths:
            print(
                f"    {path.relative_to(ROOT)}"
            )

    print(
        "  No source files were deleted automatically."
    )

patch_page()
patch_listing_analyzer()
patch_report_history()
remove_safe_generated_files()
report_exact_source_duplicates()

print()
print("Version 10.1 interface and cleanup patch applied.")
print(
    "One organized backup set is stored in .project-backups/version10-1."
)
print(
    "Next: npm run typecheck && npm test && rm -rf .next && npm run dev"
)
