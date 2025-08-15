import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.jsx';

const Settings = () => {
  const { token } = useContext(AuthContext);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // This endpoint does not exist yet, so it will fail.
        // I will create it in the next step.
        const response = await axios.get('http://localhost:5000/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSettings(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSettings();
    }
  }, [token]);

  const handleSave = async () => {
    try {
      await axios.put('http://localhost:5000/api/admin/settings', settings, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) return <p>Loading settings...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold">Settings & Configuration</h2>
      {settings && (
        <div className="space-y-4">
          <div>
            <label className="block font-semibold">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block font-semibold">Theme Color</label>
            <input
              type="color"
              value={settings.themeColor}
              onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;