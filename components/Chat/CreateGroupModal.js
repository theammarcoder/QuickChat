import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiUsers, FiCheck } from 'react-icons/fi';
import styles from '../../styles/modal.module.css';
import api from '../../utils/api';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/api/users');
      setAvailableUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 members');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/groups', {
        groupName: groupName.trim(),
        participants: selectedUsers
      });

      toast.success('Group created successfully!');
      onGroupCreated && onGroupCreated(response.data);
      onClose();
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2><FiUsers size={24} /> Create Group</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className={styles.modalBody}>
          <div className="input-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              type="text"
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div className={styles.membersSection}>
            <label>Select Members (minimum 2)</label>
            <div className={styles.selectedCount}>
              {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
            </div>

            {loadingUsers ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className={styles.usersList}>
                {availableUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`${styles.userItem} ${selectedUsers.includes(user._id) ? styles.selected : ''}`}
                    onClick={() => toggleUserSelection(user._id)}
                  >
                    <div className={styles.userItemInfo}>
                      <img
                        src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={user.username}
                        className="avatar avatar-sm"
                      />
                      <div>
                        <h4>{user.username}</h4>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <div className={styles.checkIcon}>
                        <FiCheck size={20} color="white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || selectedUsers.length < 2}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
