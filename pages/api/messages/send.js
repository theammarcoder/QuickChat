import dbConnect from '../../../lib/mongodb';
import Message from '../../../models/Message';
import Conversation from '../../../models/Conversation';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const userId = await authMiddleware(req);

    const { conversationId, receiverId, content, messageType = 'text', fileUrl, fileName, fileSize, mimeType } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }

    // Create the message
    const message = await Message.create({
      conversationId,
      sender: userId,
      receiver: receiverId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      delivered: true,
      isRead: false
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username name avatar')
      .populate('receiver', 'username name avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
