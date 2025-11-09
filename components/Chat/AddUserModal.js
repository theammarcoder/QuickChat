import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiSearch, FiUserPlus } from 'react-icons/fi';
import styles from '../../styles/modal.module.css';
import api from '../../utils/api';

export default function AddUserModal({ isOpen, onClose, onUserAdded }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = allUsers.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone && user.phone.includes(query))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users');
      setAllUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (user) => {
    try {
      await api.post('/api/chats', {
        participantId: user._id
      });
      
      toast.success(`Added ${user.username} to your contacts!`);
      onUserAdded && onUserAdded(user);
      onClose();
    } catch (error) {
      toast.error('Failed to add user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2><FiUserPlus size={24} /> Add User</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.searchBox}>
            <FiSearch size={20} />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className={styles.usersList}>
              {filteredUsers.map((user) => (
                <div key={user._id} className={styles.userListItem} onClick={() => handleAddUser(user)}>
                  <img
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={user.username}
                    className="avatar"
                  />
                  <div className={styles.userInfo}>
                    <h4>{user.username}</h4>
                  </div>
                  <FiUserPlus size={20} className={styles.addIcon} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyUsers}>
              <FiUserPlus size={48} color="#cbd5e1" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
