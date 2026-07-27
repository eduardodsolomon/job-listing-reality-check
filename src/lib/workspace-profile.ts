"use client";

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
