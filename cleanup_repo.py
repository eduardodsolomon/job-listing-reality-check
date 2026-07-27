from __future__ import annotations

from pathlib import Path
import argparse
import re
import shutil
import sys

ROOT = Path.cwd()

EXCLUDED_DIRECTORIES = {
    ".git",
    "node_modules",
}

GENERATED_DIRECTORIES = {
    ".next",
    "coverage",
    "__pycache__",
    ".pytest_cache",
    ".turbo",
}

ROOT_PATCH_PATTERNS = (
    "apply_version*.py",
    "apply_version*.mjs",
    "apply_*fix*.py",
    "apply_*fix*.mjs",
    "apply_test*.py",
    "apply_test*.mjs",
)

BACKUP_FILE_PATTERN = re.compile(
    r"""
    (
        \.bak
        |
        \.v\d+(?:-\d+)?\.bak
        |
        \.orig
        |
        ~
    )
    $
    """,
    re.IGNORECASE | re.VERBOSE,
)

GITIGNORE_LINES = [
    "",
    "# Local patch and backup artifacts",
    "*.bak",
    "*.v*.bak",
    "*.orig",
    "*~",
    "apply_version*.py",
    "apply_version*.mjs",
    "apply_*fix*.py",
    "apply_*fix*.mjs",
    "apply_test*.py",
    "apply_test*.mjs",
    "",
    "# Generated build and test output",
    ".next/",
    "coverage/",
    "*.tsbuildinfo",
    "__pycache__/",
    ".pytest_cache/",
    ".turbo/",
]


def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def is_excluded(path: Path) -> bool:
    try:
        parts = path.relative_to(ROOT).parts
    except ValueError:
        return True

    return any(
        part in EXCLUDED_DIRECTORIES
        for part in parts
    )


def collect_generated_paths() -> list[Path]:
    matches: set[Path] = set()

    for path in ROOT.rglob("*"):
        if is_excluded(path):
            continue

        if path.is_dir():
            if path.name in GENERATED_DIRECTORIES:
                matches.add(path)

            continue

        if BACKUP_FILE_PATTERN.search(path.name):
            matches.add(path)
            continue

        if path.name.endswith(".tsbuildinfo"):
            matches.add(path)

    for pattern in ROOT_PATCH_PATTERNS:
        for path in ROOT.glob(pattern):
            if path.is_file():
                matches.add(path)

    return sorted(
        matches,
        key=lambda item: (
            len(item.parts),
            str(item).lower(),
        ),
        reverse=True,
    )


def display_paths(paths: list[Path]) -> None:
    if not paths:
        print("No generated cleanup artifacts were found.")
        return

    print("Generated artifacts selected for cleanup:\n")

    for path in sorted(
        paths,
        key=lambda item: str(item).lower(),
    ):
        print(path.relative_to(ROOT))


def delete_paths(paths: list[Path]) -> None:
    for path in paths:
        if not path.exists():
            continue

        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()

        print(f"Removed {path.relative_to(ROOT)}")


def update_gitignore() -> None:
    path = ROOT / ".gitignore"

    existing = (
        path.read_text(encoding="utf-8")
        if path.exists()
        else ""
    )

    lines = existing.splitlines()

    changed = False

    for line in GITIGNORE_LINES:
        if not line:
            continue

        if line not in lines:
            lines.append(line)
            changed = True

    if not changed:
        print(".gitignore already contains the cleanup rules.")
        return

    path.write_text(
        "\n".join(lines).rstrip() + "\n",
        encoding="utf-8",
    )

    print("Updated .gitignore")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Preview or remove generated backup, patch, "
            "build, and cache artifacts."
        ),
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually remove the listed artifacts.",
    )

    args = parser.parse_args()

    if not (ROOT / "package.json").exists():
        fail(
            "Run this script from the "
            "job-listing-reality-check project root."
        )

    paths = collect_generated_paths()
    display_paths(paths)

    print(
        "\nNo .test.ts, .test.tsx, .spec.ts, "
        "or .spec.tsx files are selected by this script."
    )

    if not args.apply:
        print(
            "\nPreview only. Run this command to apply:\n"
            "python cleanup_repo.py --apply"
        )
        return

    delete_paths(paths)
    update_gitignore()

    print("\nREPOSITORY CLEANUP COMPLETED")


if __name__ == "__main__":
    main()