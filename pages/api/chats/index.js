import dbConnect from '../../../lib/mongodb';
import Conversation from '../../../models/Conversation';
import User from '../../../models/User';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const userId = await authMiddleware(req);

      const conversations = await Conversation.find({
        participants: userId
      })
        .populate('participants', 'username name avatar email isOnline')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const userId = await authMiddleware(req);
      const { participantId } = req.body;

      // Check if participant is an admin user
      const participant = await User.findById(participantId);
      if (participant && participant.isAdmin) {
        return res.status(403).json({ message: 'Cannot create conversation with admin users' });
      }

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [userId, participantId], $size: 2 }
      });

      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          participants: [userId, participantId],
          isGroup: false
        });
      }

      const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username name avatar email isOnline');

      res.status(201).json(populatedConversation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
