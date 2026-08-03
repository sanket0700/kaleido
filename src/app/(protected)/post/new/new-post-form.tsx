"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPostImages, createPost } from "@/lib/data/postsClient";
import { MAX_CAPTION_LENGTH, MAX_IMAGES_PER_POST } from "@/lib/data/postLimits";
import { inputClass, primaryButtonClass } from "@/lib/ui/formClasses";

export function NewPostForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES_PER_POST);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError("Pick at least one image.");
      return;
    }

    setSubmitting(true);
    try {
      const imageURLs = await uploadPostImages(files);
      await createPost(imageURLs, caption);
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create post.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        New post
      </h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        <label className="cursor-pointer text-sm underline">
          {files.length > 0 ? `${files.length} image(s) selected` : "Choose images"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
        </label>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`Selected image ${i + 1}`}
                className="aspect-square w-full rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
        rows={4}
        className={inputClass}
      />
      <p className="text-right text-xs text-zinc-500">
        {caption.length}/{MAX_CAPTION_LENGTH}
      </p>

      <button
        type="submit"
        disabled={submitting || files.length === 0}
        className={primaryButtonClass}
      >
        {submitting ? "Posting..." : "Share"}
      </button>
    </form>
  );
}
