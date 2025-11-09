import { Server } from 'socket.io';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import Message from '../../models/Message';
import Conversation from '../../models/Conversation';

// Track multiple sockets per user (for multiple tabs/windows)
const onlineUsers = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId

const SocketHandler = async (req, res) => {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  await dbConnect();

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  res.socket.server.io = io;

  io.on('connection', (socket) => {

    // User joins/authentication
    socket.on('user_online', async (userId) => {
      try {
        if (!userId) return;
        
        const userIdStr = userId.toString();
        
        // Track this socket for this user (support multiple tabs)
        if (!onlineUsers.has(userIdStr)) {
          onlineUsers.set(userIdStr, new Set());
        }
        onlineUsers.get(userIdStr).add(socket.id);
        socketToUser.set(socket.id, userIdStr);
        
        // Update user status in database (only if not already online)
        const user = await User.findById(userId);
        if (user) {
          const wasOnline = user.isOnline;
          user.isOnline = true;
          user.socketId = socket.id; // Keep latest socket ID
          await user.save();

          // Always emit status change to ensure all clients have latest status
          // This handles cases where client reconnects or new tabs open
          io.emit('user_status_change', {
            userId: userIdStr,
            isOnline: true,
            lastSeen: null
          });

          // Mark all undelivered messages to this user as delivered
          const undeliveredMessages = await Message.updateMany(
            { receiver: userId, delivered: false },
            { delivered: true, deliveredAt: Date.now() }
          );

          if (undeliveredMessages.modifiedCount > 0) {
            // Get all conversations where messages were updated
            const messages = await Message.find({ receiver: userId, delivered: true });
            const conversationIds = [...new Set(messages.map(m => m.conversationId.toString()))];
            
            // Notify senders that messages are now delivered
            conversationIds.forEach(convId => {
              io.to(convId).emit('messages_delivered', {
                receiverId: userId,
                conversationId: convId
              });
            });
          }

        }
      } catch (error) {
        // Error in user_online
      }
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      const convId = conversationId?.toString();
      if (convId) {
        socket.join(convId);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, sender, receiver, content, messageType, fileUrl, fileName, fileSize, mimeType } = data;

        // Check if receiver is online (has any active sockets)
        const receiverSockets = onlineUsers.get(receiver?.toString());
        const isReceiverOnline = receiverSockets && receiverSockets.size > 0;

        const messageData = {
          conversationId,
          sender,
          receiver,
          content,
          messageType,
          delivered: isReceiverOnline,
          deliveredAt: isReceiverOnline ? Date.now() : null,
          isRead: false
        };

        // Add file information if present
        if (fileUrl) {
          messageData.fileUrl = fileUrl;
        }
        if (fileName) {
          messageData.fileName = fileName;
        }
        if (fileSize) {
          messageData.fileSize = fileSize;
        }
        if (mimeType) {
          messageData.mimeType = mimeType;
        }

        const message = await Message.create(messageData);

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: Date.now()
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username name avatar');

        // Send message to conversation room (both sender and receiver)
        io.to(conversationId).emit('new_message', populatedMessage);

        // Send acknowledgment back to sender confirming message was saved
        socket.emit('message_sent', {
          tempId: data.tempId,
          message: populatedMessage
        });

        // If receiver is online, mark as delivered immediately
        if (isReceiverOnline) {
          io.to(conversationId).emit('message_delivered', {
            messageId: message._id,
            conversationId
          });
        }
      } catch (error) {
        socket.emit('message_error', { 
          error: error.message,
          tempId: data.tempId 
        });
      }
    });

    // Typing indicator
    socket.on('typing_start', (data) => {
      const { conversationId, userId, username } = data;
      socket.to(conversationId).emit('user_typing', {
        conversationId,
        userId,
        username,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId, userId } = data;
      socket.to(conversationId).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    // Message read
    socket.on('message_read', async (data) => {
      try {
        const { messageId, userId, conversationId } = data;

        const message = await Message.findById(messageId);
        if (message && message.receiver && message.receiver.toString() === userId) {
          // Check if already read by this user
          const alreadyRead = message.readBy.some(r => r.user.toString() === userId);
          
          if (!alreadyRead) {
            message.readBy.push({
              user: userId,
              readAt: Date.now()
            });
          }
          
          // Mark as read if not already marked
          if (!message.isRead) {
            message.isRead = true;
          }
          
          await message.save();

          // Notify sender about read status
          io.to(conversationId).emit('message_status_update', {
            messageId,
            status: 'read',
            readBy: userId
          });

          // Also notify the sender directly if they're in a different conversation
          const senderSockets = onlineUsers.get(message.sender.toString());
          if (senderSockets && senderSockets.size > 0) {
            senderSockets.forEach(socketId => {
              io.to(socketId).emit('message_status_update', {
                messageId,
                status: 'read',
                readBy: userId
              });
            });
          }
        }
      } catch (error) {
        // Error in message_read
      }
    });

    // Add reaction
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji, userId, conversationId } = data;

        const message = await Message.findById(messageId);
        if (message) {
          // Check if user already reacted with this emoji
          const existingReaction = message.reactions.find(
            r => r.user.toString() === userId && r.emoji === emoji
          );

          if (existingReaction) {
            // Remove reaction if already exists
            message.reactions = message.reactions.filter(
              r => !(r.user.toString() === userId && r.emoji === emoji)
            );
          } else {
            // Add new reaction
            message.reactions.push({
              user: userId,
              emoji,
              createdAt: Date.now()
            });
          }

          await message.save();

          io.to(conversationId).emit('reaction_added', {
            messageId,
            reactions: message.reactions
          });
        }
      } catch (error) {
        // Error in add_reaction
      }
    });

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, userId, conversationId, deleteFor } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          return;
        }

        // Check if user is the sender (only sender can delete messages)
        if (message.sender.toString() !== userId) {
          return; // Only sender can delete their own messages
        }

        if (deleteFor === 'me') {
          // Delete for me - add user to deletedFor array
          if (!message.deletedFor || !message.deletedFor.some(id => id.toString() === userId)) {
            if (!message.deletedFor) {
              message.deletedFor = [];
            }
            message.deletedFor.push(userId);
            await message.save();
          }

          // Only notify the user who deleted it
          socket.emit('message_deleted', {
            messageId,
            deleteFor: 'me',
            userId
          });
        } else if (deleteFor === 'everyone') {
          // Delete for everyone - delete the message completely
          const deletedMessage = await Message.findByIdAndDelete(messageId);
          
          if (deletedMessage) {
            // Get conversation to find all participants
            const conversation = await Conversation.findById(conversationId);
            
            if (conversation) {
              const convIdStr = conversationId?.toString();
              
              // Update conversation's lastMessage if it was the deleted message
              if (conversation.lastMessage && conversation.lastMessage.toString() === messageId) {
                // Find the previous message to set as lastMessage
                const previousMessage = await Message.findOne({ 
                  conversationId,
                  _id: { $ne: messageId } // Exclude the deleted message
                })
                  .sort({ createdAt: -1 })
                  .limit(1);
                
                conversation.lastMessage = previousMessage?._id || null;
                conversation.updatedAt = Date.now();
                await conversation.save();
              }
              
              // Get all participant IDs (handle both ObjectId and string)
              const participantIds = conversation.participants.map(p => {
                const pid = p._id ? p._id.toString() : (p.toString ? p.toString() : p);
                return pid;
              });
              
              // Create delete event data
              const deleteEventData = {
                messageId: messageId.toString(),
                deleteFor: 'everyone',
                conversationId: convIdStr
              };
              
              // Emit to conversation room (all participants listening to this conversation)
              io.to(convIdStr).emit('message_deleted', deleteEventData);
              
              // Also emit to individual user sockets to ensure delivery across all tabs
              participantIds.forEach(participantId => {
                const userSockets = onlineUsers.get(participantId);
                if (userSockets && userSockets.size > 0) {
                  userSockets.forEach(socketId => {
                    io.to(socketId).emit('message_deleted', deleteEventData);
                  });
                }
              });
              
            }
          }
        }
      } catch (error) {
        // Error in delete_message
      }
    });

    // Edit message
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content, conversationId } = data;

        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            content,
            isEdited: true,
            editedAt: Date.now()
          },
          { new: true }
        ).populate('sender', 'username avatar');

        io.to(conversationId).emit('message_edited', message);
      } catch (error) {
        // Error in edit_message
      }
    });

    // Disconnect
    socket.on('disconnect', async (reason) => {

      const disconnectedUserId = socketToUser.get(socket.id);
      socketToUser.delete(socket.id);

      if (disconnectedUserId) {
        try {
          const userSockets = onlineUsers.get(disconnectedUserId);
          if (userSockets) {
            userSockets.delete(socket.id);
            
            // If user has no more active sockets, mark as offline
            if (userSockets.size === 0) {
              onlineUsers.delete(disconnectedUserId);
              
              const now = Date.now();
              const user = await User.findByIdAndUpdate(disconnectedUserId, {
                isOnline: false,
                lastSeen: now,
                socketId: null
              }, { new: true });

              if (user) {
                // Emit status change to all connected clients
                io.emit('user_status_change', {
                  userId: user._id.toString(),
                  isOnline: false,
                  lastSeen: now
                });

              }
            }
          }
        } catch (error) {
          // Error updating user status on disconnect
        }
      }
    });
  });

  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default SocketHandler;
