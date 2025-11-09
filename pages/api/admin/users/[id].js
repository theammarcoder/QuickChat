import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await dbConnect();

    if (req.method === 'DELETE') {
      await User.findByIdAndDelete(id);
      res.json({ message: 'User deleted successfully' });
    } else if (req.method === 'PUT') {
      const user = await User.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      ).select('-password');
      res.json(user);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
