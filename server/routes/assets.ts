import { Router, Request, Response } from 'express';
import { authRequired, getUserId } from '../lib/auth.js';
import * as db from '../lib/db/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure multer for file uploads
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// All routes require authentication
router.use(authRequired);

// ============================================
// FOLDERS
// ============================================

/**
 * GET /api/assets/folders
 * List all folders for the user
 */
router.get('/folders', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const folders = db.getFoldersByUser(userId);

    // Include file counts for each folder
    const foldersWithCounts = folders.map((folder) => ({
      ...folder,
      fileCount: db.getFilesCount(folder.id),
    }));

    res.json({
      success: true,
      folders: foldersWithCounts,
    });
  } catch (error: any) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch folders',
    });
  }
});

/**
 * POST /api/assets/folders
 * Create a new folder
 */
router.post('/folders', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required',
      });
    }

    const folder = db.createFolder(userId, name);

    res.status(201).json({
      success: true,
      folder,
    });
  } catch (error: any) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create folder',
    });
  }
});

/**
 * PATCH /api/assets/folders/:id
 * Rename a folder
 */
router.patch('/folders/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name } = req.body;

    // Verify ownership
    const folder = db.getFolder(id, userId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required',
      });
    }

    db.renameFolder(id, name);

    const updated = db.getFolder(id, userId);

    res.json({
      success: true,
      folder: updated,
    });
  } catch (error: any) {
    console.error('Error renaming folder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to rename folder',
    });
  }
});

/**
 * DELETE /api/assets/folders/:id
 * Delete a folder and all its files
 */
router.delete('/folders/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    // Verify ownership
    const folder = db.getFolder(id, userId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found',
      });
    }

    // Delete physical files first
    const files = db.getFilesByFolder(id);
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Cascade: sweep this fileId out of every campaign's active reference set (D14)
      db.removeFileFromAllCampaigns(userId, file.id);
    }

    // Delete from database (cascades to files)
    db.deleteFolder(id);

    res.json({
      success: true,
      message: 'Folder deleted',
    });
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete folder',
    });
  }
});

/**
 * GET /api/assets/folders/:id/files
 * List all files in a folder
 */
router.get('/folders/:id/files', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    // Verify ownership
    const folder = db.getFolder(id, userId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found',
      });
    }

    const files = db.getFilesByFolder(id);

    res.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch files',
    });
  }
});

// ============================================
// FILES
// ============================================

/**
 * POST /api/assets/upload
 * Upload a file to a folder
 */
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: 'Folder ID is required',
      });
    }

    // Verify folder ownership
    const folder = db.getFolder(folderId, userId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        error: 'Folder not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Determine file type
    let fileType: 'image' | 'document' | 'other' = 'other';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (
      req.file.mimetype === 'application/pdf' ||
      req.file.mimetype.startsWith('text/')
    ) {
      fileType = 'document';
    }

    const file = db.addFile(
      folderId,
      req.file.originalname,
      req.file.filename,
      fileType,
      req.file.size
    );

    res.status(201).json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
});

/**
 * GET /api/assets/files/:id
 * Serve a file
 */
router.get('/files/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = db.getFile(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    const filePath = path.join(UPLOADS_DIR, file.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk',
      });
    }

    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to serve file',
    });
  }
});

/**
 * DELETE /api/assets/files/:id
 * Delete a file
 */
router.delete('/files/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const file = db.getFile(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Verify folder ownership (file belongs to user's folder)
    // Get folder to check ownership
    const folders = db.getFoldersByUser(userId);
    const ownsFolder = folders.some((f) => f.id === file.folder_id);

    if (!ownsFolder) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this file',
      });
    }

    // Delete physical file
    const filePath = path.join(UPLOADS_DIR, file.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.deleteAssetFile(id);

    // Cascade: remove this fileId from every campaign's active reference set (D14)
    db.removeFileFromAllCampaigns(userId, id);

    res.json({
      success: true,
      message: 'File deleted',
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file',
    });
  }
});

export default router;
