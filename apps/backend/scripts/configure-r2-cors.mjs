/**
 * Apply browser-upload CORS rules to R2 buckets used for presigned PUT uploads.
 *
 * Usage (from apps/backend):
 *   node --env-file=.env scripts/configure-r2-cors.mjs
 */
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // --env-file may already have loaded values
  }
}

loadEnvFile(resolve(process.cwd(), '.env'));

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

const buckets = [
  process.env.R2_BUCKET_PROFILE_IMAGES,
  process.env.R2_BUCKET_POST_MEDIA,
].filter(Boolean);

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error(
    'Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY in apps/backend/.env',
  );
  process.exit(1);
}

if (buckets.length === 0) {
  console.error(
    'No buckets configured. Set R2_BUCKET_PROFILE_IMAGES and/or R2_BUCKET_POST_MEDIA.',
  );
  process.exit(1);
}

const allowedOrigins = Array.from(
  new Set([
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]),
);

const corsRules = [
  {
    AllowedOrigins: allowedOrigins,
    AllowedMethods: ['GET', 'PUT', 'HEAD'],
    AllowedHeaders: ['*'],
    ExposeHeaders: ['ETag'],
    MaxAgeSeconds: 3600,
  },
];

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

for (const bucket of buckets) {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: corsRules },
    }),
  );
  console.log(`CORS configured for bucket: ${bucket}`);
  console.log(`  AllowedOrigins: ${allowedOrigins.join(', ')}`);
}

console.log('Done. Retry the image upload in the app.');
