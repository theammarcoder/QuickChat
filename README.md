# QuickChat - Real-Time Messaging Platform

<div align="center">

![QuickChat](https://img.shields.io/badge/QuickChat-Real--Time%20Messaging-0084ff?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black?style=for-the-badge)

A modern, feature-rich real-time messaging platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.IO for instant communication.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation)

</div>

---

## 🎯 Features

### Core Features

#### 1. User Authentication
- ✅ Email/password registration
- ✅ Secure login with JWT tokens
- ✅ Profile picture upload & customization
- ✅ Online/offline status tracking
- ✅ Logout functionality

#### 2. Real-Time Chat System
**One-on-One Messaging:**
- ✅ Instant message delivery
- ✅ Typing indicators ("User is typing...")
- ✅ Message status (sent ✓, delivered ✓✓, read ✓✓ blue)
- ✅ Online users list
- ✅ Last seen timestamp

**Group Chats:**
- ✅ Create group conversations
- ✅ Add/remove participants
- ✅ Group admin permissions
- ✅ Group info editing (name, avatar)

#### 3. Advanced Chat Features
**Message Types:**
- 📝 Text messages
- 😊 Emoji reactions
- 📎 File sharing (images, documents, PDF)
- 🎤 Voice messages recording/sending

**Chat Management:**
- 🗑️ Delete messages (for everyone/for me)
- ✏️ Edit messages
- 🔍 Search in conversation
- 📁 Chat archives

#### 4. Modern User Interface
**Contacts Sidebar:**
- Recent conversations list
- Unread message counts
- Online status indicators
- Search contacts

**Chat Window:**
- Message bubbles (sent/received)
- Timestamp for each message
- Read receipts (blue ticks)
- Date separators
- Smooth scrolling

### 👥 Group Chats
- Create and manage group chats
- Add/remove participants
- Group admin permissions
- Group name and avatar
- Leave group functionality

### 🎨 Modern UI/UX - **Enhanced Professional Design**
- **Professional gradient color schemes** with enhanced visual appeal
- **Smooth animations** and micro-interactions
- **Glassmorphism effects** on authentication pages
- **Modern message bubbles** with gradient backgrounds
- Fully responsive design (mobile, tablet, desktop)
- Loading states with elegant spinners
- Toast notifications with professional styling
- Emoji picker integration
- File preview before sending

### 🔔 Notifications
- Real-time message notifications
- Unread message counters
- Desktop notifications support

---

## 🛠️ Tech Stack

### Framework & Core
- **Next.js 14** - React framework with App Router
- **React 18.2** - UI library
- **Node.js** - Runtime environment

### Backend & Database
- **MongoDB** with Mongoose - Database & ODM
- **Socket.IO** (v4.7) - Real-time bidirectional communication
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **CSS Modules** - Component-scoped styling
- **Custom CSS Variables** - Professional color palette

### Additional Libraries
- **Axios** - HTTP client
- **Emoji Picker React** - Emoji selection
- **React Icons** - Icon library
- **date-fns** - Date formatting
- **React Toastify** - Toast notifications
- **Multer** - File upload handling

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

---

## 🚀 Deployment

**Ready to deploy?** See **[DEPLOY.md](./DEPLOY.md)** for quick deployment guide.

**Platform Recommendations:**
- **Railway/Render** - All features work (recommended)
- **Vercel** - Fast but limited (no real-time features)

For Vercel-specific details, see **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Chat-App
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install
```

### 3. Environment Configuration
```bash
# The .env.local file should already exist with:
MONGODB_URI=mongodb://localhost:27017/quickchat
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

Update the values as needed for your environment.

### 4. Start MongoDB
Ensure MongoDB is running on your system:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### 5. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 📱 Usage

### First Time Setup

1. **Ensure MongoDB is running**
   ```bash
   # Check MongoDB status
   # macOS: brew services list
   # Windows: sc query MongoDB
   # Linux: systemctl status mongod
   ```

2. **Start the Next.js Development Server**
   ```bash
   npm run dev
   ```

3. **Open the Application**
   - Navigate to `http://localhost:3000`
   - You'll be redirected to the login page

4. **Register a New Account**
   - Click "Register here"
   - Fill in username, email, and password (minimum 6 characters)
   - Click "Register"
   - You'll be automatically logged in

5. **Start Chatting**
   - The dashboard will load with your conversations
   - Search for users in the search bar
   - Click on a user to start a conversation
   - Type a message and press Enter or click Send

### Creating a Group Chat
1. Click the "+" icon in the sidebar tabs
2. Enter a group name
3. Select at least 2 members
4. Click "Create Group"

### Sending Files
1. Click the paperclip icon in the message input
2. Select a file (max 10MB)
3. Click Send

### Recording Voice Messages
1. Click the microphone icon
2. Record your message
3. Click stop to send automatically

---

## 🔌 API Documentation

### Authentication Endpoints

```javascript
POST   /api/auth/register     // Register new user
POST   /api/auth/login        // Login user
GET    /api/auth/me           // Get current user
POST   /api/auth/logout       // Logout user
PUT    /api/auth/avatar       // Update avatar
```

### User Endpoints

```javascript
GET    /api/users             // Get all users
GET    /api/users/search      // Search users
GET    /api/users/:id         // Get user by ID
```

### Chat Endpoints

```javascript
POST   /api/chats/conversation           // Get or create conversation
GET    /api/chats/conversations          // Get all conversations
GET    /api/chats/messages/:conversationId  // Get messages
POST   /api/chats/message               // Send message
PUT    /api/chats/message/:id           // Edit message
DELETE /api/chats/message/:id           // Delete message
POST   /api/chats/message/:id/reaction  // Add reaction
GET    /api/chats/search/:conversationId // Search in conversation
```

### Group Endpoints

```javascript
POST   /api/groups/create        // Create group
POST   /api/groups/add-user      // Add user to group
DELETE /api/groups/remove-user   // Remove user from group
PUT    /api/groups/:id           // Update group info
POST   /api/groups/:id/leave     // Leave group
```

### Upload Endpoints

```javascript
POST   /api/upload               // Upload file
POST   /api/upload/message       // Upload and send file message
```

---

## 🔐 Socket.IO Events

### Client to Server Events
```javascript
'user_online'           // User comes online
'join_conversation'     // Join conversation room
'send_message'          // Send new message
'typing_start'          // Start typing
'typing_stop'           // Stop typing
'message_read'          // Mark message as read
'edit_message'          // Edit message
'delete_message'        // Delete message
'add_reaction'          // Add emoji reaction
```

### Server to Client Events
```javascript
'user_status_change'    // User online/offline status
'new_message'           // New message received
'user_typing'           // User typing indicator
'message_status_update' // Message status updated
'message_edited'        // Message edited
'message_deleted'       // Message deleted
'reaction_added'        // Reaction added
```

---

## 📊 Database Models

### User Model
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  socketId: String
}
```

### Message Model
```javascript
{
  conversationId: ObjectId,
  sender: ObjectId,
  receiver: ObjectId,
  content: String,
  messageType: String (text/image/file/voice),
  isRead: Boolean,
  delivered: Boolean,
  reactions: Array,
  deletedFor: Array,
  isEdited: Boolean
}
```

### Conversation Model
```javascript
{
  participants: [ObjectId],
  isGroup: Boolean,
  groupName: String,
  groupAdmin: ObjectId,
  lastMessage: ObjectId,
  unreadCount: Map
}
```

---

## 🎨 Project Structure

```
Chat-App/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── groupController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Conversation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── userRoutes.js
│   │   └── uploadRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   ├── Chat/
    │   │   └── PrivateRoute.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── ChatContext.js
    │   ├── utils/
    │   │   ├── api.js
    │   │   ├── socket.js
    │   │   └── formatDate.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Input validation
- XSS protection
- CORS configuration
- File upload validation
- Secure Socket.IO connections

---

## 📱 Responsive Design

QuickChat is fully responsive and works seamlessly on:
- 📱 Mobile devices (320px and up)
- 📱 Tablets (768px and up)
- 💻 Desktop (1024px and up)

---

## 🚧 Future Enhancements

- [ ] Video/Audio calling
- [ ] Message forwarding
- [ ] User blocking
- [ ] Message pinning
- [ ] Chat themes
- [ ] Dark mode
- [ ] Push notifications
- [ ] Message encryption
- [ ] Profile status updates
- [ ] Stories feature

---

## 🐛 Known Issues

None at the moment. Please report any issues you encounter.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Your Name

---

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- React community for amazing libraries
- MongoDB for flexible database solution
- All contributors and testers

---

<div align="center">

Made with ❤️ using MERN Stack

**[⬆ back to top](#quickchat---real-time-messaging-platform)**

</div>
