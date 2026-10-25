import { google } from 'googleapis';
import { Readable } from 'stream';

import path from 'path';
import fs from 'fs';

function getDriveClient() {
  const keyPath = path.resolve(__dirname, '../../service-account.json');
  let authConfig: any;

  if (fs.existsSync(keyPath)) {
    authConfig = {
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    };
  } else {
    authConfig = {
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_SERVICE_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    };
  }

  const auth = new google.auth.GoogleAuth(authConfig);
  return google.drive({ version: 'v3', auth });
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  roomLabel: string
): Promise<{ fileId: string; downloadUrl: string }> {
  const drive = getDriveClient();
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Ensure room subfolder exists in Drive
  const folderRes = await drive.files.list({
    q: `name='${roomLabel}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });

  let roomFolderId: string;

  if (folderRes.data.files && folderRes.data.files.length > 0) {
    roomFolderId = folderRes.data.files[0].id!;
  } else {
    const folderCreate = await drive.files.create({
      requestBody: {
        name: roomLabel,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId!],
      },
      fields: 'id',
    });
    roomFolderId = folderCreate.data.id!;
  }

  // Upload the file as a stream
  const readable = Readable.from(fileBuffer);
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [roomFolderId],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields: 'id',
  });

  const fileId = response.data.id!;

  // Make file publicly readable for direct CDN download
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return { fileId, downloadUrl };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

export async function getDirectDownloadUrl(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
