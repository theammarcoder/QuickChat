import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const userId = await authMiddleware(req);
    const user = await User.findById(userId);

    if (user) {
      user.isOnline = false;
      user.lastSeen = Date.now();
      user.socketId = null;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
