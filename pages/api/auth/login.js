import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { email, password } = req.body;

    // Hardcoded admin credentials
    const ADMIN_EMAIL = 'ammarahmadkhan757@gmail.com';
    const ADMIN_PASSWORD = 'Ammar12@';

    // Check if admin login
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Find or create admin user
      let adminUser = await User.findOne({ email: ADMIN_EMAIL });
      
      if (!adminUser) {
        adminUser = await User.create({
          username: 'Admin',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          isAdmin: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        });
      }

      adminUser.isOnline = true;
      await adminUser.save();

      return res.json({
        _id: adminUser._id,
        name: adminUser.name || adminUser.username,
        username: adminUser.username,
        email: adminUser.email,
        avatar: adminUser.avatar,
        isOnline: adminUser.isOnline,
        isAdmin: true,
        token: generateToken(adminUser._id)
      });
    }

    // Check for regular user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      isAdmin: user.isAdmin || false,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
