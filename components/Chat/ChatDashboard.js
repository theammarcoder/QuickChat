import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import styles from '../../styles/chat.module.css';
import { FiMenu, FiSearch, FiLogOut, FiMessageSquare, FiUsers, FiSettings, FiUserPlus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import AddUserModal from './AddUserModal';
import CreateGroupModal from './CreateGroupModal';
import ChatWindow from './ChatWindow';

export default function ChatDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { conversations, selectedConversation, setSelectedConversation, loadConversations } = useChat();
  const [activeTab, setActiveTab] = useState('chats');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobileView && selectedConversation) {
      setShowMobileChat(true);
    } else {
      setShowMobileChat(false);
    }
  }, [selectedConversation, isMobileView]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const handleBackToChats = () => {
    setSelectedConversation(null);
    setShowMobileChat(false);
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (conv.isGroup) {
      return conv.groupName?.toLowerCase().includes(query);
    } else {
      const otherUser = conv.participants?.find(p => p._id !== user._id);
      const name = otherUser?.name?.toLowerCase() || '';
      const username = otherUser?.username?.toLowerCase() || '';
      const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
      
      return name.includes(query) || username.includes(query) || lastMessage.includes(query);
    }
  });

  // Filter by active tab
  const displayedConversations = filteredConversations.filter(conv => {
    if (activeTab === 'groups') {
      return conv.isGroup === true;
    } else {
      return conv.isGroup !== true;
    }
  });

  return (
    <div className={styles.chatDashboard}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${showMobileChat ? styles.hiddenMobile : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarUser}>
            <div className={styles.avatarWithStatus}>
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt="Avatar"
                className="avatar"
              />
              <span className={styles.statusDot}></span>
            </div>
            <div className={styles.sidebarUserInfo}>
              <h3>{user?.name || user?.username}</h3>
              <span className={styles.userStatusOnline}>
                <span className={styles.statusIndicator}></span>
                Online
              </span>
            </div>
          </div>
          <div className={styles.sidebarActions}>
            <button 
              className="btn-icon" 
              onClick={() => router.push('/profile')} 
              title="Profile Settings"
            >
              <FiSettings size={20} />
            </button>
            <button className="btn-icon" onClick={handleLogout} title="Logout">
              <FiLogOut size={20} />
            </button>
          </div>
        </div>

        <div className={styles.sidebarSearch}>
          <div className={styles.searchInput}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.sidebarTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'chats' ? styles.active : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <FiMessageSquare size={18} />
            Chats
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'groups' ? styles.active : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <FiUsers size={18} />
            Groups
          </button>
        </div>

        <div className={styles.quickActions}>
          <button
            className={styles.actionButton}
            onClick={() => setShowAddUserModal(true)}
            title="Add User"
          >
            <FiUserPlus size={18} />
            Add User
          </button>
          <button
            className={styles.actionButton}
            onClick={() => setShowCreateGroupModal(true)}
            title="Create Group"
          >
            <FiPlus size={18} />
            New Group
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <div className={styles.conversationsList}>
            {conversations.length === 0 ? (
              <div className="empty-state">
                <FiMessageSquare size={56} />
                <p>No conversations yet</p>
                <small>Use "Add User" button above to start chatting with friends</small>
              </div>
            ) : displayedConversations.length === 0 ? (
              <div className="empty-state">
                <FiSearch size={56} />
                <p>No conversations found</p>
                <small>Try a different search term</small>
              </div>
            ) : (
              displayedConversations.map((conv) => {
                const otherUser = conv.isGroup 
                  ? null 
                  : conv.participants?.find(p => p._id !== user._id);
                
                return (
                  <div
                    key={conv._id}
                    className={`${styles.contactItem} ${
                      selectedConversation?._id === conv._id ? styles.active : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="status-badge">
                      <img
                        src={
                          conv.isGroup 
                            ? conv.groupAvatar 
                            : (otherUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
                        }
                        alt={conv.isGroup ? conv.groupName : otherUser?.username}
                        className="avatar"
                      />
                    </div>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactHeader}>
                        <span className={styles.contactName}>
                          {conv.isGroup ? conv.groupName : (otherUser?.name || otherUser?.username || 'Unknown')}
                        </span>
                        <span className={styles.contactTime}>
                          {conv.lastMessage?.createdAt 
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                      <div className={styles.lastMessageRow}>
                        <p className={styles.contactMessage}>
                          {conv.lastMessage ? (
                            conv.lastMessage.messageType === 'image' ? '📷 Photo' :
                            conv.lastMessage.messageType === 'video' ? '🎥 Video' :
                            conv.lastMessage.messageType === 'file' ? `📎 ${conv.lastMessage.fileName || 'File'}` :
                            conv.lastMessage.content || 'Message'
                          ) : 'Start a conversation'}
                        </p>
                        {conv.unreadCount && conv.unreadCount[user._id] > 0 && (
                          <span className={styles.unreadBadge}>
                            {conv.unreadCount[user._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${styles.chatWindowContainer} ${showMobileChat ? styles.showMobile : ''}`}>
        {selectedConversation ? (
          <div className={styles.chatWindowWrapper}>
            {isMobileView && (
              <button className={styles.backButton} onClick={handleBackToChats}>
                <FiArrowLeft size={20} />
              </button>
            )}
            <ChatWindow conversation={selectedConversation} currentUser={user} />
          </div>
        ) : (
          <div className="chat-empty">
            <div className="empty-content">
              <img src="/logo.svg" alt="QuickChat Logo" style={{ width: '120px', height: '120px', marginBottom: '20px' }} />
              <h2>Welcome to QuickChat</h2>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={() => {
          loadConversations();
        }}
      />
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={() => {
          loadConversations();
        }}
      />
    </div>
  );
}
