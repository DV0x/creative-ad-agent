import type { Env } from '../env.js';
import * as db from '../db/index.js';

/**
 * Asset management routes — ported from server/routes/assets.ts.
 * Files stored in R2 instead of local disk.
 * Uploads use Web API FormData instead of multer.
 */

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================
// FOLDERS
// ============================================

/** GET /api/assets/folders — List all folders with file counts */
export async function listFolders(env: Env, userId: string): Promise<Response> {
  try {
    const folders = await db.getFoldersByUser(env.DB, userId);

    // Fetch file counts in parallel
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => ({
        ...folder,
        fileCount: await db.getFilesCount(env.DB, folder.id),
      })),
    );

    return Response.json({ success: true, folders: foldersWithCounts });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch folders' },
      { status: 500 },
    );
  }
}

/** POST /api/assets/folders — Create a folder */
export async function createFolder(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  try {
    const body = (await request.json()) as { name?: string };
    if (!body.name) {
      return Response.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 },
      );
    }

    const folder = await db.createFolder(env.DB, userId, body.name);
    return Response.json({ success: true, folder }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to create folder' },
      { status: 500 },
    );
  }
}

/** PATCH /api/assets/folders/:id — Rename a folder */
export async function renameFolder(
  request: Request,
  env: Env,
  userId: string,
  folderId: string,
): Promise<Response> {
  try {
    const folder = await db.getFolder(env.DB, folderId, userId);
    if (!folder) {
      return Response.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    const body = (await request.json()) as { name?: string };
    if (!body.name) {
      return Response.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 },
      );
    }

    await db.renameFolder(env.DB, folderId, body.name);
    const updated = await db.getFolder(env.DB, folderId, userId);
    return Response.json({ success: true, folder: updated });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to rename folder' },
      { status: 500 },
    );
  }
}

/** DELETE /api/assets/folders/:id — Delete folder and files (R2 + D1) */
export async function deleteFolder(
  env: Env,
  userId: string,
  folderId: string,
): Promise<Response> {
  try {
    const folder = await db.getFolder(env.DB, folderId, userId);
    if (!folder) {
      return Response.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    // Delete R2 objects for all files in folder
    const files = await db.getFilesByFolder(env.DB, folderId);
    if (files.length > 0) {
      const keys = files.map((f) => `users/${userId}/uploads/${f.file_path}`);
      // R2 delete supports batch up to 1000 keys
      await env.R2_BUCKET.delete(keys);
    }

    // Delete from DB (CASCADE deletes file rows)
    await db.deleteFolder(env.DB, folderId);
    return Response.json({ success: true, message: 'Folder deleted' });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to delete folder' },
      { status: 500 },
    );
  }
}

/** GET /api/assets/folders/:id/files — List files in a folder */
export async function listFolderFiles(
  env: Env,
  userId: string,
  folderId: string,
): Promise<Response> {
  try {
    const folder = await db.getFolder(env.DB, folderId, userId);
    if (!folder) {
      return Response.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    const files = await db.getFilesByFolder(env.DB, folderId);
    return Response.json({ success: true, files });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch files' },
      { status: 500 },
    );
  }
}

// ============================================
// FILES
// ============================================

/** POST /api/assets/upload — Upload a file to R2 and record in D1 */
export async function uploadFile(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string | null;

    if (!folderId) {
      return Response.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 },
      );
    }

    const folder = await db.getFolder(env.DB, folderId, userId);
    if (!folder) {
      return Response.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIMES.has(file.type)) {
      return Response.json(
        { success: false, error: `File type ${file.type} not allowed` },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: 'File too large. Maximum size is 10MB' },
        { status: 400 },
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || '';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext ? '.' + ext : ''}`;

    // Upload to R2
    const r2Key = `users/${userId}/uploads/${uniqueName}`;
    await env.R2_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    // Determine file type category
    let fileType: 'image' | 'document' | 'other' = 'other';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
      fileType = 'document';
    }

    // Record in D1 (file_path stores the unique filename, not full R2 key)
    const record = await db.addFile(env.DB, folderId, file.name, uniqueName, fileType, file.size);

    return Response.json({ success: true, file: record }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 },
    );
  }
}

/** GET /api/assets/files/:id — Serve a file from R2 */
export async function serveFile(
  env: Env,
  userId: string,
  fileId: string,
): Promise<Response> {
  try {
    const file = await db.getFile(env.DB, fileId);
    if (!file) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const r2Key = `users/${userId}/uploads/${file.file_path}`;
    const object = await env.R2_BUCKET.get(r2Key);
    if (!object) {
      return Response.json({ success: false, error: 'File not found in storage' }, { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.name}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to serve file' },
      { status: 500 },
    );
  }
}

/** DELETE /api/assets/files/:id — Delete file from R2 and D1 */
export async function deleteFile(
  env: Env,
  userId: string,
  fileId: string,
): Promise<Response> {
  try {
    const file = await db.getFile(env.DB, fileId);
    if (!file) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    // Verify folder ownership
    const folders = await db.getFoldersByUser(env.DB, userId);
    const ownsFolder = folders.some((f) => f.id === file.folder_id);
    if (!ownsFolder) {
      return Response.json(
        { success: false, error: 'Not authorized to delete this file' },
        { status: 403 },
      );
    }

    // Delete from R2
    const r2Key = `users/${userId}/uploads/${file.file_path}`;
    await env.R2_BUCKET.delete(r2Key);

    // Delete from D1
    await db.deleteAssetFile(env.DB, fileId);

    return Response.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to delete file' },
      { status: 500 },
    );
  }
}
