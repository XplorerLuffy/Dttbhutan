import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

/**
 * Image storage, behind one function so the provider is a single-file swap.
 *
 * Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production), local disk
 * otherwise (local dev, where nobody should need cloud credentials to work
 * on the site). Local disk was the only option before, and it silently lost
 * every uploaded photo on each redeploy — which is why no listing on the
 * live site has ever had an image that survived.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UnsupportedFileError extends Error {}
export class FileTooLargeError extends Error {}

export function usingBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Validates and stores an image, returning the URL to serve it from.
 *
 * `folder` groups uploads (e.g. "guides", "hotels") so the bucket stays
 * navigable rather than becoming one flat pile of UUIDs.
 */
export async function putImage(file: File, folder = "uploads"): Promise<{ url: string }> {
  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    throw new UnsupportedFileError("Unsupported file type. Use JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new FileTooLargeError("File is too large (max 5MB)");
  }

  const filename = `${randomUUID()}.${extension}`;

  if (usingBlobStorage()) {
    const blob = await put(`${folder}/${filename}`, file, {
      access: "public",
      contentType: file.type,
      // Filenames are already UUIDs, so Blob's own suffixing would only make
      // the URLs noisier without adding uniqueness.
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return { url: `/${folder}/${filename}` };
}
