import {
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
