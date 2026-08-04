import { describe, expect, it } from "vitest";
import {
  addComment,
  createPost,
  getComments,
  getPost,
  getPostsByAuthors,
  likePost,
  PostNotFoundError,
  unlikePost,
} from "@/lib/data/posts";
import { getUserProfile } from "@/lib/data/users";
import { createTestUser } from "@/lib/data/__tests__/testHelpers";

describe("createPost", () => {
  it("creates the post and bumps the author's postCount in the same transaction", async () => {
    const author = await createTestUser();

    const postId = await createPost(author.uid, ["https://example.com/a.jpg"], "hello");

    const post = await getPost(postId);
    expect(post).toMatchObject({
      authorId: author.uid,
      caption: "hello",
      likeCount: 0,
      commentCount: 0,
    });

    const profile = await getUserProfile(author.uid);
    expect(profile?.postCount).toBe(1);
  });
});

describe("likePost / unlikePost", () => {
  it("is idempotent - repeated likes hold the count, don't keep incrementing it", async () => {
    const author = await createTestUser();
    const liker = await createTestUser();
    const postId = await createPost(author.uid, ["https://example.com/a.jpg"], "");

    const first = await likePost(postId, liker.uid);
    expect(first).toEqual({ liked: true, likeCount: 1 });

    const second = await likePost(postId, liker.uid);
    expect(second).toEqual({ liked: true, likeCount: 1 });

    const third = await likePost(postId, liker.uid);
    expect(third).toEqual({ liked: true, likeCount: 1 });
  });

  it("is idempotent - repeated unlikes hold at zero, never go negative", async () => {
    const author = await createTestUser();
    const liker = await createTestUser();
    const postId = await createPost(author.uid, ["https://example.com/a.jpg"], "");
    await likePost(postId, liker.uid);

    const first = await unlikePost(postId, liker.uid);
    expect(first).toEqual({ liked: false, likeCount: 0 });

    const second = await unlikePost(postId, liker.uid);
    expect(second).toEqual({ liked: false, likeCount: 0 });
  });

  it("throws PostNotFoundError for a post that doesn't exist", async () => {
    const liker = await createTestUser();
    await expect(likePost("does-not-exist", liker.uid)).rejects.toThrow(PostNotFoundError);
    await expect(unlikePost("does-not-exist", liker.uid)).rejects.toThrow(PostNotFoundError);
  });
});

describe("addComment", () => {
  it("creates the comment and bumps the post's commentCount", async () => {
    const author = await createTestUser();
    const commenter = await createTestUser();
    const postId = await createPost(author.uid, ["https://example.com/a.jpg"], "");

    await addComment(postId, commenter.uid, "nice photo");

    const post = await getPost(postId);
    expect(post?.commentCount).toBe(1);

    const comments = await getComments(postId);
    expect(comments).toHaveLength(1);
    expect(comments[0]).toMatchObject({ authorId: commenter.uid, text: "nice photo" });
  });

  it("throws PostNotFoundError for a post that doesn't exist", async () => {
    const commenter = await createTestUser();
    await expect(addComment("does-not-exist", commenter.uid, "x")).rejects.toThrow(
      PostNotFoundError,
    );
  });
});

describe("getPostsByAuthors", () => {
  it("returns an empty array without querying when given no authors", async () => {
    await expect(getPostsByAuthors([])).resolves.toEqual([]);
  });

  it("only returns posts from the requested authors, newest first", async () => {
    const authorA = await createTestUser();
    const authorB = await createTestUser();
    const outsider = await createTestUser();

    const postA = await createPost(authorA.uid, ["https://example.com/a.jpg"], "from A");
    await new Promise((resolve) => setTimeout(resolve, 50)); // ensure a distinct createdAt
    const postB = await createPost(authorB.uid, ["https://example.com/b.jpg"], "from B");
    const outsiderPost = await createPost(outsider.uid, ["https://example.com/c.jpg"], "from outsider");

    const posts = await getPostsByAuthors([authorA.uid, authorB.uid]);
    const ids = posts.map((p) => p.id);

    expect(ids).toContain(postA);
    expect(ids).toContain(postB);
    expect(ids).not.toContain(outsiderPost);
    // newest (B) before older (A)
    expect(ids.indexOf(postB)).toBeLessThan(ids.indexOf(postA));
  });
});
