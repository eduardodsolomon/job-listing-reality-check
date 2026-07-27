from __future__ import annotations

from pathlib import Path
import re
import shutil
import sys

ROOT = Path.cwd()


def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    required = [
        ROOT / "package.json",
        ROOT / "src" / "lib" / "specialized-analysis.ts",
    ]

    missing = [
        str(path.relative_to(ROOT))
        for path in required
        if not path.exists()
    ]

    if missing:
        fail(
            "Run this script from the project root. "
            f"Missing: {', '.join(missing)}"
        )

    backup_dir = ROOT / ".patch-backups"

    if backup_dir.exists():
        shutil.rmtree(backup_dir)
        print("Removed .patch-backups so Vitest will not run backup tests.")
    else:
        print("No .patch-backups directory was present.")

    path = ROOT / "src" / "lib" / "specialized-analysis.ts"
    original = path.read_text(encoding="utf-8")

    pattern = re.compile(
        r'''  const paid = has\(
    text,
    /\\\$\\s\?\\d\|paid internship\|hourly pay\|salary\|stipend\|compensation/i,
  \);'''
    )

    replacement = r'''  const paid = has(
    text,
    /paid internship|hourly pay|salary|stipend|compensation|(?:pay|wage|rate)\s*(?:of|is|:)?\s*\$\s?\d|\$\s?\d[\d,]*(?:\.\d{2})?\s*(?:per|\/)\s*(?:hour|week|month|year)/i,
  );'''

    updated, count = pattern.subn(
        replacement,
        original,
        count=1,
    )

    if count == 0:
        if replacement in original:
            print("Internship compensation rule was already corrected.")
        else:
            fail(
                "Could not find the internship compensation rule. "
                "No source file was changed."
            )
    else:
        path.write_text(updated, encoding="utf-8")
        print(
            "Corrected internship pay detection so fees are not counted as compensation."
        )

    gitignore = ROOT / ".gitignore"
    existing = (
        gitignore.read_text(encoding="utf-8")
        if gitignore.exists()
        else ""
    )

    if ".patch-backups/" not in existing.splitlines():
        updated_ignore = (
            existing.rstrip()
            + "\n\n# Temporary patch artifacts\n.patch-backups/\n"
        )
        gitignore.write_text(updated_ignore, encoding="utf-8")
        print("Added .patch-backups/ to .gitignore.")

    print("\nFIX COMPLETED")


if __name__ == "__main__":
    main()
