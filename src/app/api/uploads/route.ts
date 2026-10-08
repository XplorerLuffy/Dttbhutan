import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import {
  FileTooLargeError,
  StorageNotConfiguredError,
  UnsupportedFileError,
  putImage,
  usingBlobStorage,
} from "@/lib/storage";

/**
 * Accepts an image upload and returns its public URL.
 *
 * Storage provider is decided in src/lib/storage.ts — Vercel Blob in
 * production, local disk in dev.
 */

/** Signed-out visitors may upload only to `applications` — the photo on a guide
 * application, made before any account exists — and only a few at a time. */
const anonymousLimited = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const folder = typeof form?.get("folder") === "string" ? String(form.get("folder")) : "uploads";
  // Only allow a short allowlist through — this ends up in a storage path.
  const safeFolder = ["uploads", "guides", "hotels", "packages", "articles", "applications"].includes(folder)
    ? folder
    : "uploads";

  if (!user) {
    if (safeFolder !== "applications") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (anonymousLimited(clientIp(req))) {
      return NextResponse.json(
        { error: "Too many uploads from this connection. Please try again later." },
        { status: 429 }
      );
    }
  }

  try {
    const { url } = await putImage(file, safeFolder);
    return NextResponse.json({ url, persistent: usingBlobStorage() }, { status: 201 });
  } catch (err) {
    if (err instanceof UnsupportedFileError || err instanceof FileTooLargeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof StorageNotConfiguredError) {
      console.error("[uploads]", err.message);
      return NextResponse.json(
        {
          error:
            "Photo uploads aren't switched on yet on this site. You can continue without a photo and add one later.",
        },
        { status: 503 }
      );
    }
    console.error("[uploads] failed to store image", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
