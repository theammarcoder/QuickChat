import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-toastify';
import { 
  FiUsers, FiMessageSquare, FiActivity, FiLogOut, FiSearch,
  FiTrash2, FiEdit, FiCheckCircle, FiXCircle, FiBarChart,
  FiUserX, FiUserCheck, FiShield
} from 'react-icons/fi';
import styles from '../../styles/admin.module.css';
import api from '../../utils/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageStats, setMessageStats] = useState({});
  const [activity, setActivity] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    activeConversations: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage first, then localStorage
    const adminToken = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivity();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load users
      const usersResponse = await api.get('/api/admin/users');
      setUsers(usersResponse.data || []);
      
      // Load messages
      const messagesResponse = await api.get('/api/admin/messages?limit=10');
      setMessages(messagesResponse.data.messages || []);
      setMessageStats(messagesResponse.data.stats || {});
      
      // Calculate stats
      const onlineCount = usersResponse.data?.filter(u => u.isOnline).length || 0;
      setStats({
        totalUsers: usersResponse.data?.length || 0,
        onlineUsers: onlineCount,
        totalMessages: messagesResponse.data.stats?.total || 0,
        activeConversations: messagesResponse.data.stats?.thisWeek || 0
      });
    } catch (error) {
      // For demo, use mock data
      const mockUsers = [
        { _id: '1', username: 'john_doe', email: 'john@example.com', isOnline: true, createdAt: new Date() },
        { _id: '2', username: 'jane_smith', email: 'jane@example.com', isOnline: false, createdAt: new Date() },
        { _id: '3', username: 'bob_wilson', email: 'bob@example.com', isOnline: true, createdAt: new Date() },
      ];
      setUsers(mockUsers);
      setStats({
        totalUsers: 3,
        onlineUsers: 2,
        totalMessages: 125,
        activeConversations: 8
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await api.get('/api/admin/activity');
      setActivity(response.data);
    } catch (error) {
      // Error loading activity
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/admin/users/${userId}`);
        toast.success('User deleted successfully');
        loadDashboardData();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard - QuickChat</title>
      </Head>
      <div className={styles.adminContainer}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <FiShield size={32} color="#0070f3" />
            <h2>Admin Panel</h2>
          </div>

          <nav className={styles.sidebarNav}>
            <button
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FiBarChart size={20} />
              <span>Overview</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <FiUsers size={20} />
              <span>Users</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'messages' ? styles.active : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <FiMessageSquare size={20} />
              <span>Messages</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'activity' ? styles.active : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <FiActivity size={20} />
              <span>Activity</span>
            </button>
          </nav>

          <div className={styles.sidebarFooter}>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <div className={styles.headerActions}>
              <span className={styles.adminBadge}>Administrator</span>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)' }}>
                    <FiUsers size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' }}>
                    <FiUserCheck size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{stats.onlineUsers}</h3>
                    <p>Online Users</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
                    <FiMessageSquare size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{stats.totalMessages}</h3>
                    <p>Total Messages</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
                    <FiActivity size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{stats.activeConversations}</h3>
                    <p>Active Chats</p>
                  </div>
                </div>
              </div>

              <div className={styles.recentActivity}>
                <h2>Recent Activity</h2>
                <div className={styles.activityList}>
                  <div className={styles.activityItem}>
                    <FiUserCheck size={20} color="#10b981" />
                    <div>
                      <p><strong>New user registered:</strong> john_doe</p>
                      <span>2 minutes ago</span>
                    </div>
                  </div>
                  <div className={styles.activityItem}>
                    <FiMessageSquare size={20} color="#0070f3" />
                    <div>
                      <p><strong>Message sent</strong> in conversation #42</p>
                      <span>5 minutes ago</span>
                    </div>
                  </div>
                  <div className={styles.activityItem}>
                    <FiActivity size={20} color="#f59e0b" />
                    <div>
                      <p><strong>User came online:</strong> jane_smith</p>
                      <span>10 minutes ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className={styles.usersTab}>
              <div className={styles.tableHeader}>
                <div className={styles.searchBar}>
                  <FiSearch size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className={styles.userCell}>
                            <img
                              src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                              alt={user.username}
                              className={styles.userAvatar}
                            />
                            <span>{user.username}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${user.isOnline ? styles.online : styles.offline}`}>
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              title="Toggle status"
                            >
                              {user.isActive !== false ? <FiUserCheck size={18} color="#10b981" /> : <FiUserX size={18} color="#ef4444" />}
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete user"
                            >
                              <FiTrash2 size={18} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className={styles.messagesTab}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
                    <FiMessageSquare size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{messageStats.total || 0}</h3>
                    <p>Total Messages</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' }}>
                    <FiCheckCircle size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{messageStats.today || 0}</h3>
                    <p>Today</p>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' }}>
                    <FiBarChart size={28} color="white" />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{messageStats.thisWeek || 0}</h3>
                    <p>This Week</p>
                  </div>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <h3>Recent Messages</h3>
                  <div className={styles.searchBox}>
                    <FiSearch size={18} />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Content</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr key={message._id}>
                        <td>
                          <div className={styles.userCell}>
                            <img
                              src={message.sender?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                              alt={message.sender?.username}
                              className={styles.userAvatar}
                            />
                            <span>{message.sender?.username || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.messageContent}>
                            {message.messageType === 'text' ? 
                              (message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : '')) :
                              `[${message.messageType}] ${message.fileName || 'File'}`
                            }
                          </div>
                        </td>
                        <td>
                          <span className={styles.typeBadge}>{message.messageType}</span>
                        </td>
                        <td>{new Date(message.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleDeleteUser(message._id)}
                            title="Delete message"
                          >
                            <FiTrash2 size={18} color="#ef4444" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className={styles.activityTab}>
              {activity ? (
                <>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)' }}>
                        <FiUsers size={28} color="white" />
                      </div>
                      <div className={styles.statContent}>
                        <h3>{activity.onlineUsersCount}/{activity.totalUsersCount}</h3>
                        <p>Online Users</p>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
                        <FiMessageSquare size={28} color="white" />
                      </div>
                      <div className={styles.statContent}>
                        <h3>{activity.messageStats.today}</h3>
                        <p>Messages Today</p>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' }}>
                        <FiBarChart size={28} color="white" />
                      </div>
                      <div className={styles.statContent}>
                        <h3>{activity.messageStats.thisWeek}</h3>
                        <p>This Week</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.activityGrid}>
                    <div className={styles.activityCard}>
                      <h3>Top Active Users</h3>
                      <div className={styles.activityList}>
                        {activity.topActiveUsers?.slice(0, 5).map((item, index) => (
                          <div key={index} className={styles.activityItem}>
                            <div className={styles.userCell}>
                              <img
                                src={item._id?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                alt={item._id?.username}
                                className={styles.userAvatar}
                              />
                              <span>{item._id?.username}</span>
                            </div>
                            <span className={styles.activityCount}>{item.messageCount} messages</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.activityCard}>
                      <h3>Recently Online</h3>
                      <div className={styles.activityList}>
                        {activity.recentUsers?.slice(0, 5).map((user) => (
                          <div key={user._id} className={styles.activityItem}>
                            <div className={styles.userCell}>
                              <img
                                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                alt={user.username}
                                className={styles.userAvatar}
                              />
                              <div>
                                <div>{user.username}</div>
                                <small style={{ color: 'var(--text-secondary)' }}>
                                  {user.isOnline ? 'Online now' : 
                                    `Last seen ${new Date(user.lastSeen).toLocaleTimeString()}`}
                                </small>
                              </div>
                            </div>
                            <span className={`${styles.statusBadge} ${user.isOnline ? styles.online : styles.offline}`}>
                              {user.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.loading}>Loading activity...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
