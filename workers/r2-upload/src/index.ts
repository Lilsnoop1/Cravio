import type { R2Bucket } from "@cloudflare/workers-types";
export interface Env {
  BUCKET: R2Bucket;
  API_KEY: string;
  PUBLIC_BASE_URL: string;
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Upload (POST). Public reads go through cdn.craviopk.com, not this Worker.
    if (request.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    if (!env.API_KEY) {
      return json(500, { error: "API key not configured" });
    }

    const auth = request.headers.get("x-api-key");
    if (auth !== env.API_KEY) {
      return json(401, { error: "Unauthorized" });
    }

    const form = await request.formData();
    const file = form.get("file");
    const keyOverride = form.get("key");
    const contentTypeOverride = form.get("contentType");

    if (!(file instanceof File)) {
      return json(400, { error: "Missing file" });
    }

    const key =
      typeof keyOverride === "string" && keyOverride.length > 0
        ? keyOverride
        : `${Date.now()}-${crypto.randomUUID()}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, "_");

    const contentType =
      typeof contentTypeOverride === "string" && contentTypeOverride.length > 0
        ? contentTypeOverride
        : file.type || "application/octet-stream";

        const buffer = await file.arrayBuffer();

        await env.BUCKET.put(key, buffer, {
          httpMetadata: {
            contentType,
            cacheControl: "public, max-age=31536000, immutable",
          },
        });

    const publicBase = env.PUBLIC_BASE_URL || "";
    const publicUrl = publicBase.endsWith("/")
      ? `${publicBase}${key}`
      : `${publicBase}/${key}`;

    return json(200, { key, url: publicUrl });
  },
};

export default handler;

