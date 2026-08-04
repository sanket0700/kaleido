import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

// This suite is deliberately separate from posts.test.ts / follows.test.ts /
// users.test.ts: those exercise the Admin SDK, which bypasses security
// rules entirely (that's the whole point of routing every write through a
// server Route Handler). This file is the one place that actually drives
// the client SDK directly, the same way an attacker bypassing the app
// would - it's testing what firestore.rules/storage.rules say, not what
// the app's own code does.
const rootDir = fileURLToPath(new URL("../../../../", import.meta.url));

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-kaleido",
    firestore: {
      rules: readFileSync(`${rootDir}firestore.rules`, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
    storage: {
      rules: readFileSync(`${rootDir}storage.rules`, "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("firestore.rules", () => {
  it("allows an authenticated user to read", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "users/alice")));
  });

  it("denies reads with no auth at all", async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), "users/alice")));
  });

  it("denies a direct client write to users/{uid}, even by the doc's own owner", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(setDoc(doc(alice.firestore(), "users/alice"), { displayName: "Hacked" }));
  });

  it("denies direct client writes to posts, likes, comments, follows, and usernames", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const db = alice.firestore();
    await assertFails(setDoc(doc(db, "posts/p1"), { caption: "x" }));
    await assertFails(setDoc(doc(db, "posts/p1/likes/alice"), {}));
    await assertFails(setDoc(doc(db, "posts/p1/comments/c1"), { text: "x" }));
    await assertFails(setDoc(doc(db, "follows/alice_bob"), {}));
    await assertFails(setDoc(doc(db, "usernames/alice"), { uid: "alice" }));
  });
});

describe("storage.rules", () => {
  const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

  it("allows uploading to your own avatar path", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const fileRef = ref(alice.storage(), "avatars/alice/pic.jpg");
    await assertSucceeds(uploadBytes(fileRef, jpegBytes, { contentType: "image/jpeg" }));
  });

  it("denies uploading to someone else's avatar path", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const fileRef = ref(alice.storage(), "avatars/bob/pic.jpg");
    await assertFails(uploadBytes(fileRef, jpegBytes, { contentType: "image/jpeg" }));
  });

  it("denies a non-image content type, even on your own path", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const fileRef = ref(alice.storage(), "avatars/alice/notes.txt");
    await assertFails(
      uploadBytes(fileRef, new TextEncoder().encode("hello"), { contentType: "text/plain" }),
    );
  });

  it("denies uploads with no auth at all", async () => {
    const anon = testEnv.unauthenticatedContext();
    const fileRef = ref(anon.storage(), "avatars/alice/pic.jpg");
    await assertFails(uploadBytes(fileRef, jpegBytes, { contentType: "image/jpeg" }));
  });
});
