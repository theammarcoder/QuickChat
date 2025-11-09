import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import EmojiPicker from 'emoji-picker-react';
import { 
  FiSend, FiSmile, FiPaperclip, FiMoreVertical, FiTrash2, FiCornerUpLeft, FiImage, FiFile,
  FiDownload, FiEye, FiX, FiExternalLink
} from 'react-icons/fi';
import styles from '../../styles/chatWindow.module.css';
import { getSocket } from '../../utils/socket';
import api from '../../utils/api';
import { formatMessageTime } from '../../utils/formatDate';
import { useChat } from '../../context/ChatContext';

export default function ChatWindow({ conversation, currentUser }) {
  const { onlineUsers } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (conversation?._id) {
      loadMessages();
      joinConversation();

      // Listen for new messages
      const socket = getSocket();
      if (socket) {
        socket.on('new_message', handleNewMessage);
        socket.on('message_sent', handleMessageSent);
        socket.on('message_error', handleMessageError);
        socket.on('message_delivered', handleMessageDelivered);
        socket.on('messages_delivered', handleMessagesDelivered);
        socket.on('message_status_update', handleMessageRead);
        socket.on('reaction_added', handleReactionAdded);
        socket.on('message_deleted', handleMessageDeleted);
      }

      return () => {
        if (socket) {
          socket.off('new_message', handleNewMessage);
          socket.off('message_sent', handleMessageSent);
          socket.off('message_error', handleMessageError);
          socket.off('message_delivered', handleMessageDelivered);
          socket.off('messages_delivered', handleMessagesDelivered);
          socket.off('message_status_update', handleMessageRead);
          socket.off('reaction_added', handleReactionAdded);
          socket.off('message_deleted', handleMessageDeleted);
        }
      };
    }
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/${conversation._id}`);
      // Filter out messages deleted by current user
      const filteredMessages = response.data.filter(msg => {
        if (!msg.deletedFor || msg.deletedFor.length === 0) return true;
        // Check if current user's ID is in deletedFor array (handle both string and ObjectId)
        return !msg.deletedFor.some(id => 
          id.toString() === currentUser._id.toString()
        );
      });
      setMessages(filteredMessages);

      // Mark all unread messages from other users as read
      const socket = getSocket();
      if (socket) {
        const otherUser = conversation.participants?.find(p => p._id !== currentUser._id);
        if (otherUser) {
          filteredMessages
            .filter(msg => 
              (msg.sender?._id || msg.sender) !== currentUser._id && 
              !msg.isRead
            )
            .forEach(msg => {
              socket.emit('message_read', {
                messageId: msg._id,
                userId: currentUser._id,
                conversationId: conversation._id
              });
            });
        }
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const joinConversation = () => {
    const socket = getSocket();
    if (socket && conversation?._id) {
      const convId = conversation._id?.toString ? conversation._id.toString() : conversation._id;
      socket.emit('join_conversation', convId);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversationId === conversation._id) {
      // Don't process if it's from the current user (to avoid duplicates)
      // The temp message was already added optimistically
      const isOwnMessage = message.sender === currentUser._id || message.sender?._id === currentUser._id;
      
      if (!isOwnMessage) {
        // Only add messages from other users
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) {
            return prev; // Don't add duplicate
          }
          return [...prev, message];
        });

        // Mark message as read
        const socket = getSocket();
        if (socket) {
          socket.emit('message_read', {
            messageId: message._id,
            userId: currentUser._id,
            conversationId: conversation._id
          });
        }
      }
    }
  };

  const handleMessageSent = (data) => {
    // Replace temp message with real message from server
    if (data.message.conversationId === conversation._id) {
      setMessages(prev => {
        const tempIndex = prev.findIndex(msg => msg._id === data.tempId);
        if (tempIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempIndex] = data.message;
          return newMessages;
        }
        return prev;
      });
    }
  };

  const handleMessageError = (data) => {
    // Remove the temp message or mark it as failed
    setMessages(prev => prev.filter(msg => msg._id !== data.tempId));
    toast.error('Failed to send message. Please try again.');
  };

  const handleMessageDelivered = (data) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === data.messageId ? { ...msg, delivered: true } : msg
      )
    );
  };

  const handleMessagesDelivered = (data) => {
    // Update all messages to this receiver as delivered
    if (data.conversationId === conversation._id) {
      setMessages(prev =>
        prev.map(msg => {
          const receiverMatch = msg.receiver?.toString() === data.receiverId?.toString() || 
                               msg.receiver === data.receiverId;
          if (receiverMatch && !msg.delivered) {
            return { ...msg, delivered: true, deliveredAt: new Date() };
          }
          return msg;
        })
      );
    }
  };

  const handleMessageRead = (data) => {
    if (data.status === 'read') {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    }
  };

  const handleReactionAdded = (data) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === data.messageId
          ? { ...msg, reactions: data.reactions }
          : msg
      )
    );
  };

  const handleMessageDeleted = (data) => {
    if (data.deleteFor === 'everyone') {
      // Remove for everyone
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    } else if (data.deleteFor === 'me') {
      // Only hide for the current user who deleted it
      if (data.userId === currentUser._id) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      toast.error('Connection error. Please refresh.');
      return;
    }

    const otherUser = conversation.participants?.find(
      p => p._id !== currentUser._id
    );

    // Generate unique temp ID
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const messageData = {
      conversationId: conversation._id,
      sender: currentUser._id,
      receiver: otherUser?._id || conversation.participants[0]._id,
      content: newMessage.trim(),
      messageType: 'text',
      tempId: tempId
    };

    // Clear input immediately
    setNewMessage('');
    setShowEmojiPicker(false);

    // Optimistically add message to UI
    const tempMessage = {
      ...messageData,
      _id: tempId,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      createdAt: new Date(),
      delivered: false,
      isRead: false
    };

    setMessages(prev => [...prev, tempMessage]);

    // Send via socket
    if (socket && socket.connected) {
      socket.emit('send_message', messageData);
    } else {
      // Fallback: Send via API if socket not available (Vercel)
      try {
        await api.post('/api/messages/send', {
          conversationId: conversation._id,
          receiverId: conversation.isGroup ? null : conversation.participants.find(p => p._id !== currentUser._id)?._id,
          content: newMessage.trim(),
          messageType: 'text'
        });
        await loadMessages(); // Reload to show the sent message
      } catch (error) {
        toast.error('Failed to send message');
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReaction = (messageId, emoji) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('add_reaction', {
        messageId,
        emoji,
        userId: currentUser._id,
        conversationId: conversation._id
      });
      setShowReactionPicker(null);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setDeleteMessageId(messageId);
  };

  const confirmDeleteMessage = (deleteFor) => {
    if (!deleteMessageId) return;
    
    const socket = getSocket();
    if (socket) {
      socket.emit('delete_message', {
        messageId: deleteMessageId,
        userId: currentUser._id,
        conversationId: conversation._id,
        deleteFor
      });
      toast.success('Message deleted');
    }
    setDeleteMessageId(null);
  };

  const cancelDelete = () => {
    setDeleteMessageId(null);
  };

  const handleFileView = (message) => {
    setViewingFile(message);
  };

  const handleFileDownload = async (fileUrl, fileName) => {
    try {
      // Use fetch to download and force download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (mimeType, fileName) => {
    if (!mimeType && !fileName) return <FiFile size={24} color="#64748b" />;
    
    const mime = mimeType?.toLowerCase() || '';
    const name = fileName?.toLowerCase() || '';
    
    if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/.test(name)) {
      return <FiImage size={24} color="#3b82f6" />;
    }
    if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) {
      return <span style={{ fontSize: '24px' }}>🎥</span>;
    }
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      return <span style={{ fontSize: '24px' }}>📄</span>;
    }
    if (mime.includes('word') || /\.(doc|docx)$/.test(name)) {
      return <span style={{ fontSize: '24px' }}>📝</span>;
    }
    if (mime.includes('excel') || /\.(xls|xlsx)$/.test(name)) {
      return <span style={{ fontSize: '24px' }}>📊</span>;
    }
    if (mime.includes('powerpoint') || /\.(ppt|pptx)$/.test(name)) {
      return <span style={{ fontSize: '24px' }}>📊</span>;
    }
    if (mime.includes('zip') || mime.includes('rar') || /\.(zip|rar|7z)$/.test(name)) {
      return <span style={{ fontSize: '24px' }}>🗜️</span>;
    }
    if (mime.includes('audio') || /\.(mp3|wav|ogg)$/.test(name)) {
      return <span style={{ fontSize: '24px' }}>🎵</span>;
    }
    return <FiFile size={24} color="#64748b" />;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversation._id);

      // Use cloud storage for production/Vercel, local storage for development
      const uploadEndpoint = process.env.NODE_ENV === 'production' || process.env.VERCEL 
        ? '/api/upload-cloud' 
        : '/api/upload';
      
      const response = await api.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Immediately show the uploaded file (refresh messages)
      setTimeout(() => {
        loadMessages();
      }, 500);

      // Determine message type from MIME type
      let messageType = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      }

      // Send file message
      const socket = getSocket();
      const otherUser = conversation.participants?.find(p => p._id !== currentUser._id);
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      
      if (socket) {
        socket.emit('send_message', {
          conversationId: conversation._id,
          sender: currentUser._id,
          receiver: otherUser?._id || conversation.participants[0]._id,
          content: response.data.fileName || file.name,
          messageType: messageType,
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName || file.name,
          fileSize: response.data.fileSize || file.size,
          mimeType: response.data.mimeType || file.type,
          tempId: tempId
        });
      }

      setSelectedFile(null);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const getOtherUser = () => {
    if (conversation.isGroup) {
      return { username: conversation.groupName, avatar: conversation.groupAvatar, isOnline: false };
    }
    const otherUser = conversation.participants?.find(p => p._id !== currentUser._id) || {};
    // Get real-time online status from ChatContext
    const onlineStatus = onlineUsers.get(otherUser._id);
    return {
      ...otherUser,
      isOnline: onlineStatus?.isOnline || otherUser.isOnline || false
    };
  };

  const otherUser = getOtherUser();

  return (
    <div className={styles.chatWindow}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div className={styles.avatarWithStatus}>
            <img
              src={otherUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={otherUser.username}
              className="avatar"
            />
            {!conversation.isGroup && otherUser.isOnline && (
              <span className={styles.statusDot}></span>
            )}
          </div>
          <div className={styles.chatHeaderInfo}>
            <h3>{otherUser.name || otherUser.username || 'Unknown'}</h3>
            <span className={styles.userStatus}>
              {conversation.isGroup
                ? `${conversation.participants?.length || 0} members`
                : otherUser.isOnline
                ? 'Online'
                : 'Offline'}
            </span>
          </div>
        </div>
        <div className={styles.chatHeaderActions}>
          <button className="btn-icon" title="More">
            <FiMoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyMessages}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => {
              const isOwn = message.sender === currentUser._id || message.sender?._id === currentUser._id;
              const showDate = index === 0 || 
                new Date(messages[index - 1].createdAt).toDateString() !== 
                new Date(message.createdAt).toDateString();

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className={styles.dateSeparator}>
                      <span>{new Date(message.createdAt).toDateString()}</span>
                    </div>
                  )}
                  <div className={styles.messageWrapper}>
                    <div className={`${styles.message} ${isOwn ? styles.messageOwn : styles.messageOther}`}>
                      {!isOwn && conversation.isGroup && (
                        <span className={styles.messageSender}>
                          {message.sender?.username || 'Unknown'}
                        </span>
                      )}
                      
                      <div className={styles.messageContent}>
                        {message.messageType === 'image' && message.fileUrl && (
                          <div className={styles.fileContainer}>
                            <img 
                              src={message.fileUrl} 
                              alt={message.fileName} 
                              className={styles.messageImage}
                              onClick={() => handleFileView(message)}
                            />
                            <div className={styles.fileActions}>
                              <button 
                                className={styles.fileActionBtn}
                                onClick={() => handleFileView(message)}
                                title="View"
                              >
                                <FiEye size={16} />
                              </button>
                              <button 
                                className={styles.fileActionBtn}
                                onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
                                title="Download"
                              >
                                <FiDownload size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        {message.messageType === 'video' && message.fileUrl && (
                          <div className={styles.fileContainer}>
                            <video 
                              controls 
                              className={styles.messageVideo}
                              controlsList="nodownload"
                              preload="metadata"
                            >
                              <source src={message.fileUrl} type={message.mimeType || 'video/mp4'} />
                              Your browser does not support the video tag.
                            </video>
                            <div className={styles.fileInfo}>
                              <span className={styles.fileName}>{message.fileName}</span>
                            </div>
                            <div className={styles.fileActions}>
                              <button 
                                className={styles.fileActionBtn}
                                onClick={() => window.open(message.fileUrl, '_blank')}
                                title="Open in new tab"
                              >
                                <FiExternalLink size={16} />
                              </button>
                              <button 
                                className={styles.fileActionBtn}
                                onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
                                title="Download"
                              >
                                <FiDownload size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        {message.messageType === 'file' && message.fileUrl && (
                          <div className={styles.messageFile}>
                            {/* PDF Preview */}
                            {(message.mimeType?.includes('pdf') || message.fileName?.toLowerCase().endsWith('.pdf')) && (
                              <div className={styles.pdfPreview}>
                                <iframe 
                                  src={`${message.fileUrl}#toolbar=0`}
                                  className={styles.pdfFrame}
                                  title={message.fileName}
                                />
                              </div>
                            )}
                            <div className={styles.fileInfo}>
                              {getFileIcon(message.mimeType, message.fileName)}
                              <div className={styles.fileDetails}>
                                <span className={styles.fileName}>{message.fileName || 'Document'}</span>
                                {message.fileSize && (
                                  <span className={styles.fileSize}>
                                    {message.fileSize > 1048576 
                                      ? `${(message.fileSize / 1024 / 1024).toFixed(2)} MB`
                                      : `${(message.fileSize / 1024).toFixed(2)} KB`
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={styles.fileActions}>
                              <button 
                                className={styles.fileActionBtn}
                                onClick={() => window.open(message.fileUrl, '_blank')}
                                title="Open in new tab"
                              >
                                <FiExternalLink size={16} />
                              </button>
                              <button 
                                className={styles.fileActionBtn}
                                onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
                                title="Download"
                              >
                                <FiDownload size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        {message.messageType === 'text' && message.content}
                      </div>

                      {message.reactions && message.reactions.length > 0 && (
                        <div className={styles.reactions}>
                          {[...new Set(message.reactions.map(r => r.emoji))].map(emoji => {
                            const count = message.reactions.filter(r => r.emoji === emoji).length;
                            return (
                              <span key={emoji} className={styles.reaction}>
                                {emoji} {count > 1 && count}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className={styles.messageTime}>
                        {formatMessageTime(message.createdAt)}
                      </div>
                      {isOwn && message.isRead && (
                        <div className={styles.seenStatus}>
                          Seen
                        </div>
                      )}
                    </div>

                    <div className={styles.messageActions}>
                      <button
                        className="btn-icon"
                        onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)}
                        title="React"
                      >
                        <FiSmile size={16} />
                      </button>
                      {isOwn && (
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteMessage(message._id)}
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>

                    {showReactionPicker === message._id && (
                      <div className={styles.quickReactions}>
                        {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message._id, emoji)}
                            className={styles.reactionButton}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.messageInputContainer}>
        <form onSubmit={handleSendMessage} className={styles.messageInputForm}>
          <div className={styles.inputActions}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Emoji"
            >
              <FiSmile size={22} />
            </button>
            <button 
              type="button" 
              className="btn-icon" 
              onClick={() => fileInputRef.current?.click()}
              title="Attach File"
              disabled={uploading}
            >
              <FiPaperclip size={22} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSendMessage(e);
                }
              }}
            />
          </div>

          <button
            type="submit"
            className={`btn-icon ${styles.btnSend}`}
            disabled={!newMessage.trim()}
            title="Send"
          >
            <FiSend size={20} />
          </button>
        </form>

        {showEmojiPicker && (
          <div className={styles.emojiPickerWrapper}>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width="100%"
              height="350px"
              searchPlaceholder="Search emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className={styles.fileViewerModal} onClick={() => setViewingFile(null)}>
          <div className={styles.fileViewerContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.closeButton}
              onClick={() => setViewingFile(null)}
            >
              <FiX size={24} />
            </button>
            {viewingFile.messageType === 'image' && (
              <img 
                src={viewingFile.fileUrl} 
                alt={viewingFile.fileName}
                className={styles.fullSizeImage}
              />
            )}
            {viewingFile.messageType === 'video' && (
              <video 
                controls 
                autoPlay
                className={styles.fullSizeVideo}
              >
                <source src={viewingFile.fileUrl} type={viewingFile.mimeType} />
              </video>
            )}
            <div className={styles.fileViewerFooter}>
              <span>{viewingFile.fileName}</span>
              <button
                className={styles.downloadButton}
                onClick={() => {
                  handleFileDownload(viewingFile.fileUrl, viewingFile.fileName);
                }}
              >
                <FiDownload size={18} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {deleteMessageId && (
        <div className={styles.deleteModal} onClick={cancelDelete}>
          <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Message</h3>
            <p>Are you sure you want to delete this message? It will only be removed from your view.</p>
            <div className={styles.deleteOptions}>
              <button
                className={styles.deleteOption}
                onClick={() => confirmDeleteMessage('me')}
              >
                Delete for Me
              </button>
            </div>
            <button className={styles.cancelButton} onClick={cancelDelete}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
