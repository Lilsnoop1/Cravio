import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const region = process.env.R2_REGION || "auto";

if (!accessKeyId || !secretAccessKey || !endpoint) {
  console.warn("R2 configuration is missing. Uploads will fail until set.");
}

export const r2Client = new S3Client({
  region,
  endpoint,
  credentials: accessKeyId && secretAccessKey
    ? {
        accessKeyId,
        secretAccessKey,
      }
    : undefined,
});

