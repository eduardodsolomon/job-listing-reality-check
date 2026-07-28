"use client";



import { UI_COPY } from "../content/ui-copy";
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
      UI_COPY.workspace.storedInBrowser,
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
      UI_COPY.workspace.profileSaved,
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
      UI_COPY.workspace.bundleDownloaded,
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
          ? UI_COPY.workspace.validBundle
          : UI_COPY.workspace.invalidBundle,
      );
    } catch {
      setPendingBundle(null);
      setImportReady(false);
      setStatus(
        UI_COPY.workspace.unreadableBundle,
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
      UI_COPY.workspace.importedRecords(imported),
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
      UI_COPY.workspace.profileNameRemoved,
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
            {UI_COPY.sectionLabels.localWorkspace}
          </p>

          <h2
            id="workspace-profile-heading"
            className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl"
          >
            {UI_COPY.workspace.heading}
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            Name this browser workspace and transfer its
            Job Listing Reality Check data between devices
            with an export file. This is not an online account,
            and there is no automatic cloud synchronization.
          </p>
        </div>

        <span className="w-fit rounded-full border-2 border-slate-700 bg-slate-100 px-4 py-2 text-sm font-black text-slate-950">
          {UI_COPY.workspace.localOnly}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5">
          <label className="block space-y-2">
            <span className="block text-lg font-black text-slate-950">
              {UI_COPY.workspace.workspaceName}
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
              UI_COPY.common.loading}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveProfile}
              disabled={!profile}
              className="min-h-12 rounded-xl bg-violet-800 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {UI_COPY.workspace.saveProfile}
            </button>

            <button
              type="button"
              onClick={deleteProfile}
              disabled={!profile}
              className="min-h-12 rounded-xl border-2 border-slate-600 bg-white px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {UI_COPY.workspace.removeProfileName}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5">
          <h3 className="text-xl font-black text-slate-950">
            {UI_COPY.workspace.transferWorkspace}
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
              {UI_COPY.workspace.exportWorkspace}
            </button>

            <label className="min-h-12 cursor-pointer rounded-xl border-2 border-slate-700 bg-white px-5 py-3 font-black text-slate-950">
              {UI_COPY.workspace.selectWorkspaceFile}
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
              {UI_COPY.workspace.importWorkspace}
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
