import { describe, expect, it } from "vitest";
import {
  CannotFollowSelfError,
  followUser,
  getFollowingIds,
  isFollowing,
  unfollowUser,
  UserNotFoundError,
} from "@/lib/data/follows";
import { getUserProfile } from "@/lib/data/users";
import { createTestUser } from "@/lib/data/__tests__/testHelpers";

describe("followUser", () => {
  it("creates the relationship and bumps both users' counters together", async () => {
    const follower = await createTestUser();
    const followed = await createTestUser();

    await followUser(follower.uid, followed.uid);

    await expect(isFollowing(follower.uid, followed.uid)).resolves.toBe(true);
    await expect(getUserProfile(follower.uid)).resolves.toMatchObject({ followingCount: 1 });
    await expect(getUserProfile(followed.uid)).resolves.toMatchObject({ followerCount: 1 });
  });

  it("is idempotent - following twice doesn't double-count", async () => {
    const follower = await createTestUser();
    const followed = await createTestUser();

    await followUser(follower.uid, followed.uid);
    await followUser(follower.uid, followed.uid);
    await followUser(follower.uid, followed.uid);

    await expect(getUserProfile(follower.uid)).resolves.toMatchObject({ followingCount: 1 });
    await expect(getUserProfile(followed.uid)).resolves.toMatchObject({ followerCount: 1 });
  });

  it("rejects following yourself", async () => {
    const user = await createTestUser();
    await expect(followUser(user.uid, user.uid)).rejects.toThrow(CannotFollowSelfError);
  });

  it("rejects following a user that doesn't exist", async () => {
    const follower = await createTestUser();
    await expect(followUser(follower.uid, "does-not-exist")).rejects.toThrow(UserNotFoundError);
  });
});

describe("unfollowUser", () => {
  it("removes the relationship and decrements both counters", async () => {
    const follower = await createTestUser();
    const followed = await createTestUser();
    await followUser(follower.uid, followed.uid);

    await unfollowUser(follower.uid, followed.uid);

    await expect(isFollowing(follower.uid, followed.uid)).resolves.toBe(false);
    await expect(getUserProfile(follower.uid)).resolves.toMatchObject({ followingCount: 0 });
    await expect(getUserProfile(followed.uid)).resolves.toMatchObject({ followerCount: 0 });
  });

  it("is idempotent - unfollowing twice never goes negative", async () => {
    const follower = await createTestUser();
    const followed = await createTestUser();
    await followUser(follower.uid, followed.uid);

    await unfollowUser(follower.uid, followed.uid);
    await unfollowUser(follower.uid, followed.uid);

    await expect(getUserProfile(follower.uid)).resolves.toMatchObject({ followingCount: 0 });
    await expect(getUserProfile(followed.uid)).resolves.toMatchObject({ followerCount: 0 });
  });
});

describe("getFollowingIds", () => {
  it("lists only the accounts this user actually follows", async () => {
    const follower = await createTestUser();
    const followedA = await createTestUser();
    const followedB = await createTestUser();
    const notFollowed = await createTestUser();

    await followUser(follower.uid, followedA.uid);
    await followUser(follower.uid, followedB.uid);

    const ids = await getFollowingIds(follower.uid);
    expect(new Set(ids)).toEqual(new Set([followedA.uid, followedB.uid]));
    expect(ids).not.toContain(notFollowed.uid);
  });
});
