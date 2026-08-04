import { describe, expect, it } from "vitest";
import {
  createUserProfile,
  getUserProfile,
  getUserProfileByUsername,
  getUserProfiles,
  isUsernameAvailable,
  ProfileExistsError,
  ProfileNotFoundError,
  updateUserProfile,
  UsernameTakenError,
} from "@/lib/data/users";
import { createAuthUser, createTestUser, unique } from "@/lib/data/__tests__/testHelpers";

describe("createUserProfile", () => {
  it("creates the profile and reserves the username together", async () => {
    const { uid, suggestedUsername } = await createAuthUser();

    await createUserProfile(uid, suggestedUsername, "New User");

    await expect(getUserProfile(uid)).resolves.toMatchObject({
      username: suggestedUsername,
      displayName: "New User",
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
    });
    await expect(isUsernameAvailable(suggestedUsername)).resolves.toBe(false);
  });

  it("rejects a username that's already taken", async () => {
    const existing = await createTestUser();
    const { uid } = await createAuthUser();

    await expect(createUserProfile(uid, existing.username, "Someone Else")).rejects.toThrow(
      UsernameTakenError,
    );
  });

  it("rejects creating a second profile for the same uid", async () => {
    const user = await createTestUser();
    await expect(
      createUserProfile(user.uid, `other_${unique()}`, "Duplicate"),
    ).rejects.toThrow(ProfileExistsError);
  });
});

describe("updateUserProfile", () => {
  it("renaming frees the old username and reserves the new one", async () => {
    const user = await createTestUser();
    const oldUsername = user.username;
    const newUsername = `renamed_${unique()}`;

    await updateUserProfile(user.uid, {
      username: newUsername,
      displayName: "Renamed",
      bio: "",
      photoURL: null,
    });

    await expect(getUserProfile(user.uid)).resolves.toMatchObject({ username: newUsername });
    await expect(isUsernameAvailable(oldUsername)).resolves.toBe(true);
    await expect(isUsernameAvailable(newUsername)).resolves.toBe(false);
    await expect(getUserProfileByUsername(newUsername)).resolves.toMatchObject({ uid: user.uid });
  });

  it("rejects renaming to a username someone else already has", async () => {
    const user = await createTestUser();
    const other = await createTestUser();

    await expect(
      updateUserProfile(user.uid, {
        username: other.username,
        displayName: "x",
        bio: "",
        photoURL: null,
      }),
    ).rejects.toThrow(UsernameTakenError);
  });

  it("rejects updating a profile that doesn't exist", async () => {
    await expect(
      updateUserProfile("does-not-exist", {
        username: `ghost_${unique()}`,
        displayName: "x",
        bio: "",
        photoURL: null,
      }),
    ).rejects.toThrow(ProfileNotFoundError);
  });
});

describe("getUserProfiles", () => {
  it("batch-resolves only the uids that have a profile", async () => {
    const a = await createTestUser();
    const b = await createTestUser();

    const byUid = await getUserProfiles([a.uid, b.uid, "does-not-exist"]);

    expect(byUid.size).toBe(2);
    expect(byUid.get(a.uid)).toMatchObject({ username: a.username });
    expect(byUid.get(b.uid)).toMatchObject({ username: b.username });
    expect(byUid.has("does-not-exist")).toBe(false);
  });

  it("returns an empty map for an empty input", async () => {
    await expect(getUserProfiles([])).resolves.toEqual(new Map());
  });
});
