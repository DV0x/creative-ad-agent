import { db, generateId } from '../database.js';

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

export function getFoldersByUser(userId: string): AssetFolder[] {
  return db.prepare(`
    SELECT * FROM asset_folders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as AssetFolder[];
}

export function getFolder(id: string, userId: string): AssetFolder | undefined {
  return db.prepare(`
    SELECT * FROM asset_folders
    WHERE id = ? AND user_id = ?
  `).get(id, userId) as AssetFolder | undefined;
}

export function createFolder(userId: string, name: string): AssetFolder {
  const id = generateId('folder');

  db.prepare(`
    INSERT INTO asset_folders (id, user_id, name)
    VALUES (?, ?, ?)
  `).run(id, userId, name);

  return getFolder(id, userId)!;
}

export function renameFolder(id: string, name: string): void {
  db.prepare(`
    UPDATE asset_folders
    SET name = ?
    WHERE id = ?
  `).run(name, id);
}

export function deleteFolder(id: string): void {
  db.prepare(`
    DELETE FROM asset_folders
    WHERE id = ?
  `).run(id);
}

// Files

export function getFilesByFolder(folderId: string): AssetFile[] {
  return db.prepare(`
    SELECT * FROM asset_files
    WHERE folder_id = ?
    ORDER BY created_at DESC
  `).all(folderId) as AssetFile[];
}

export function getFile(id: string): AssetFile | undefined {
  return db.prepare(`
    SELECT * FROM asset_files
    WHERE id = ?
  `).get(id) as AssetFile | undefined;
}

export function addFile(
  folderId: string,
  name: string,
  filePath: string,
  fileType: AssetFile['file_type'],
  size?: number
): AssetFile {
  const id = generateId('file');

  db.prepare(`
    INSERT INTO asset_files (id, folder_id, name, file_path, file_type, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, folderId, name, filePath, fileType, size ?? null);

  return getFile(id)!;
}

export function deleteFile(id: string): void {
  db.prepare(`
    DELETE FROM asset_files
    WHERE id = ?
  `).run(id);
}

export function getFilesCount(folderId: string): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM asset_files
    WHERE folder_id = ?
  `).get(folderId) as { count: number };

  return result.count;
}
