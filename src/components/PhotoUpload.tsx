"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * One file input handles both flows: on mobile, `accept="image/*"` plus
 * `capture` prompts most browsers to offer "Take photo" alongside "Choose
 * from library" / "Files" in the same native picker (exact behavior is
 * browser-dependent — some launch the camera directly). Desktop browsers
 * ignore `capture` and just open a normal file picker. There is no
 * standards-based way to force a picker with both options every time; this
 * is the closest single-control approach that works across mobile
 * platforms without a fragile custom `getUserMedia` camera UI.
 */
export default function PhotoUpload({
  label = "Photo",
  initialUrl,
  onUploaded,
}: {
  label?: string;
  initialUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/uploads", { method: "POST", body: form });
    setIsUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }

    const data = await res.json();
    onUploaded(data.url);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        {preview ? (
          <Image
            src={preview}
            alt="Preview"
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-xs text-stone-400">
            No photo
          </div>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="btn-secondary"
          >
            {isUploading ? "Uploading..." : preview ? "Change photo" : "Take or upload photo"}
          </button>
          <p className="mt-1 text-xs text-stone-400">
            Your device will offer to take a new photo or choose one from your gallery.
          </p>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
