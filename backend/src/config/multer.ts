/**
 * Multer Configuration — File Upload Handling
 * Organized storage with type validation and size limits
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from './env';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['attachments', 'imports', 'templates', 'avatars'];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(env.UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/**
 * Create storage engine for a specific upload type
 */
const createStorage = (subDir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(env.UPLOAD_DIR, subDir));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });

/**
 * File filter for allowed MIME types
 */
const fileFilter = (allowedTypes: string[]) => {
  return (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: ${allowedTypes.join(', ')}`));
    }
  };
};

// Attachment upload config (PDF, images, DOCX, ZIP)
export const attachmentUpload = multer({
  storage: createStorage('attachments'),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: fileFilter([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
  ]),
});

// Import upload config (Excel, CSV)
export const importUpload = multer({
  storage: createStorage('imports'),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: fileFilter([
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
});

// Avatar upload config
export const avatarUpload = multer({
  storage: createStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});
