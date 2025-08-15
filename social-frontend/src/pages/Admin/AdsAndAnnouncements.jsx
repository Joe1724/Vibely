import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.jsx';

const AdsAndAnnouncements = () => {
  const { token } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for new announcement
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // State for new ad
  const [newAd, setNewAd] = useState({ title: '', content: '', link: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // These endpoints do not exist yet, so they will fail.
        // I will create them in the next steps.
        const [announcementsRes, adsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/announcements', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/admin/ads', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setAnnouncements(announcementsRes.data);
        setAds(adsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      const response = await axios.post('http://localhost:5000/api/admin/announcements', { content: newAnnouncement }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements([...announcements, response.data]);
      setNewAnnouncement('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/announcements/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements(announcements.filter(a => a._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete announcement');
      }
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.title.trim() || !newAd.content.trim()) return;
    try {
      const response = await axios.post('http://localhost:5000/api/admin/ads', newAd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAds([...ads, response.data]);
      setNewAd({ title: '', content: '', link: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ad');
    }
  };

  const handleDeleteAd = async (id) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/ads/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAds(ads.filter(ad => ad._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete ad');
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold">Ads & Announcements</h2>

      {/* Announcements Section */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold">Announcements</h3>
        <form onSubmit={handleCreateAnnouncement} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="New announcement..."
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Create</button>
        </form>
        <ul className="space-y-2">
          {announcements.map(ann => (
            <li key={ann._id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700">
              <span>{ann.content}</span>
              <button onClick={() => handleDeleteAnnouncement(ann._id)} className="text-red-500 hover:text-red-700">Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Ads Section */}
      <div>
        <h3 className="mb-4 text-xl font-semibold">Advertisements</h3>
        <form onSubmit={handleCreateAd} className="p-4 mb-4 space-y-2 border rounded-lg dark:border-gray-600">
          <input
            type="text"
            value={newAd.title}
            onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
            placeholder="Ad Title"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <textarea
            value={newAd.content}
            onChange={(e) => setNewAd({ ...newAd, content: e.target.value })}
            placeholder="Ad Content"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            value={newAd.link}
            onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
            placeholder="Ad Link (e.g., https://example.com)"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Create Ad</button>
        </form>
        <ul className="space-y-2">
          {ads.map(ad => (
            <li key={ad._id} className="p-2 rounded bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{ad.title}</p>
                  <p>{ad.content}</p>
                  <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{ad.link}</a>
                </div>
                <button onClick={() => handleDeleteAd(ad._id)} className="text-red-500 hover:text-red-700">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdsAndAnnouncements;