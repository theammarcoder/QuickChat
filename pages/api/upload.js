import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../../lib/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await authMiddleware(req);

    // Use /tmp directory for Vercel compatibility (serverless environment)
    // Note: Files in /tmp are temporary and will be deleted after function execution
    // For production, consider using cloud storage like AWS S3, Cloudinary, or Vercel Blob
    const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'public', 'uploads');
    
    if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      multiples: false,
      filename: (name, ext, part, form) => {
        // Preserve original extension
        const originalName = part.originalFilename || 'file';
        const extension = originalName.split('.').pop();
        return `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Upload failed' });
      }

      const file = files.file?.[0] || files.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileName = path.basename(file.filepath);
      const fileUrl = `/uploads/${fileName}`;

      res.json({
        success: true,
        fileUrl,
        fileName: file.originalFilename,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
