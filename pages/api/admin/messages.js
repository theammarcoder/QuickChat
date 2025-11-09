import dbConnect from '../../../lib/mongodb';
import Message from '../../../models/Message';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    await authMiddleware(req);

    const { search, page = 1, limit = 50 } = req.query;

    let query = {};
    
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    const messages = await Message.find(query)
      .populate('sender', 'username email avatar')
      .populate('receiver', 'username email avatar')
      .populate('conversationId', 'isGroup groupName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Message.countDocuments(query);

    // Get statistics
    const stats = {
      total,
      today: await Message.countDocuments({
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      }),
      thisWeek: await Message.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      images: await Message.countDocuments({ messageType: 'image' }),
      videos: await Message.countDocuments({ messageType: 'video' }),
      files: await Message.countDocuments({ messageType: 'file' })
    };

    res.json({ messages, stats, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
