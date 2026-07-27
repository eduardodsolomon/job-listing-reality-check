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
    if not path.exists():
        return

    backup_path = path.with_name(path.name + ".v14.bak")

    if not backup_path.exists():
        shutil.copy2(path, backup_path)


def write_file(relative: str, content: str) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    backup(path)
    path.write_text(content, encoding="utf-8")
    print(f"Wrote {relative}")


def require_project() -> None:
    required = [
        ROOT / "package.json",
        ROOT / "src" / "app" / "page.tsx",
        ROOT / "src" / "components" / "listing-analyzer.tsx",
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


WORKSPACE_PROFILE_TS = r'''"use client";

export const APP_STORAGE_PREFIX =
  "job-listing-reality-check:";

export const PROFILE_STORAGE_KEY =
  `${APP_STORAGE_PREFIX}workspace-profile`;

export const WORKSPACE_BUNDLE_VERSION =
  1;

export interface WorkspaceProfile {
  version: 1;
  workspaceId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceBundle {
  version: 1;
  exportedAt: string;
  profile: WorkspaceProfile;
  storage: Record<string, string>;
}

function createId(): string {
  if (
    typeof globalThis.crypto
      ?.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return [
    Date.now(),
    Math.random()
      .toString(16)
      .slice(2),
  ].join("-");
}

export function createWorkspaceProfile(
  displayName = "",
  now = new Date(),
): WorkspaceProfile {
  const timestamp =
    now.toISOString();

  return {
    version: 1,
    workspaceId: createId(),
    displayName:
      displayName.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

export function isWorkspaceProfile(
  value: unknown,
): value is WorkspaceProfile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === 1 &&
    typeof value.workspaceId ===
      "string" &&
    typeof value.displayName ===
      "string" &&
    typeof value.createdAt ===
      "string" &&
    typeof value.updatedAt ===
      "string"
  );
}

export function updateWorkspaceProfile(
  profile: WorkspaceProfile,
  displayName: string,
  now = new Date(),
): WorkspaceProfile {
  return {
    ...profile,
    displayName:
      displayName.trim(),
    updatedAt:
      now.toISOString(),
  };
}

export function isAppStorageKey(
  key: string,
): boolean {
  return key.startsWith(
    APP_STORAGE_PREFIX,
  );
}

export function createWorkspaceBundle(
  profile: WorkspaceProfile,
  storage: Storage,
  now = new Date(),
): WorkspaceBundle {
  const values:
    Record<string, string> = {};

  for (
    let index = 0;
    index < storage.length;
    index += 1
  ) {
    const key =
      storage.key(index);

    if (
      !key ||
      !isAppStorageKey(key)
    ) {
      continue;
    }

    const value =
      storage.getItem(key);

    if (value !== null) {
      values[key] = value;
    }
  }

  return {
    version:
      WORKSPACE_BUNDLE_VERSION,
    exportedAt:
      now.toISOString(),
    profile,
    storage: values,
  };
}

export function isWorkspaceBundle(
  value: unknown,
): value is WorkspaceBundle {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== 1 ||
    typeof value.exportedAt !==
      "string" ||
    !isWorkspaceProfile(
      value.profile,
    ) ||
    !isRecord(value.storage)
  ) {
    return false;
  }

  return Object.entries(
    value.storage,
  ).every(
    ([key, storedValue]) =>
      isAppStorageKey(key) &&
      typeof storedValue ===
        "string",
  );
}

export function importWorkspaceBundle(
  bundle: WorkspaceBundle,
  storage: Storage,
): number {
  let imported = 0;

  for (
    const [key, value]
    of Object.entries(
      bundle.storage,
    )
  ) {
    if (!isAppStorageKey(key)) {
      continue;
    }

    storage.setItem(
      key,
      value,
    );

    imported += 1;
  }

  storage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(
      bundle.profile,
    ),
  );

  return imported;
}
'''

WORKSPACE_PROFILE_PANEL = r'''"use client";

import {
  type ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  PROFILE_STORAGE_KEY,
  createWorkspaceBundle,
  createWorkspaceProfile,
  importWorkspaceBundle,
  isWorkspaceBundle,
  isWorkspaceProfile,
  updateWorkspaceProfile,
  type WorkspaceProfile,
} from "@/lib/workspace-profile";

function downloadJson(
  value: unknown,
  filename: string,
): void {
  const blob = new Blob(
    [
      JSON.stringify(
        value,
        null,
        2,
      ),
    ],
    {
      type:
        "application/json;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function loadProfile():
  WorkspaceProfile {
  const raw =
    window.localStorage.getItem(
      PROFILE_STORAGE_KEY,
    );

  if (raw) {
    try {
      const parsed:
        unknown =
          JSON.parse(raw);

      if (
        isWorkspaceProfile(
          parsed,
        )
      ) {
        return parsed;
      }
    } catch {
      // Create a fresh profile below.
    }
  }

  const profile =
    createWorkspaceProfile();

  window.localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(profile),
  );

  return profile;
}

export default function WorkspaceProfilePanel() {
  const [profile, setProfile] =
    useState<WorkspaceProfile | null>(
      null,
    );

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [status, setStatus] =
    useState(
      "This workspace is stored only in this browser.",
    );

  const [
    importReady,
    setImportReady,
  ] = useState(false);

  const [
    pendingBundle,
    setPendingBundle,
  ] = useState<unknown>(null);

  useEffect(() => {
    const loaded =
      loadProfile();

    setProfile(loaded);
    setDisplayName(
      loaded.displayName,
    );
  }, []);

  function saveProfile(): void {
    if (!profile) {
      return;
    }

    const updated =
      updateWorkspaceProfile(
        profile,
        displayName,
      );

    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(updated),
    );

    setProfile(updated);
    setStatus(
      "Local workspace profile saved.",
    );
  }

  function exportWorkspace(): void {
    if (!profile) {
      return;
    }

    const bundle =
      createWorkspaceBundle(
        profile,
        window.localStorage,
      );

    downloadJson(
      bundle,
      "job-reality-check-workspace.json",
    );

    setStatus(
      "Workspace bundle downloaded. It may contain saved job descriptions, so store it securely.",
    );
  }

  async function chooseImport(
    event:
      ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed:
        unknown =
          JSON.parse(
            await file.text(),
          );

      setPendingBundle(parsed);
      setImportReady(
        isWorkspaceBundle(parsed),
      );

      setStatus(
        isWorkspaceBundle(parsed)
          ? "Valid workspace bundle selected. Review the warning before importing."
          : "That file is not a valid Job Listing Reality Check workspace bundle.",
      );
    } catch {
      setPendingBundle(null);
      setImportReady(false);
      setStatus(
        "The selected file could not be read as JSON.",
      );
    }
  }

  function importWorkspace(): void {
    if (
      !importReady ||
      !isWorkspaceBundle(
        pendingBundle,
      )
    ) {
      return;
    }

    const imported =
      importWorkspaceBundle(
        pendingBundle,
        window.localStorage,
      );

    setStatus(
      `Imported ${imported} local workspace records. Reloading the page.`,
    );

    window.location.reload();
  }

  function deleteProfile(): void {
    window.localStorage.removeItem(
      PROFILE_STORAGE_KEY,
    );

    const replacement =
      createWorkspaceProfile();

    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(
        replacement,
      ),
    );

    setProfile(replacement);
    setDisplayName("");
    setStatus(
      "The local profile name was removed. Saved reports and research records were not deleted.",
    );
  }

  return (
    <section
      aria-labelledby="workspace-profile-heading"
      className="mb-8 rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-lg sm:p-7"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-800">
            Version 14
          </p>

          <h2
            id="workspace-profile-heading"
            className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl"
          >
            Local workspace profile
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            Name this browser workspace and transfer its
            Job Listing Reality Check data between devices
            with an export file. This is not an online account,
            and there is no automatic cloud synchronization.
          </p>
        </div>

        <span className="w-fit rounded-full border-2 border-slate-700 bg-slate-100 px-4 py-2 text-sm font-black text-slate-950">
          Local only
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5">
          <label className="block space-y-2">
            <span className="block text-lg font-black text-slate-950">
              Workspace name
            </span>

            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(
                  event.target.value,
                );
              }}
              placeholder="Optional — Personal job search"
              className="min-h-12 w-full rounded-xl border-2 border-slate-500 bg-white px-4 py-3 text-base text-slate-950"
            />
          </label>

          <p className="mt-3 break-all text-sm text-slate-600">
            Workspace ID:{" "}
            {profile?.workspaceId ??
              "Loading"}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveProfile}
              disabled={!profile}
              className="min-h-12 rounded-xl bg-violet-800 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save profile
            </button>

            <button
              type="button"
              onClick={deleteProfile}
              disabled={!profile}
              className="min-h-12 rounded-xl border-2 border-slate-600 bg-white px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove profile name
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5">
          <h3 className="text-xl font-black text-slate-950">
            Transfer this workspace
          </h3>

          <p className="mt-3 text-base leading-7 text-slate-800">
            A workspace export may contain raw saved job
            descriptions, recruiter messages, URLs, and local
            research records. Treat the downloaded file as
            private job-search data.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportWorkspace}
              disabled={!profile}
              className="min-h-12 rounded-xl bg-slate-950 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export workspace
            </button>

            <label className="min-h-12 cursor-pointer rounded-xl border-2 border-slate-700 bg-white px-5 py-3 font-black text-slate-950">
              Select workspace file
              <input
                type="file"
                accept="application/json,.json"
                onChange={chooseImport}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={importWorkspace}
              disabled={!importReady}
              className="min-h-12 rounded-xl bg-violet-800 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import selected workspace
            </button>
          </div>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-bold text-slate-800"
      >
        {status}
      </p>
    </section>
  );
}
'''

WORKSPACE_PROFILE_TEST = r'''import {
  describe,
  expect,
  it,
} from "vitest";

import {
  APP_STORAGE_PREFIX,
  createWorkspaceBundle,
  createWorkspaceProfile,
  isAppStorageKey,
  isWorkspaceBundle,
  updateWorkspaceProfile,
} from "./workspace-profile";

class MemoryStorage
  implements Storage {
  private readonly values =
    new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(
    key: string,
  ): string | null {
    return (
      this.values.get(key) ??
      null
    );
  }

  key(
    index: number,
  ): string | null {
    return (
      [...this.values.keys()][
        index
      ] ?? null
    );
  }

  removeItem(
    key: string,
  ): void {
    this.values.delete(key);
  }

  setItem(
    key: string,
    value: string,
  ): void {
    this.values.set(
      key,
      value,
    );
  }
}

describe(
  "workspace profile",
  () => {
    it(
      "updates the local display name",
      () => {
        const original =
          createWorkspaceProfile(
            "",
            new Date(
              "2026-01-01T00:00:00.000Z",
            ),
          );

        const updated =
          updateWorkspaceProfile(
            original,
            "  My Search  ",
            new Date(
              "2026-01-02T00:00:00.000Z",
            ),
          );

        expect(
          updated.displayName,
        ).toBe("My Search");

        expect(
          updated.workspaceId,
        ).toBe(
          original.workspaceId,
        );
      },
    );

    it(
      "exports only application storage keys",
      () => {
        const storage =
          new MemoryStorage();

        storage.setItem(
          `${APP_STORAGE_PREFIX}reports`,
          "[]",
        );

        storage.setItem(
          "unrelated-website-data",
          "do not export",
        );

        const bundle =
          createWorkspaceBundle(
            createWorkspaceProfile(),
            storage,
          );

        expect(
          bundle.storage[
            `${APP_STORAGE_PREFIX}reports`
          ],
        ).toBe("[]");

        expect(
          bundle.storage[
            "unrelated-website-data"
          ],
        ).toBeUndefined();

        expect(
          isWorkspaceBundle(
            bundle,
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects storage keys outside the application prefix",
      () => {
        expect(
          isAppStorageKey(
            "unrelated:data",
          ),
        ).toBe(false);
      },
    );
  },
);
'''


def patch_page() -> None:
    path = ROOT / "src" / "app" / "page.tsx"
    backup(path)
    source = path.read_text(encoding="utf-8")

    import_line = (
        'import WorkspaceProfilePanel from '
        '"@/components/workspace-profile-panel";'
    )

    if import_line not in source:
        workspace_import = re.compile(
            r'import JobRealityWorkspace from '
            r'"@/components/job-reality-workspace";'
        )

        if not workspace_import.search(source):
            fail(
                "Could not find the JobRealityWorkspace import in src/app/page.tsx."
            )

        source = workspace_import.sub(
            lambda match:
                match.group(0)
                + "\n"
                + import_line,
            source,
            count=1,
        )

    if "<WorkspaceProfilePanel" not in source:
        marker = "<JobRealityWorkspace />"

        if marker not in source:
            fail(
                "Could not find <JobRealityWorkspace /> in src/app/page.tsx."
            )

        source = source.replace(
            marker,
            (
                "<WorkspaceProfilePanel />"
                "\n\n"
                "      "
                + marker
            ),
            1,
        )

    article_title = (
        "6 Steps To Take After Being Ghosted Following an Interview"
    )

    if article_title not in source:
        paragraph_pattern = re.compile(
            r'(<p\b[^>]*>[\s\S]*?Based on modern trends[\s\S]*?</p>)',
            re.IGNORECASE,
        )

        match = paragraph_pattern.search(source)

        if not match:
            fail(
                'Could not find the paragraph containing "Based on modern trends" in src/app/page.tsx.'
            )

        article_block = '''<p className="mt-4 max-w-4xl text-base leading-7 text-slate-200">
          Employer silence can continue even after a candidate
          completes one or more interviews. That kind of
          post-interview ghosting is a separate warning about
          the employer&apos;s communication practices and candidate
          experience, even when the original listing was genuine.{" "}
          <a
            href="https://www.indeed.com/career-advice/career-development/ghosted-after-interview"
            target="_blank"
            rel="noreferrer"
            className="font-black text-white underline decoration-2 underline-offset-4"
          >
            Read: 6 Steps To Take After Being Ghosted Following an Interview
          </a>
        </p>

        '''

        source = (
            source[:match.start()]
            + article_block
            + source[match.start():]
        )

    path.write_text(source, encoding="utf-8")
    print("Patched src/app/page.tsx")


def add_classes(
    opening_tag: str,
    required: list[str],
) -> str:
    class_match = re.search(
        r'className="([^"]*)"',
        opening_tag,
    )

    if class_match:
        classes = class_match.group(1).split()

        for item in required:
            if item not in classes:
                classes.append(item)

        replacement = (
            'className="'
            + " ".join(classes)
            + '"'
        )

        return (
            opening_tag[:class_match.start()]
            + replacement
            + opening_tag[class_match.end():]
        )

    insertion = (
        ' className="'
        + " ".join(required)
        + '"'
    )

    return opening_tag[:-1] + insertion + ">"


def patch_listing_spacing() -> None:
    path = (
        ROOT
        / "src"
        / "components"
        / "listing-analyzer.tsx"
    )

    backup(path)
    source = path.read_text(encoding="utf-8")

    labels = list(
        re.finditer(
            r"<label\b[^>]*>[\s\S]*?</label>",
            source,
        )
    )

    changed = 0

    for match in reversed(labels):
        block = match.group(0)

        if not re.search(
            r"\bRecruiter Message\b|\bRecruiter message\b",
            block,
        ):
            continue

        opening_end = block.find(">") + 1
        opening = block[:opening_end]

        updated_opening = add_classes(
            opening,
            [
                "mt-6",
                "block",
                "space-y-2",
            ],
        )

        updated_block = (
            updated_opening
            + block[opening_end:]
        )

        source = (
            source[:match.start()]
            + updated_block
            + source[match.end():]
        )

        changed += 1
        break

    if changed != 1:
        fail(
            "Could not find the Recruiter Message label in src/components/listing-analyzer.tsx."
        )

    labels = list(
        re.finditer(
            r"<label\b[^>]*>[\s\S]*?</label>",
            source,
        )
    )

    for match in reversed(labels):
        block = match.group(0)

        if not re.search(
            r"\bType of Job\b",
            block,
        ):
            continue

        opening_end = block.find(">") + 1
        opening = block[:opening_end]

        updated_opening = add_classes(
            opening,
            [
                "block",
                "space-y-2",
            ],
        )

        source = (
            source[:match.start()]
            + updated_opening
            + block[opening_end:]
            + source[match.end():]
        )

        break

    path.write_text(source, encoding="utf-8")
    print(
        "Normalized form spacing in src/components/listing-analyzer.tsx"
    )


def update_gitignore() -> None:
    path = ROOT / ".gitignore"

    existing = (
        path.read_text(encoding="utf-8")
        if path.exists()
        else ""
    )

    entry = "*.v14.bak"

    if entry in existing.splitlines():
        return

    path.write_text(
        existing.rstrip()
        + "\n\n"
        + "# Local Version 14 backups\n"
        + entry
        + "\n",
        encoding="utf-8",
    )


def main() -> None:
    require_project()

    write_file(
        "src/lib/workspace-profile.ts",
        WORKSPACE_PROFILE_TS,
    )

    write_file(
        "src/components/workspace-profile-panel.tsx",
        WORKSPACE_PROFILE_PANEL,
    )

    write_file(
        "src/lib/workspace-profile.test.ts",
        WORKSPACE_PROFILE_TEST,
    )

    patch_page()
    patch_listing_spacing()
    update_gitignore()

    print("\nVERSION 14 INSTALLED")
    print(
        "Version 14 adds a local profile and portable workspace bundle."
    )
    print(
        "No online account, password, or automatic cloud synchronization was added."
    )
    print(
        "It also normalizes the form spacing and adds the post-interview ghosting article."
    )
    print(
        "Next run: npm run typecheck"
    )


if __name__ == "__main__":
    main()