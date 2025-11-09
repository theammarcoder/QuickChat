import formidable from 'formidable';
import fs from 'fs';
import cloudinary from '../../lib/cloudinary';
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

    // Check if Cloudinary is configured
    const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_API_KEY && 
                          process.env.CLOUDINARY_API_SECRET;

    if (!useCloudinary && process.env.VERCEL) {
      return res.status(500).json({ 
        message: 'Cloud storage not configured. Please set up Cloudinary environment variables.' 
      });
    }

    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      multiples: false,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Upload failed' });
      }

      const file = files.file?.[0] || files.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.filepath, {
          folder: 'quickchat',
          resource_type: 'auto', // Handles all file types (images, videos, documents)
          use_filename: true,
          unique_filename: true,
        });

        // Clean up temp file
        fs.unlinkSync(file.filepath);

        res.json({
          success: true,
          fileUrl: result.secure_url,
          fileName: file.originalFilename,
          fileSize: file.size,
          mimeType: file.mimetype,
          publicId: result.public_id, // For deletion if needed
        });
      } catch (uploadError) {
        // Clean up temp file on error
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
        return res.status(500).json({ 
          message: 'Failed to upload to cloud storage',
          error: uploadError.message 
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
