import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  FileTooLargeError,
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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const folder = typeof form?.get("folder") === "string" ? String(form.get("folder")) : "uploads";
  // Only allow a short allowlist through — this ends up in a storage path.
  const safeFolder = ["uploads", "guides", "hotels", "packages", "articles"].includes(folder)
    ? folder
    : "uploads";

  try {
    const { url } = await putImage(file, safeFolder);
    return NextResponse.json({ url, persistent: usingBlobStorage() }, { status: 201 });
  } catch (err) {
    if (err instanceof UnsupportedFileError || err instanceof FileTooLargeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[uploads] failed to store image", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
