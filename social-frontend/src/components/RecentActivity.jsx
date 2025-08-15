import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

export default function RecentActivity() {
  const { token } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/activities', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActivities(res.data);
      } catch (err) {
        setError('Could not fetch recent activity.');
      }
    };

    if (token) {
      fetchActivities();
    }
  }, [token]);

  const renderActivity = (activity) => {
    switch (activity.type) {
      case 'like':
        return <span>liked a <NavLink to={`/posts/${activity.refId}`} className="text-primary-DEFAULT">post</NavLink>.</span>;
      case 'comment':
        return <span>commented on a <NavLink to={`/posts/${activity.refId}`} className="text-primary-DEFAULT">post</NavLink>.</span>;
      case 'follow':
        return <span>started following <NavLink to={`/users/${activity.refId}`} className="text-primary-DEFAULT">someone</NavLink>.</span>;
      default:
        return null;
    }
  }

  if (error) {
    return (
      <div className="p-6 mt-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Recent Activity</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 mt-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Recent Activity</h3>
      <ul className="space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <li key={activity._id} className="text-sm text-gray-500 dark:text-gray-400">
            <NavLink to={`/users/${activity.user._id}`} className="font-semibold text-gray-700 dark:text-gray-300">{activity.user.username}</NavLink>
            {' '}
            {renderActivity(activity)}
          </li>
        ))}
        {activities.length === 0 && <p className="text-sm text-gray-500">No recent activity.</p>}
      </ul>
    </div>
  );
}