import { generateId } from './utils.js';

export interface AssetFolder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface AssetFile {
  id: string;
  folder_id: string;
  name: string;
  file_path: string;
  file_type: 'image' | 'document' | 'other';
  size: number | null;
  created_at: string;
}

// Folders

export async function getFoldersByUser(db: D1Database, userId: string): Promise<AssetFolder[]> {
  const result = await db.prepare(`
    SELECT * FROM asset_folders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all<AssetFolder>();
  return result.results;
}

export async function getFolder(db: D1Database, id: string, userId: string): Promise<AssetFolder | null> {
  return await db.prepare(`
    SELECT * FROM asset_folders
    WHERE id = ? AND user_id = ?
  `).bind(id, userId).first<AssetFolder>();
}

export async function createFolder(db: D1Database, userId: string, name: string): Promise<AssetFolder> {
  const id = generateId('folder');

  await db.prepare(`
    INSERT INTO asset_folders (id, user_id, name)
    VALUES (?, ?, ?)
  `).bind(id, userId, name).run();

  return (await getFolder(db, id, userId))!;
}

export async function renameFolder(db: D1Database, id: string, name: string): Promise<void> {
  await db.prepare(`
    UPDATE asset_folders SET name = ? WHERE id = ?
  `).bind(name, id).run();
}

export async function deleteFolder(db: D1Database, id: string): Promise<void> {
  await db.prepare(`
    DELETE FROM asset_folders WHERE id = ?
  `).bind(id).run();
}

// Files

export async function getFilesByFolder(db: D1Database, folderId: string): Promise<AssetFile[]> {
  const result = await db.prepare(`
    SELECT * FROM asset_files
    WHERE folder_id = ?
    ORDER BY created_at DESC
  `).bind(folderId).all<AssetFile>();
  return result.results;
}

export async function getFile(db: D1Database, id: string): Promise<AssetFile | null> {
  return await db.prepare(`
    SELECT * FROM asset_files WHERE id = ?
  `).bind(id).first<AssetFile>();
}

export async function addFile(
  db: D1Database,
  folderId: string,
  name: string,
  filePath: string,
  fileType: AssetFile['file_type'],
  size?: number
): Promise<AssetFile> {
  const id = generateId('file');

  await db.prepare(`
    INSERT INTO asset_files (id, folder_id, name, file_path, file_type, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, folderId, name, filePath, fileType, size ?? null).run();

  return (await getFile(db, id))!;
}

export async function deleteFile(db: D1Database, id: string): Promise<void> {
  await db.prepare(`
    DELETE FROM asset_files WHERE id = ?
  `).bind(id).run();
}

export async function getFilesCount(db: D1Database, folderId: string): Promise<number> {
  const result = await db.prepare(`
    SELECT COUNT(*) as count
    FROM asset_files
    WHERE folder_id = ?
  `).bind(folderId).first<{ count: number }>();
  return result?.count ?? 0;
}
