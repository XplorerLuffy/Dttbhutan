import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { usingBlobStorage } from "@/lib/storage";

/**
 * Lets an admin upload a video straight from the browser to Vercel Blob.
 *
 * Images go through /api/uploads, but a function request body is capped at
 * about 4.5 MB, far below a hero clip. So the browser asks here only for a
 * short-lived upload token and then sends the file itself, never through the
 * site's server. The token is issued to admins only, for one file under
 * site/video/, of a video type, up to MAX_VIDEO_BYTES.
 */
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!usingBlobStorage()) {
    return NextResponse.json(
      { error: "Uploads aren't switched on yet: connect a Vercel Blob store to this project." },
      { status: 503 }
    );
  }
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        if (!user || user.role !== "ADMIN") throw new Error("Only an admin can upload a video.");
        if (!/^site\/video\/[A-Za-z0-9._-]+$/.test(pathname)) throw new Error("Unexpected upload location.");
        return {
          allowedContentTypes: ["video/mp4", "video/webm"],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
}
