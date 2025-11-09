import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from '../../styles/auth.module.css';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.isAdmin) {
        // Use ONLY sessionStorage for per-tab sessions (allows multiple admin sessions in different tabs)
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('token', data.token);
        toast.success('Welcome Admin!');
        router.push('/admin/dashboard');
      } else {
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - QuickChat</title>
      </Head>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.authLogo}>
              <FiShield size={54} color="#0070f3" />
            </div>
            <h1>Admin Panel</h1>
            <p>QuickChat Administration</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className="input-group">
              <label htmlFor="email">Admin Email</label>
              <div className={styles.inputWithIcon}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Admin Password</label>
              <div className={styles.inputWithIcon}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter admin password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary ${styles.btnBlock}`}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Admin Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
