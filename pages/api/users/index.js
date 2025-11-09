import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const userId = await authMiddleware(req);

    // Exclude current user and admin users from regular user list
    const users = await User.find({ 
      _id: { $ne: userId },
      isAdmin: { $ne: true } // Exclude admin users
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
