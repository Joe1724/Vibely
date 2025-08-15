import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';

function NotificationSettings() {
  const { user, token, fetchUser } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    email: { likes: true, comments: true, follows: true, messages: true },
    push: { likes: true, comments: true, follows: true, messages: true },
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && user.notificationSettings) {
      setSettings(user.notificationSettings);
    }
    setLoading(false);
  }, [user]);

  const handleToggleChange = (type, category) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [type]: {
        ...prevSettings[type],
        [category]: !prevSettings[type][category],
      },
    }));
  };

  const saveSettings = async () => {
    setMessage('');
    try {
      await axios.put(
        'http://localhost:5000/api/users/me/settings/notifications',
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchUser(); // Refresh user data to get updated settings
      setMessage('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Failed to save settings.');
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Notification Settings</h2>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${message.includes('successfully') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
          {message}
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">Email Notifications</h3>
        {Object.keys(settings.email).map(category => (
          <div key={category} className="flex items-center justify-between mb-3">
            <span className="text-gray-700 capitalize dark:text-gray-300">{category}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                className="sr-only peer"
                checked={settings.email[category]}
                onChange={() => handleToggleChange('email', category)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-DEFAULT"></div>
            </label>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">Push Notifications</h3>
        {Object.keys(settings.push).map(category => (
          <div key={category} className="flex items-center justify-between mb-3">
            <span className="text-gray-700 capitalize dark:text-gray-300">{category}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                value=""
                className="sr-only peer"
                checked={settings.push[category]}
                onChange={() => handleToggleChange('push', category)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-DEFAULT"></div>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={saveSettings}
        className="w-full px-4 py-2 mt-8 text-white transition-colors duration-200 rounded-lg bg-primary-DEFAULT hover:bg-primary-dark"
      >
        Save Settings
      </button>
    </div>
  );
}

export default NotificationSettings;