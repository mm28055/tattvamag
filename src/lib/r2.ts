// Cloudflare R2 (S3-compatible) upload helper.
// Used by the admin article upload route to persist cover images.
// Falls back to local-filesystem writes when R2 env vars aren't configured,
// so `npm run dev` still works without any Cloudflare setup.
import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
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
  // Content-hash suffix so replacing the cover gets a fresh URL. Without
  // this, the key stays `{slug}.{ext}` and Cloudflare's 1-year immutable
  // cache keeps serving the old image even after R2 is overwritten.
  const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 8);
  const filename = `${slug}-${hash}.${safeExt}`;

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

/** Generic R2 upload for the media library. Stores under media/YYYY/MM/<random>.<ext>.
 *  Returns the R2 key + public URL. Requires R2 to be configured — the dev-only
 *  filesystem fallback used by saveCoverImage is not supported here. */
export async function uploadMedia(opts: {
  buffer: Buffer;
  originalName: string;
  contentType?: string;
}): Promise<{ key: string; url: string }> {
  if (!hasR2) {
    throw new Error("R2 is not configured — set R2_* env vars to enable media uploads.");
  }
  const { buffer, originalName, contentType } = opts;
  const ext = (originalName.split(".").pop() || "jpg").toLowerCase();
  const safeExt = /^(jpg|jpeg|png|webp|gif|svg)$/i.test(ext) ? ext : "jpg";
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  // Random id — short but collision-safe enough for per-user frequency.
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const key = `media/${yyyy}/${mm}/${id}.${safeExt}`;
  await client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || mimeFromExt(safeExt),
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const url = `${R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  return { key, url };
}

/** Delete an object from R2 by its key. No-op when R2 isn't configured. */
export async function deleteMedia(key: string): Promise<void> {
  if (!hasR2) return;
  await client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

/** Public URL for a given R2 key — uses R2_PUBLIC_URL as the base. */
export function publicUrlForKey(key: string): string {
  if (!R2_PUBLIC_URL) return key;
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}
