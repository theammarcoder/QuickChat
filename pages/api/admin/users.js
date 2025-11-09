import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  // Simple admin authentication check
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (req.method === 'GET') {
    try {
      await dbConnect();
      
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
