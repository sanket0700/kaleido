import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isOwnStorageUrl } from "@/lib/storage/validateStorageUrl";

const BUCKET = "demo-kaleido.appspot.com";
const UID = "uid123";

describe("isOwnStorageUrl", () => {
  let originalBucket: string | undefined;
  let originalEmulatorHost: string | undefined;

  beforeEach(() => {
    originalBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    originalEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = BUCKET;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = originalBucket;
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = originalEmulatorHost;
  });

  describe("against the emulator host", () => {
    beforeEach(() => {
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
    });

    it("accepts a URL under the caller's own path", () => {
      const url = `http://127.0.0.1:9199/v0/b/${BUCKET}/o/avatars%2F${UID}%2Fpic.jpg?alt=media&token=abc`;
      expect(isOwnStorageUrl(url, "avatars", UID)).toBe(true);
    });

    it("rejects another user's path", () => {
      const url = `http://127.0.0.1:9199/v0/b/${BUCKET}/o/avatars%2Fother-uid%2Fpic.jpg?alt=media`;
      expect(isOwnStorageUrl(url, "avatars", UID)).toBe(false);
    });

    it("rejects the wrong bucket", () => {
      const url = `http://127.0.0.1:9199/v0/b/some-other-bucket/o/avatars%2F${UID}%2Fpic.jpg?alt=media`;
      expect(isOwnStorageUrl(url, "avatars", UID)).toBe(false);
    });

    it("rejects the wrong path prefix (e.g. an avatar URL checked against posts/)", () => {
      const url = `http://127.0.0.1:9199/v0/b/${BUCKET}/o/posts%2F${UID}%2Fdraft%2Fpic.jpg?alt=media`;
      expect(isOwnStorageUrl(url, "avatars", UID)).toBe(false);
    });
  });

  it("rejects an external URL entirely", () => {
    const url = `https://evil.example.com/avatars%2F${UID}%2Fpic.jpg`;
    expect(isOwnStorageUrl(url, "avatars", UID)).toBe(false);
  });

  it("rejects a malformed URL without throwing", () => {
    expect(isOwnStorageUrl("not-a-url", "avatars", UID)).toBe(false);
  });

  it("rejects everything when the bucket env var isn't configured", () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const url = `http://127.0.0.1:9199/v0/b/${BUCKET}/o/avatars%2F${UID}%2Fpic.jpg?alt=media`;
    expect(isOwnStorageUrl(url, "avatars", UID)).toBe(false);
  });

  it("expects the production host when no emulator host is set", () => {
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    const prodUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/avatars%2F${UID}%2Fpic.jpg?alt=media`;
    const emulatorUrl = `http://127.0.0.1:9199/v0/b/${BUCKET}/o/avatars%2F${UID}%2Fpic.jpg?alt=media`;

    expect(isOwnStorageUrl(prodUrl, "avatars", UID)).toBe(true);
    expect(isOwnStorageUrl(emulatorUrl, "avatars", UID)).toBe(false);
  });
});
