import mongoose from 'mongoose';
import { Readable } from 'stream';

let bucket: mongoose.mongo.GridFSBucket | null = null;

export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'vault_files' });
  }
  return bucket;
}

export async function uploadFileToStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  _roomLabel: string
): Promise<{ fileId: string; downloadUrl: string }> {
  const gfs = getGridFSBucket();
  const readable = Readable.from(fileBuffer);
  const uploadStream = gfs.openUploadStream(fileName, {
    contentType: mimeType,
  });

  return new Promise((resolve, reject) => {
    readable
      .pipe(uploadStream)
      .on('finish', () => {
        const fileId = uploadStream.id.toString();
        // downloadUrl points to our streaming download endpoint
        const downloadUrl = `/api/files/${fileId}/stream`;
        resolve({ fileId, downloadUrl });
      })
      .on('error', (err) => reject(err));
  });
}

export async function deleteFileFromStorage(fileId: string): Promise<void> {
  const gfs = getGridFSBucket();
  await gfs.delete(new mongoose.Types.ObjectId(fileId));
}

export function openDownloadStream(fileId: string) {
  const gfs = getGridFSBucket();
  return gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
}
