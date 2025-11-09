import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Socket event listeners
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    // Listen for new messages
    socket.on('new_message', (message) => {
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
      }
      updateConversationLastMessage(message.conversationId, message);
    });

    // Listen for user status changes
    socket.on('user_status_change', ({ userId, isOnline, lastSeen }) => {
      const userIdStr = userId?.toString();
      if (!userIdStr) return;

      setOnlineUsers((prev) => {
        const newMap = new Map(prev);
        newMap.set(userIdStr, { isOnline, lastSeen });
        return newMap;
      });

      // Update conversations to reflect online status changes
      setConversations((prev) =>
        prev.map((conv) => {
          if (!conv.participants) return conv;
          const updatedParticipants = conv.participants.map((participant) => {
            const participantId = participant._id?.toString() || participant._id;
            if (participantId === userIdStr) {
              return { ...participant, isOnline, lastSeen };
            }
            return participant;
          });
          return { ...conv, participants: updatedParticipants };
        })
      );

      // Update selected conversation if it contains this user
      if (selectedConversation) {
        const hasUser = selectedConversation.participants?.some(
          p => (p._id?.toString() || p._id) === userIdStr
        );
        if (hasUser) {
          setSelectedConversation((prev) => {
            if (!prev) return prev;
            const updatedParticipants = prev.participants?.map((participant) => {
              const participantId = participant._id?.toString() || participant._id;
              if (participantId === userIdStr) {
                return { ...participant, isOnline, lastSeen };
              }
              return participant;
            });
            return { ...prev, participants: updatedParticipants };
          });
        }
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ conversationId, userId, username, isTyping }) => {
      if (selectedConversation && conversationId === selectedConversation._id) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          if (isTyping) {
            newMap.set(userId, username);
          } else {
            newMap.delete(userId);
          }
          return newMap;
        });
      }
    });

    // Listen for message status updates
    socket.on('message_status_update', ({ messageId, status, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, delivered: status === 'delivered', isRead: status === 'read' }
            : msg
        )
      );
    });

    // Listen for message edits
    socket.on('message_edited', (editedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === editedMessage._id ? editedMessage : msg))
      );
    });

    // Listen for message deletions
    socket.on('message_deleted', ({ messageId, deleteFor, userId, conversationId }) => {
      const msgIdStr = messageId?.toString();
      const convIdStr = conversationId?.toString();
      
      if (deleteFor === 'everyone') {
        // Remove for everyone - update messages and conversations
        setMessages((prev) => prev.filter((msg) => {
          const msgId = msg._id?.toString ? msg._id.toString() : msg._id;
          return msgId !== msgIdStr;
        }));
        
        // Also update conversation's last message if it was deleted
        setConversations((prev) =>
          prev.map((conv) => {
            const convId = conv._id?.toString ? conv._id.toString() : conv._id;
            // Only update if this is the conversation where the message was deleted
            if (convId === convIdStr) {
              const lastMsgId = conv.lastMessage?._id?.toString ? conv.lastMessage._id.toString() : 
                               (conv.lastMessage?.toString ? conv.lastMessage.toString() : conv.lastMessage);
              if (lastMsgId === msgIdStr) {
                return { ...conv, lastMessage: null };
              }
            }
            return conv;
          })
        );
        
        // If this is the selected conversation, also update messages list
        if (selectedConversation) {
          const selectedConvId = selectedConversation._id?.toString ? selectedConversation._id.toString() : selectedConversation._id;
          if (selectedConvId === convIdStr) {
            setMessages((prev) => prev.filter((msg) => {
              const msgId = msg._id?.toString ? msg._id.toString() : msg._id;
              return msgId !== msgIdStr;
            }));
          }
        }
      } else if (deleteFor === 'me') {
        // Delete for me - only remove if it's the current user's message
        if (userId === user._id || userId?.toString() === user._id?.toString()) {
          setMessages((prev) => prev.filter((msg) => {
            const msgId = msg._id?.toString ? msg._id.toString() : msg._id;
            return msgId !== msgIdStr;
          }));
        }
      }
    });

    // Listen for reactions
    socket.on('reaction_added', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    });

    return () => {
      socket.off('new_message');
      socket.off('user_status_change');
      socket.off('user_typing');
      socket.off('message_status_update');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('reaction_added');
    };
  }, [user, selectedConversation]);

  const updateConversationLastMessage = (conversationId, message) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversationId
          ? { ...conv, lastMessage: message, updatedAt: new Date() }
          : conv
      )
    );
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chats');
      const conversations = response.data || [];
      setConversations(conversations);
      
      // Initialize online users map from loaded conversations
      const onlineUsersMap = new Map();
      conversations.forEach(conv => {
        if (conv.participants) {
          conv.participants.forEach(participant => {
            if (participant.isOnline !== undefined) {
              const participantId = participant._id?.toString() || participant._id;
              onlineUsersMap.set(participantId, { 
                isOnline: participant.isOnline, 
                lastSeen: participant.lastSeen 
              });
            }
          });
        }
      });
      // Merge with existing online users (from socket updates)
      setOnlineUsers(prev => {
        const merged = new Map(prev);
        onlineUsersMap.forEach((value, key) => {
          merged.set(key, value);
        });
        return merged;
      });
    } catch (error) {
      // Error loading conversations
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/chats/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      // Error loading messages
    } finally {
      setLoading(false);
    }
  };

  const value = {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    setMessages,
    onlineUsers,
    typingUsers,
    loading,
    loadConversations,
    loadMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
