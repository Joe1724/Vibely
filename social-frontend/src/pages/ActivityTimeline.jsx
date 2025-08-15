import React, { useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

function ActivityTimeline() {
  const { token } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!token || !hasMore) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/activities?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(prevActivities => [...prevActivities, ...res.data]);
      setHasMore(res.data.length > 0); // Assuming empty array means no more data
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, hasMore]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActionText = (activity) => {
    const username = activity.user?.username || 'Someone';
    switch (activity.type) {
      case 'post':
        return `${username} created a new post.`;
      case 'like':
        return `${username} liked a post.`;
      case 'comment':
        return `${username} commented on a post.`;
      case 'follow':
        return `${username} started following someone.`; // This will be the user who was followed
      case 'message':
        return `${username} sent a message.`;
      default:
        return `${username} performed an action.`;
    }
  };

  const getLinkPath = (activity) => {
    switch (activity.type) {
      case 'post':
      case 'like':
      case 'comment':
        return `/posts/${activity.refId}`;
      case 'follow':
        return `/users/${activity.refId}`; // Link to the user who was followed
      case 'message':
        // This might need more specific routing depending on your chat implementation
        return `/chat?c=${activity.refId}`; // Assuming refId is conversation ID for messages
      default:
        return '#'; // Fallback for unknown types
    }
  };

  return (
    <div className="max-w-3xl p-6 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Timeline</h2>

      {loading && page === 1 ? (
        <div className="py-8 text-center">Loading activities...</div>
      ) : (
        <div className="space-y-4">
          {activities.length === 0 && !loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No activities yet.</p>
          ) : (
            activities.map(activity => (
              <div key={activity._id} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <p className="text-gray-800 dark:text-gray-200">
                  {getActionText(activity)}
                </p>
                {activity.refId && (
                  <Link to={getLinkPath(activity)} className="block mt-1 text-sm text-primary-DEFAULT hover:underline">
                    View Details
                  </Link>
                )}
                <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setPage(prevPage => prevPage + 1)}
                disabled={loading}
                className="px-4 py-2 text-white rounded-lg bg-primary-DEFAULT hover:bg-primary-dark disabled:opacity-60"
              >
                {loading ? 'Loading More...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;