import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiCamera, FiLogOut, FiArrowLeft } from 'react-icons/fi';
import styles from '../styles/profile.module.css';

export default function Profile() {
  const { user, logout, updateAvatar, loading } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.isAdmin) {
      // Redirect admin users to admin dashboard
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  const handleAvatarChange = async () => {
    const avatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    ];

    if (avatarUrl) {
      setIsChangingAvatar(true);
      const result = await updateAvatar(avatarUrl);
      setIsChangingAvatar(false);
      
      if (result.success) {
        toast.success('Avatar updated successfully!');
        setAvatarUrl('');
      } else {
        toast.error(result.message);
      }
    }
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setAvatarUrl(newAvatar);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login');
    }
  };

  if (loading || !user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - QuickChat</title>
      </Head>
      <div className={styles.profileContainer}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <button onClick={() => router.push('/')} className="btn-icon">
              <FiArrowLeft size={24} />
            </button>
            <h1>Profile Settings</h1>
            <div></div>
          </div>

          <div className={styles.profileContent}>
            {/* Avatar Section */}
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <img
                  src={avatarUrl || user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt="Avatar"
                  className={styles.avatarLarge}
                />
                <button
                  className={styles.avatarEditBtn}
                  onClick={generateRandomAvatar}
                  title="Generate random avatar"
                >
                  <FiCamera size={20} />
                </button>
              </div>
              
              {avatarUrl && (
                <div className={styles.avatarActions}>
                  <button
                    onClick={handleAvatarChange}
                    className="btn btn-primary"
                    disabled={isChangingAvatar}
                  >
                    {isChangingAvatar ? 'Saving...' : 'Save Avatar'}
                  </button>
                  <button
                    onClick={() => setAvatarUrl('')}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <p className={styles.avatarHint}>
                Click the camera icon to generate a random avatar
              </p>
            </div>

            {/* User Info Section */}
            <div className={styles.infoSection}>
              <h2>Account Information</h2>
              
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <FiUser size={24} color="#0070f3" />
                </div>
                <div className={styles.infoContent}>
                  <label>Username</label>
                  <p>{user?.username}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <FiMail size={24} color="#0070f3" />
                </div>
                <div className={styles.infoContent}>
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <div className={`status-badge ${user?.isOnline ? '' : 'offline'}`}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: user?.isOnline ? '#10b981' : '#94a3b8' }}></div>
                  </div>
                </div>
                <div className={styles.infoContent}>
                  <label>Status</label>
                  <p>{user?.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsSection}>
              <button
                onClick={handleLogout}
                className={`btn btn-danger ${styles.logoutBtn}`}
              >
                <FiLogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
