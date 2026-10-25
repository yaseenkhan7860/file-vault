import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';
import { File } from '../models/File';
import { Room } from '../models/Room';
import { uploadFileToStorage, deleteFileFromStorage, openDownloadStream } from '../services/storageService';
import mongoose from 'mongoose';

const router = Router();

// Store uploads in memory then stream to database/storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB limit
});

// GET /api/files — list files in the authenticated room
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const files = await File.find({ roomId: new mongoose.Types.ObjectId(req.roomId) })
    .sort({ uploadedAt: -1 });

  res.json({ files });
});

// POST /api/files/upload — upload a file
router.post('/upload', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const room = await Room.findById(req.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const { fileId, downloadUrl } = await uploadFileToStorage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    room.label
  );

  const newFile = await File.create({
    roomId: new mongoose.Types.ObjectId(req.roomId),
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    driveFileId: fileId,
    driveDownloadUrl: downloadUrl,
  });

  // Update room stats
  await Room.findByIdAndUpdate(req.roomId, {
    $inc: { fileCount: 1, totalBytes: req.file.size },
  });

  res.status(201).json({ file: newFile });
});

// GET /api/files/:id/download — return the streaming download URL metadata
router.get('/:id/download', requireAuth, async (req: AuthRequest, res: Response) => {
  const file = await File.findOne({
    _id: req.params.id,
    roomId: new mongoose.Types.ObjectId(req.roomId),
  });

  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  // Download URL relative to backend
  const downloadUrl = `/api/files/${file._id}/stream`;

  res.json({
    downloadUrl,
    fileName: file.fileName,
    sizeBytes: file.sizeBytes,
    mimeType: file.mimeType,
  });
});

// GET /api/files/:id/stream — stream file binary with Content-Length for accurate real-time progress
router.get('/:id/stream', async (req, res: Response) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', file.sizeBytes.toString());
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
  res.setHeader('Accept-Ranges', 'bytes');

  const downloadStream = openDownloadStream(file.driveFileId);
  downloadStream.on('error', (err) => {
    console.error('Download stream error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
  });

  downloadStream.pipe(res);
});

// DELETE /api/files/:id — delete from storage and room metadata
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const file = await File.findOne({
    _id: req.params.id,
    roomId: new mongoose.Types.ObjectId(req.roomId),
  });

  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  try {
    await deleteFileFromStorage(file.driveFileId);
  } catch (err) {
    console.warn('Could not delete binary:', err);
  }

  // Update room stats
  await Room.findByIdAndUpdate(req.roomId, {
    $inc: { fileCount: -1, totalBytes: -file.sizeBytes },
  });

  // Remove from database
  await File.findByIdAndDelete(file._id);

  res.json({ message: 'File deleted successfully' });
});

export default router;
