import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Message from '../../../models/Message';
import Conversation from '../../../models/Conversation';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    await authMiddleware(req);

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User activities
    const recentUsers = await User.find()
      .select('username email avatar isOnline lastSeen createdAt')
      .sort({ lastSeen: -1 })
      .limit(20);

    // Message statistics
    const messageStats = {
      today: await Message.countDocuments({ createdAt: { $gte: today } }),
      thisWeek: await Message.countDocuments({ createdAt: { $gte: thisWeek } }),
      thisMonth: await Message.countDocuments({ createdAt: { $gte: thisMonth } }),
      total: await Message.countDocuments()
    };

    // Active conversations
    const activeConversations = await Conversation.find()
      .populate('participants', 'username avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Hourly message distribution (last 24 hours)
    const hourlyMessages = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Top active users (by message count)
    const topActiveUsers = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: thisWeek }
        }
      },
      {
        $group: {
          _id: '$sender',
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details
    const populatedTopUsers = await User.populate(topActiveUsers, {
      path: '_id',
      select: 'username email avatar'
    });

    // Online users count
    const onlineUsersCount = await User.countDocuments({ isOnline: true });
    const totalUsersCount = await User.countDocuments();

    const activity = {
      recentUsers,
      messageStats,
      activeConversations,
      hourlyMessages,
      topActiveUsers: populatedTopUsers,
      onlineUsersCount,
      totalUsersCount,
      timestamp: new Date()
    };

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
