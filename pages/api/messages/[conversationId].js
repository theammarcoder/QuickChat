import dbConnect from '../../../lib/mongodb';
import Message from '../../../models/Message';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  const { conversationId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const userId = await authMiddleware(req);

    // Filter out messages deleted by current user
    const messages = await Message.find({ 
      conversationId,
      deletedFor: { $nin: [userId] } // Exclude messages where current user is in deletedFor array
    })
      .populate('sender', 'username name avatar')
      .populate('receiver', 'username name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
