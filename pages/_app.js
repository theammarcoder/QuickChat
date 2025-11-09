import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Socket.IO server
    fetch('/api/socket').catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <ChatProvider>
        <Component {...pageProps} />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
      </ChatProvider>
    </AuthProvider>
  );
}

export default MyApp;
