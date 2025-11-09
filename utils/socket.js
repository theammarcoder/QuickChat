import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (userId) => {
  if (typeof window === 'undefined') return null;

  const userIdStr = userId?.toString();
  if (!userIdStr) return null;

  // If socket exists and is connected with same user, just ensure online status
  if (socket && socket.connected && socket.userId === userIdStr) {
    socket.emit('user_online', userIdStr);
    return socket;
  }

  // Disconnect existing socket if user changed or not connected
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Store userId on socket for reference
  socket.userId = userIdStr;

  socket.on('connect', () => {
    if (socket.userId) {
      // Small delay to ensure socket is fully connected
      setTimeout(() => {
        socket.emit('user_online', socket.userId);
      }, 200);
    }
  });

  socket.on('reconnect', () => {
    if (socket.userId) {
      setTimeout(() => {
        socket.emit('user_online', socket.userId);
      }, 200);
    }
  });

  socket.on('disconnect', (reason) => {
  });

  socket.on('connect_error', (error) => {
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
};

export const joinConversation = (conversationId) => {
  if (socket) {
    socket.emit('join_conversation', conversationId);
  }
};

export const leaveConversation = (conversationId) => {
  if (socket) {
    socket.emit('leave_conversation', conversationId);
  }
};

export const sendMessage = (messageData) => {
  if (socket) {
    socket.emit('send_message', messageData);
  }
};

export const typingStart = (data) => {
  if (socket) {
    socket.emit('typing_start', data);
  }
};

export const typingStop = (data) => {
  if (socket) {
    socket.emit('typing_stop', data);
  }
};

export const markMessageRead = (data) => {
  if (socket) {
    socket.emit('message_read', data);
  }
};

export const markConversationRead = (data) => {
  if (socket) {
    socket.emit('mark_conversation_read', data);
  }
};

export const editMessage = (data) => {
  if (socket) {
    socket.emit('edit_message', data);
  }
};

export const deleteMessage = (data) => {
  if (socket) {
    socket.emit('delete_message', data);
  }
};

export const addReaction = (data) => {
  if (socket) {
    socket.emit('add_reaction', data);
  }
};
