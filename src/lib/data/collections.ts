// No "server-only" guard - just string constants. Single source of truth
// for Firestore collection/subcollection names, instead of the same
// string literals scattered (and re-typo-able) across users.ts, posts.ts,
// and follows.ts.
export const COLLECTIONS = {
  users: "users",
  usernames: "usernames",
  posts: "posts",
  follows: "follows",
} as const;

export const SUBCOLLECTIONS = {
  likes: "likes",
  comments: "comments",
} as const;
