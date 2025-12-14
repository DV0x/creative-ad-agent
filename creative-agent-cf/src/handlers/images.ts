/**
 * Images Handler
 *
 * GET /images/:sessionId/:filename - Serve images from R2 storage
 */

import type { Env } from "../index";

/**
 * Handle image serving from R2
 *
 * URL format: /images/:sessionId/:filename
 */
export async function handleImageRoute(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  // Only allow GET requests
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Parse path: /images/:sessionId/:filename
  const parts = url.pathname.split("/");

  // Handle different path formats
  // /images/sessionId/filename.png (3 parts after split)
  if (parts.length < 4) {
    return new Response("Invalid image path", { status: 400 });
  }

  const sessionId = parts[2];
  const filename = parts.slice(3).join("/"); // Handle nested paths

  if (!sessionId || !filename) {
    return new Response("Session ID and filename are required", { status: 400 });
  }

  // Construct R2 key
  const key = `images/${sessionId}/${filename}`;

  try {
    // Fetch from R2
    const object = await env.STORAGE.get(key);

    if (!object) {
      console.log(`[images] Not found: ${key}`);
      return new Response("Image not found", { status: 404 });
    }

    // Determine content type from filename
    const contentType = getContentType(filename);

    // Build response headers
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", object.etag);

    // Add CORS headers for cross-origin requests
    headers.set("Access-Control-Allow-Origin", "*");

    // If client sent If-None-Match, check for cache hit
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === object.etag) {
      return new Response(null, { status: 304, headers });
    }

    // Return the image
    return new Response(object.body, { headers });
  } catch (error) {
    console.error(`[images] Error serving ${key}:`, error);
    return new Response("Failed to serve image", { status: 500 });
  }
}

/**
 * Get content type from filename extension
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
  };

  return contentTypes[ext || ""] || "application/octet-stream";
}
