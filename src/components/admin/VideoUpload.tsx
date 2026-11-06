"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

const MAX_BYTES = 80 * 1024 * 1024;
const TYPES = ["video/mp4", "video/webm"];

/**
 * One video: upload a file (sent straight to storage, so it can be far larger
 * than a photo) or paste a link. Shows the current clip so a wrong one is
 * obvious before saving.
 */
export default function VideoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");

  async function pick(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Use an MP4 or WebM video.");
    if (file.size > MAX_BYTES) return setError(`That video is ${(file.size / 1048576).toFixed(0)} MB; the limit is 80 MB. A hero clip works best under 15 MB.`);
    setProgress(0);
    try {
      const ext = file.type === "video/webm" ? "webm" : "mp4";
      const blob = await upload(`site/video/hero.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads/video",
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      onChange(blob.url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /not authori|admin/i.test(msg)
          ? "Your session has expired. Log in again."
          : msg || "The upload didn't finish. Check your connection and try again."
      );
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <video key={value} src={value} controls muted playsInline preload="metadata" className="aspect-video w-full max-w-sm rounded-lg border border-stone-200 bg-black" />
      ) : (
        <p className="rounded-lg bg-stone-50 px-3 py-6 text-center text-sm text-stone-500">No video yet.</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <input ref={inputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" disabled={progress !== null} onClick={() => inputRef.current?.click()} className="btn-secondary">
          {progress !== null ? `Uploading… ${progress}%` : value ? "Replace video" : "Upload video"}
        </button>
        <span className="text-xs text-stone-500">MP4 or WebM, up to 80 MB</span>
      </div>
      {progress !== null && (
        <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-brand-700 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-700">Or use a video link instead</summary>
        <div className="mt-2 flex gap-2">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://… or /media/…" className="input min-w-0 flex-1 text-sm" />
          <button
            type="button"
            disabled={!link.trim()}
            onClick={() => {
              onChange(link.trim());
              setLink("");
            }}
            className="btn-secondary shrink-0"
          >
            Use link
          </button>
        </div>
      </details>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
