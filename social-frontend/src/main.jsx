import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker and request notification permissions
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        // Request notification permission
        if ('Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('Notification permission granted.');
              // Here you would typically subscribe the user to push notifications
              // and send the subscription object to your backend.
              // For example:
              // registration.pushManager.subscribe({
              //   userVisibleOnly: true,
              //   applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
              // }).then(subscription => {
              //   console.log('Push subscription:', subscription);
              //   // Send subscription to your backend
              // });
            } else {
              console.warn('Notification permission denied.');
            }
          });
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

