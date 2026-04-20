// Cloudflare R2 (S3-compatible) upload helper.
// Used by the admin article upload route to persist cover images.
// Falls back to local-filesystem writes when R2 env vars aren't configured,
// so `npm run dev` still works without any Cloudflare setup.
import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "node:fs";
import path from "node:path";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

const R2_ACCOUNT_ID = env("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = env("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = env("R2_SECRET_ACCESS_KEY");
const R2_BUCKET = env("R2_BUCKET");
const R2_PUBLIC_URL = env("R2_PUBLIC_URL"); // e.g. https://pub-XXXX.r2.dev  OR  https://images.tattvamag.org

export const hasR2 = !!(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET &&
  R2_PUBLIC_URL
);

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
  return _client;
}

/**
 * Persist an uploaded cover image.
 *  - If R2 is configured → upload there; return the public https URL.
 *  - Otherwise            → write to public/images/featured/ (dev-only fallback);
 *                            return the relative /images/... path.
 */
export async function saveCoverImage(opts: {
  buffer: Buffer;
  slug: string;
  originalName: string;
  contentType?: string;
}): Promise<string> {
  const { buffer, slug, originalName, contentType } = opts;
  const ext = (originalName.split(".").pop() || "jpg").toLowerCase();
  const safeExt = /^(jpg|jpeg|png|webp)$/i.test(ext) ? ext : "jpg";
  const filename = `${slug}.${safeExt}`;

  if (hasR2) {
    const key = `featured/${filename}`;
    await client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || mimeFromExt(safeExt),
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  }

  // Dev fallback — local disk.
  const dir = path.join(process.cwd(), "public", "images", "featured");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/images/featured/${filename}`;
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}
