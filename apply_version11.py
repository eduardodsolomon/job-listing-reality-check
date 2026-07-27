from __future__ import annotations

from pathlib import Path
import json
import base64
import zlib
import re
import shutil
import sys

ROOT = Path.cwd()
PAYLOAD = (
    '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'
    '6fj5BRN/4bjGbv4X9Rzzow=='
)
FILES = json.loads(
    zlib.decompress(
        base64.b64decode(PAYLOAD),
    ).decode("utf-8"),
)


def fail(message: str) -> None:
    print(f"\nERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def require_project() -> None:
    required = [
        ROOT / "package.json",
        ROOT / "src" / "components" / "listing-analyzer.tsx",
        ROOT / "src" / "components" / "action-plan.tsx",
        ROOT / "src" / "components" / "job-health-dashboard.tsx",
        ROOT / "src" / "components" / "batch-analyzer.tsx",
        ROOT / "src" / "lib" / "batch-analysis.ts",
    ]

    missing = [
        str(path.relative_to(ROOT))
        for path in required
        if not path.exists()
    ]

    if missing:
        fail(
            "Run this file from the job-listing-reality-check project root. "
            f"Missing: {', '.join(missing)}"
        )


def backup(path: Path) -> None:
    if not path.exists():
        return

    backup_path = path.with_name(
        path.name + ".v11.bak"
    )

    if not backup_path.exists():
        shutil.copy2(path, backup_path)


def write_files() -> None:
    for relative, content in FILES.items():
        path = ROOT / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        backup(path)
        path.write_text(content, encoding="utf-8")
        print(f"Replaced {relative}")


def tag_ranges(text: str, tag: str) -> list[tuple[int, int]]:
    token_pattern = re.compile(
        rf"</?{re.escape(tag)}\b[^>]*>",
        re.IGNORECASE,
    )

    stack: list[int] = []
    ranges: list[tuple[int, int]] = []

    for match in token_pattern.finditer(text):
        token = match.group(0)

        if token.startswith("</"):
            if stack:
                start = stack.pop()
                ranges.append((start, match.end()))
            continue

        if token.rstrip().endswith("/>"):
            ranges.append((match.start(), match.end()))
            continue

        stack.append(match.start())

    return ranges


def smallest_range_containing(
    text: str,
    tag: str,
    positions: list[int],
) -> tuple[int, int] | None:
    candidates = [
        span
        for span in tag_ranges(text, tag)
        if all(
            span[0] <= position < span[1]
            for position in positions
        )
    ]

    if not candidates:
        return None

    return min(
        candidates,
        key=lambda span: span[1] - span[0],
    )


def remove_component(
    text: str,
    component: str,
) -> tuple[str, str | None]:
    pattern = re.compile(
        rf"\s*<{re.escape(component)}\b[\s\S]*?/>",
        re.MULTILINE,
    )

    match = pattern.search(text)

    if not match:
        return text, None

    block = match.group(0).strip()

    return (
        text[:match.start()]
        + text[match.end():],
        block,
    )


def move_immediate_danger_before_next_steps(
    text: str,
) -> str:
    lower = text.lower()
    danger_position = lower.find(
        "immediate danger",
    )

    if danger_position < 0:
        print(
            "Note: no Immediate Danger Warning section was found to move."
        )
        return text

    danger_range = smallest_range_containing(
        text,
        "section",
        [danger_position],
    )

    if danger_range is None:
        danger_range = (
            smallest_range_containing(
                text,
                "div",
                [danger_position],
            )
        )

    if danger_range is None:
        print(
            "Note: the Immediate Danger Warning text was found, "
            "but its container could not be identified."
        )
        return text

    block = text[
        danger_range[0]:
        danger_range[1]
    ].strip()

    without = (
        text[:danger_range[0]]
        + text[danger_range[1]:]
    )

    action_position = without.find(
        "<ActionPlan",
    )

    if action_position < 0:
        print(
            "Note: ActionPlan was not found, so the danger section was left in place."
        )
        return text

    return (
        without[:action_position]
        + block
        + "\n\n          "
        + without[action_position:]
    )


def move_url_below_buttons(
    text: str,
) -> str:
    label_ranges = tag_ranges(
        text,
        "label",
    )

    url_range = None

    for span in label_ranges:
        content = text[
            span[0]:
            span[1]
        ]

        if re.search(
            r"\bJob URL\b",
            content,
            re.IGNORECASE,
        ):
            url_range = span
            break

    if url_range is None:
        print(
            "Note: Job URL field was not found to move."
        )
        return text

    check_position = text.find(
        "Check this job",
    )

    clear_position = text.find(
        ">Clear<",
    )

    if clear_position < 0:
        clear_position = text.find(
            "Clear",
        )

    if (
        check_position < 0
        or clear_position < 0
    ):
        print(
            "Note: the Check this job / Clear button group was not found."
        )
        return text

    button_range = (
        smallest_range_containing(
            text,
            "div",
            [
                check_position,
                clear_position,
            ],
        )
    )

    if button_range is None:
        print(
            "Note: the button container was not identified."
        )
        return text

    if url_range[0] > button_range[1]:
        print(
            "Job URL is already below the Check this job / Clear buttons."
        )
        return text

    url_block = text[
        url_range[0]:
        url_range[1]
    ].strip()

    without_url = (
        text[:url_range[0]]
        + text[url_range[1]:]
    )

    (
        without_verification,
        verification_block,
    ) = remove_component(
        without_url,
        "VerificationPanel",
    )

    check_position = (
        without_verification.find(
            "Check this job",
        )
    )

    clear_position = (
        without_verification.find(
            ">Clear<",
        )
    )

    if clear_position < 0:
        clear_position = (
            without_verification.find(
                "Clear",
            )
        )

    button_range = (
        smallest_range_containing(
            without_verification,
            "div",
            [
                check_position,
                clear_position,
            ],
        )
    )

    if button_range is None:
        print(
            "Note: the button container could not be re-identified after moving the URL."
        )
        return text

    moved = (
        '\n\n          <div className="mt-6 space-y-4">\n'
        + url_block
    )

    if verification_block:
        moved += (
            "\n\n"
            + verification_block
        )

    moved += "\n          </div>"

    return (
        without_verification[
            :button_range[1]
        ]
        + moved
        + without_verification[
            button_range[1]:
        ]
    )


def patch_listing_analyzer() -> None:
    path = (
        ROOT
        / "src"
        / "components"
        / "listing-analyzer.tsx"
    )

    backup(path)

    text = path.read_text(
        encoding="utf-8",
    )

    text = re.sub(
        r'^import SpecializedProfilePanel from "@/components/specialized-profile-panel";\s*$',
        "",
        text,
        flags=re.MULTILINE,
    )

    text = re.sub(
        r'^import ResearchAssistantPanel from "@/components/research-assistant-panel";\s*$',
        "",
        text,
        flags=re.MULTILINE,
    )

    text, _ = remove_component(
        text,
        "SpecializedProfilePanel",
    )

    text, _ = remove_component(
        text,
        "ResearchAssistantPanel",
    )

    action_pattern = re.compile(
        r"<ActionPlan\b[\s\S]*?/>",
        re.MULTILINE,
    )

    action_replacement = '''<ActionPlan
            groups={nextStepGroups}
            warningSignals={warningSignals}
            specializedResult={specializedResult}
            researchTasks={buildResearchTasks(
              form,
              analysisResult,
              verificationResult,
              reconciliationResult,
            )}
          />'''

    (
        text,
        action_count,
    ) = action_pattern.subn(
        action_replacement,
        text,
        count=1,
    )

    if action_count != 1:
        fail(
            "Could not find the ActionPlan component in listing-analyzer.tsx. "
            "No final Version 11 layout was written."
        )

    text = (
        move_immediate_danger_before_next_steps(
            text,
        )
    )

    text = move_url_below_buttons(
        text,
    )

    text = text.replace(
        "What to consider next",
        "Next Steps",
    )

    text = text.replace(
        "Job Health",
        "Sanity Score",
    )

    path.write_text(
        text,
        encoding="utf-8",
    )

    print(
        "Patched src/components/listing-analyzer.tsx"
    )


def patch_visible_labels() -> None:
    components = (
        ROOT
        / "src"
        / "components"
    )

    for path in components.rglob(
        "*.tsx",
    ):
        text = path.read_text(
            encoding="utf-8",
        )

        updated = (
            text
            .replace(
                "What to consider next",
                "Next Steps",
            )
            .replace(
                "Job Health",
                "Sanity Score",
            )
        )

        if updated != text:
            backup(path)

            path.write_text(
                updated,
                encoding="utf-8",
            )

            print(
                "Updated visible labels in "
                f"{path.relative_to(ROOT)}"
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

    entry = "*.v11.bak"

    if entry in existing.splitlines():
        return

    path.write_text(
        existing.rstrip()
        + "\n\n"
        + "# Local Version 11 backups\n"
        + entry
        + "\n",
        encoding="utf-8",
    )


def main() -> None:
    require_project()
    write_files()
    patch_listing_analyzer()
    patch_visible_labels()
    update_gitignore()

    print(
        "\nVERSION 11 PATCH COMPLETED"
    )

    print(
        "Backups use the .v11.bak extension and are ignored by Git."
    )

    print(
        "Next run: npm run typecheck"
    )


if __name__ == "__main__":
    main()