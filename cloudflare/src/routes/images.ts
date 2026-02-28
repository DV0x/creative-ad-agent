import type { Env } from '../env.js';

/**
 * GET /images/{sessionId}/{filename}
 * Serve generated images from R2.
 * Images are stored at: users/{userId}/images/{sessionId}/{filename}
 */
export async function handleImageRequest(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  const url = new URL(request.url);
  // /images/{sessionId}/{filename} → strip leading /images/
  const path = url.pathname.replace('/images/', '');

  if (!path) {
    return Response.json({ success: false, error: 'Image path required' }, { status: 400 });
  }

  const key = `users/${userId}/images/${path}`;
  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  // Determine content type from filename
  const contentType = object.httpMetadata?.contentType || inferContentType(path);

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

function inferContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}
