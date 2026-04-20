// Smoke test: upload a tiny file to R2 and fetch it back via the public URL.
// Usage: node scripts/test-r2.mjs
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config({ path: ".env.local" });

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
  console.error("Missing R2 env vars in .env.local");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const key = "smoke-test.txt";
const body = `r2 smoke test @ ${new Date().toISOString()}`;

console.log(`→ uploading to bucket "${R2_BUCKET}" as "${key}"...`);
await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: "text/plain" }));
console.log("  ✓ upload ok");

const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
console.log(`→ fetching ${publicUrl}`);
const res = await fetch(publicUrl);
const text = await res.text();
console.log(`  status: ${res.status}`);
console.log(`  body:   ${text}`);

if (res.ok && text === body) {
  console.log("\n✅ R2 end-to-end test passed.");
} else {
  console.error("\n❌ R2 end-to-end test FAILED.");
  process.exit(1);
}
