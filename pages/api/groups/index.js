import dbConnect from '../../../lib/mongodb';
import Conversation from '../../../models/Conversation';
import User from '../../../models/User';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const userId = await authMiddleware(req);

    const { groupName, participants } = req.body;

    if (!groupName || !participants || participants.length < 2) {
      return res.status(400).json({ 
        message: 'Group name and at least 2 participants required' 
      });
    }

    // Check if any participant is an admin user
    const participantUsers = await User.find({ _id: { $in: participants } });
    const hasAdmin = participantUsers.some(user => user.isAdmin);
    
    if (hasAdmin) {
      return res.status(403).json({ message: 'Cannot add admin users to groups' });
    }

    // Add the creator to participants
    const allParticipants = [userId, ...participants];

    const conversation = await Conversation.create({
      isGroup: true,
      groupName,
      participants: allParticipants,
      groupAdmin: userId,
      groupAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${groupName}`
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username avatar email')
      .populate('groupAdmin', 'username');

    res.status(201).json(populatedConversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
