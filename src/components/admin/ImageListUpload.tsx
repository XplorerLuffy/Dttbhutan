"use client";

import { useRef, useState } from "react";

export type ImageItem = { url: string; caption?: string };

type Folder = "uploads" | "guides" | "hotels" | "packages" | "articles";

/**
 * Photos an admin adds by uploading — several at once — instead of pasting
 * URLs one by one. With `max={1}` it is a single-photo picker whose upload
 * replaces the current photo.
 *
 * Order matters wherever the first photo is special (an article's cover, the
 * large cell of a trip gallery), so photos can be moved, and `leadLabel`
 * badges the first one. Pasting a link is still offered for images already
 * on the site (the /media/... library) or hosted elsewhere.
 *
 * Files are uploaded one at a time through /api/uploads, so one bad file
 * doesn't sink the rest — each failure is reported by name. Big photos are
 * shrunk in the browser first: straight off a phone they are often larger
 * than the 4.5 MB a Vercel function accepts per request, and far larger than
 * a web page needs.
 */
export default function ImageListUpload({
  images,
  onChange,
  folder = "uploads",
  max = 30,
  label = "Photos",
  hint,
  leadLabel,
  captions = false,
  action,
  aspect = "aspect-[4/3]",
}: {
  images: ImageItem[];
  onChange: (next: ImageItem[]) => void;
  /** Storage folder — must be one /api/uploads allows. */
  folder?: Folder;
  max?: number;
  label?: string;
  hint?: string;
  /** Badge for the first photo, e.g. "Cover". Also adds a "Make first" button. */
  leadLabel?: string;
  captions?: boolean;
  /** An extra per-photo button, e.g. "Use as cover". */
  action?: { label: string; run: (url: string) => void };
  /** Thumbnail shape — match where the photo is shown, so bad crops show here. */
  aspect?: string;
}) {
  const single = max === 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState("");

  // `images` is a prop and stays as it was while the uploads run one after
  // another; this tracks the list as it grows so each upload adds to the last.
  const latest = useRef(images);
  latest.current = images;

  async function uploadFiles(files: File[]) {
    const room = single ? 1 : max - latest.current.length;
    const chosen = files.slice(0, Math.max(0, room));
    if (inputRef.current) inputRef.current.value = "";
    if (chosen.length === 0) return;
    setErrors([]);

    const failed: string[] = [];
    let list = single ? [] : latest.current;
    for (let i = 0; i < chosen.length; i++) {
      const file = chosen[i];
      setProgress({ current: i + 1, total: chosen.length });
      const result = await uploadOne(file, folder);
      if ("url" in result) {
        list = [...list, { url: result.url, caption: "" }];
        onChange(list);
      } else {
        failed.push(`${file.name}: ${result.error}`);
      }
    }

    if (files.length > chosen.length) {
      failed.push(`Only ${max} photos allowed — ${files.length - chosen.length} not added.`);
    }
    setErrors(failed);
    setProgress(null);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function addLink() {
    const url = linkDraft.trim();
    if (!url) return;
    if (single) onChange([{ url, caption: "" }]);
    else if (images.length < max && !images.some((img) => img.url === url)) {
      onChange([...images, { url, caption: "" }]);
    }
    setLinkDraft("");
  }

  const full = !single && images.length >= max;
  const buttonLabel = progress
    ? progress.total > 1
      ? `Uploading ${progress.current} of ${progress.total}…`
      : "Uploading…"
    : single
      ? images.length
        ? "Replace photo"
        : "Upload photo"
      : images.length
        ? "Upload more photos"
        : "Upload photos";

  return (
    <div>
      {(label || !single) && (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-medium">{label}</span>
          {!single && (
            <span className="text-xs text-stone-500">
              {images.length} of {max}
            </span>
          )}
        </div>
      )}
      {hint && <p className="mb-3 text-sm text-stone-600">{hint}</p>}

      {images.length > 0 && (
        <ul
          className={
            single
              ? "mb-3 max-w-sm"
              : "mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          }
        >
          {images.map((img, i) => (
            <li
              key={`${img.url}-${i}`}
              className="overflow-hidden rounded-lg border border-stone-200 bg-white"
            >
              <div className={`relative ${aspect} bg-stone-100`}>
                {/* Admin-chosen URLs, which may be on hosts next/image rejects. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {leadLabel && i === 0 && !single && (
                  <span className="absolute left-2 top-2 rounded bg-brand-900/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {leadLabel}
                  </span>
                )}
              </div>

              {captions && (
                <input
                  value={img.caption ?? ""}
                  onChange={(e) =>
                    onChange(
                      images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x))
                    )
                  }
                  placeholder="Caption (optional)"
                  maxLength={200}
                  className="block w-full border-0 border-t border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-500"
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-1 border-t border-stone-100 p-1.5 text-xs">
                {!single && (
                  <div className="flex">
                    <IconButton label="Move earlier" onClick={() => move(i, i - 1)} disabled={i === 0}>
                      ←
                    </IconButton>
                    <IconButton
                      label="Move later"
                      onClick={() => move(i, i + 1)}
                      disabled={i === images.length - 1}
                    >
                      →
                    </IconButton>
                  </div>
                )}
                <div className="ml-auto flex flex-wrap justify-end gap-1">
                  {leadLabel && !single && i !== 0 && (
                    <TextButton onClick={() => move(i, 0)}>Make {leadLabel.toLowerCase()}</TextButton>
                  )}
                  {action && <TextButton onClick={() => action.run(img.url)}>{action.label}</TextButton>}
                  <TextButton danger onClick={() => onChange(images.filter((_, j) => j !== i))}>
                    Remove
                  </TextButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={!single}
          className="hidden"
          onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null || full}
          className="btn-secondary"
        >
          {buttonLabel}
        </button>
        <span className="text-xs text-stone-500">
          {single ? "JPEG, PNG, WebP or GIF" : "Pick several at once · JPEG, PNG, WebP or GIF"}
        </span>
      </div>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-700">
          Or use an image link instead
        </summary>
        <div className="mt-2 flex gap-2">
          <input
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="https://… or /media/…"
            className="input min-w-0 flex-1 text-sm"
          />
          <button
            type="button"
            onClick={addLink}
            disabled={!linkDraft.trim() || full}
            className="btn-secondary shrink-0"
          >
            Add
          </button>
        </div>
      </details>

      {errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-0.5 text-sm text-red-600">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded px-2 py-1 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function TextButton({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 font-medium ${
        danger ? "text-red-600 hover:bg-red-50" : "text-brand-700 hover:bg-brand-50"
      }`}
    >
      {children}
    </button>
  );
}

async function uploadOne(file: File, folder: Folder): Promise<{ url: string } | { error: string }> {
  const form = new FormData();
  form.append("file", await shrinkForWeb(file));
  form.append("folder", folder);
  try {
    const res = await fetch("/api/uploads", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && data.url) return { url: data.url };
    if (res.status === 401 || res.status === 403) {
      return { error: "your session has expired — log in again" };
    }
    if (res.status === 413) return { error: "the file is too large" };
    return { error: data.error ?? `upload failed (error ${res.status})` };
  } catch (err) {
    return {
      error:
        err instanceof DOMException && err.name === "TimeoutError"
          ? "the upload took too long — check your connection"
          : "couldn't reach the server",
    };
  }
}

const MAX_EDGE = 2400;
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;

/**
 * Re-encodes a large photo as a JPEG no wider or taller than MAX_EDGE — plenty
 * for a full-width banner on a high-density screen, and typically a few
 * hundred KB. Small files, GIFs (which may be animated) and anything the
 * browser can't decode are sent as they are.
 */
async function shrinkForWeb(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size <= SHRINK_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG has no transparency; white is what a transparent PNG shows on the page.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
