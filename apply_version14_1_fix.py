from __future__ import annotations

from pathlib import Path
import re
import shutil
import sys

ROOT = Path.cwd()


def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def backup(path: Path) -> None:
    backup_path = path.with_name(
        path.name + ".v14-1.bak",
    )

    if (
        path.exists()
        and not backup_path.exists()
    ):
        shutil.copy2(
            path,
            backup_path,
        )


def require_project() -> None:
    required = [
        ROOT / "package.json",
        ROOT
        / "src"
        / "components"
        / "listing-analyzer.tsx",
        ROOT
        / "src"
        / "components"
        / "research-contribution-panel.tsx",
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


def add_classes(
    opening_tag: str,
    required_classes: list[str],
) -> str:
    class_match = re.search(
        r'className="([^"]*)"',
        opening_tag,
    )

    if class_match:
        classes = (
            class_match
            .group(1)
            .split()
        )

        for class_name in required_classes:
            if class_name not in classes:
                classes.append(
                    class_name,
                )

        replacement = (
            'className="'
            + " ".join(classes)
            + '"'
        )

        return (
            opening_tag[
                :class_match.start()
            ]
            + replacement
            + opening_tag[
                class_match.end():
            ]
        )

    insertion = (
        ' className="'
        + " ".join(required_classes)
        + '"'
    )

    return (
        opening_tag[:-1]
        + insertion
        + ">"
    )


def update_label_classes(
    source: str,
    label_text_pattern: str,
    required_classes: list[str],
) -> tuple[str, bool]:
    label_pattern = re.compile(
        r"<label\b[^>]*>"
        r"[\s\S]*?"
        + label_text_pattern
        + r"[\s\S]*?"
        r"</label>",
        re.IGNORECASE,
    )

    match = label_pattern.search(
        source,
    )

    if not match:
        return source, False

    block = match.group(0)
    opening_end = (
        block.find(">") + 1
    )

    opening_tag = block[
        :opening_end
    ]

    updated_opening = add_classes(
        opening_tag,
        required_classes,
    )

    updated_block = (
        updated_opening
        + block[opening_end:]
    )

    return (
        source[:match.start()]
        + updated_block
        + source[match.end():],
        True,
    )


def patch_form_spacing() -> None:
    path = (
        ROOT
        / "src"
        / "components"
        / "listing-analyzer.tsx"
    )

    backup(path)

    source = path.read_text(
        encoding="utf-8",
    )

    source, type_found = (
        update_label_classes(
            source,
            r"Type\s+of\s+Job",
            [
                "block",
                "space-y-3",
            ],
        )
    )

    source, recruiter_found = (
        update_label_classes(
            source,
            r"Recruiter\s+Message",
            [
                "mt-8",
                "block",
                "space-y-3",
            ],
        )
    )

    if not type_found:
        fail(
            "Could not find the Type of Job field."
        )

    if not recruiter_found:
        fail(
            "Could not find the Recruiter Message field."
        )

    path.write_text(
        source,
        encoding="utf-8",
    )

    print(
        "Added an accessible eight-unit gap "
        "above Recruiter Message."
    )


def find_modern_trends_paragraph(
    source: str,
) -> tuple[int, str] | None:
    phrase_patterns = [
        r"based\s+on\s+modern"
        r"[\s\S]{0,100}?"
        r"trends",
        r"modern\s+hiring\s+trends",
        r"current\s+hiring\s+trends",
        r"modern\s+recruiting\s+trends",
    ]

    phrase_match = None

    for pattern in phrase_patterns:
        phrase_match = re.search(
            pattern,
            source,
            re.IGNORECASE,
        )

        if phrase_match:
            break

    if not phrase_match:
        return None

    paragraph_pattern = re.compile(
        r"<p\b[^>]*>"
        r"[\s\S]*?"
        r"</p>",
        re.IGNORECASE,
    )

    for paragraph in (
        paragraph_pattern.finditer(
            source,
        )
    ):
        if (
            paragraph.start()
            <= phrase_match.start()
            < paragraph.end()
        ):
            line_start = (
                source.rfind(
                    "\n",
                    0,
                    paragraph.start(),
                )
                + 1
            )

            indentation = re.match(
                r"[ \t]*",
                source[
                    line_start:
                    paragraph.start()
                ],
            )

            indent = (
                indentation.group(0)
                if indentation
                else ""
            )

            return (
                paragraph.start(),
                indent,
            )

    return None


def patch_post_interview_article() -> None:
    article_url = (
        "https://www.indeed.com/"
        "career-advice/"
        "career-development/"
        "ghosted-after-interview"
    )

    files = sorted(
        (
            ROOT / "src"
        ).rglob("*.tsx"),
    )

    for path in files:
        source = path.read_text(
            encoding="utf-8",
        )

        if article_url in source:
            print(
                "The post-interview ghosting "
                "paragraph is already present."
            )
            return

    for path in files:
        source = path.read_text(
            encoding="utf-8",
        )

        location = (
            find_modern_trends_paragraph(
                source,
            )
        )

        if not location:
            continue

        insertion_point, indent = (
            location
        )

        article_block = f'''{indent}<p className="mb-6 max-w-4xl text-base leading-7">
{indent}  Employers sometimes stop responding even after a
{indent}  candidate completes one or more interviews. This is
{indent}  commonly called post-interview ghosting. It does not
{indent}  necessarily mean the original listing was fake, but it
{indent}  does provide useful evidence about the employer&apos;s
{indent}  communication practices and candidate experience.{{" "}}
{indent}  <a
{indent}    href="{article_url}"
{indent}    target="_blank"
{indent}    rel="noreferrer"
{indent}    className="font-black underline decoration-2 underline-offset-4"
{indent}  >
{indent}    Read Indeed&apos;s guide to being ghosted after an interview
{indent}  </a>
{indent}</p>

'''

        backup(path)

        updated = (
            source[:insertion_point]
            + article_block
            + source[insertion_point:]
        )

        path.write_text(
            updated,
            encoding="utf-8",
        )

        print(
            "Added the post-interview "
            f"ghosting paragraph to "
            f"{path.relative_to(ROOT)}."
        )

        return

    fail(
        'Could not find text containing '
        '"Based on modern ... trends" '
        "in any TSX file."
    )


def find_preview_function_starts(
    lines: list[str],
) -> list[int]:
    function_starts: set[int] = set()

    for index, line in enumerate(
        lines
    ):
        if not re.search(
            r"^\s*preview\s*,?\s*$",
            line,
        ):
            continue

        function_start = None

        for previous in range(
            index,
            max(-1, index - 100),
            -1,
        ):
            candidate = lines[
                previous
            ]

            if re.search(
                r"\bfunction\s+\w+\s*\(",
                candidate,
            ):
                function_start = previous
                break

            if re.search(
                r"\bconst\s+\w+"
                r"\s*=",
                candidate,
            ):
                joined = "".join(
                    lines[
                        previous:
                        min(
                            index + 1,
                            previous + 12,
                        )
                    ]
                )

                if "=>" in joined:
                    function_start = (
                        previous
                    )
                    break

        if function_start is not None:
            function_starts.add(
                function_start,
            )

    return sorted(
        function_starts,
        reverse=True,
    )


def patch_research_preview_null_checks() -> None:
    path = (
        ROOT
        / "src"
        / "components"
        / "research-contribution-panel.tsx"
    )

    backup(path)

    source = path.read_text(
        encoding="utf-8",
    )

    lines = source.splitlines(
        keepends=True,
    )

    function_starts = (
        find_preview_function_starts(
            lines,
        )
    )

    if not function_starts:
        fail(
            "Could not locate the functions "
            "that use the research preview."
        )

    inserted = 0

    for function_start in (
        function_starts
    ):
        brace_line = None

        for index in range(
            function_start,
            min(
                len(lines),
                function_start + 20,
            ),
        ):
            if "{" in lines[index]:
                brace_line = index
                break

        if brace_line is None:
            continue

        nearby = "".join(
            lines[
                brace_line + 1:
                min(
                    len(lines),
                    brace_line + 8,
                )
            ]
        )

        if re.search(
            r"if\s*\(\s*!preview\s*\)",
            nearby,
        ):
            continue

        function_indent = re.match(
            r"[ \t]*",
            lines[brace_line],
        ).group(0)

        body_indent = (
            function_indent + "  "
        )

        guard = [
            (
                f"{body_indent}"
                "if (!preview) {\n"
            ),
            (
                f"{body_indent}"
                "  return;\n"
            ),
            (
                f"{body_indent}"
                "}\n"
            ),
            "\n",
        ]

        lines[
            brace_line + 1:
            brace_line + 1
        ] = guard

        inserted += 1

    path.write_text(
        "".join(lines),
        encoding="utf-8",
    )

    print(
        "Added explicit preview null checks "
        f"to {inserted} research action functions."
    )


def update_gitignore() -> None:
    path = ROOT / ".gitignore"

    existing = (
        path.read_text(
            encoding="utf-8",
        )
        if path.exists()
        else ""
    )

    entry = "*.v14-1.bak"

    if entry in existing.splitlines():
        return

    path.write_text(
        existing.rstrip()
        + "\n\n"
        + "# Local Version 14.1 backups\n"
        + entry
        + "\n",
        encoding="utf-8",
    )


def main() -> None:
    require_project()

    patch_form_spacing()
    patch_post_interview_article()
    patch_research_preview_null_checks()
    update_gitignore()

    print(
        "\nVERSION 14.1 FIX COMPLETED"
    )

    print(
        "Next run: npm run typecheck"
    )


if __name__ == "__main__":
    main()