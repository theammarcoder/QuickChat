import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiMessageCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from '../styles/auth.module.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(formData);
    
    if (result.success) {
      // Check if user is admin and redirect to admin dashboard
      const userData = JSON.parse(sessionStorage.getItem('user'));
      if (userData && userData.isAdmin) {
        toast.success('Welcome Admin!');
        router.push('/admin/dashboard');
      } else {
        toast.success('Welcome back!');
        router.push('/');
      }
    } else {
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login - QuickChat</title>
      </Head>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.authLogo}>
              <FiMessageCircle size={54} color="#0070f3" />
            </div>
            <h1>QuickChat</h1>
            <p>Welcome back! Please login to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <div className={styles.inputWithIcon}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className={styles.inputWithIcon}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p>
              Don't have an account?{' '}
              <Link href="/register" className={styles.authLink}>
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
