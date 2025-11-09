import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { authMiddleware } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    await authMiddleware(req);

    const { email, phone } = req.query;

    let query = { isAdmin: { $ne: true } }; // Exclude admin users
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    } else if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    } else {
      return res.status(400).json({ message: 'Email or phone required' });
    }

    const users = await User.find(query)
      .select('-password')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
