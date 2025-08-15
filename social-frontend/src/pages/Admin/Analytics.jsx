import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.jsx';

const Analytics = () => {
  const { token } = useContext(AuthContext);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // This endpoint does not exist yet, so it will fail.
        // I will create it in the next step.
        const response = await axios.get('http://localhost:5000/api/admin/analytics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAnalyticsData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalyticsData();
    }
  }, [token]);

  if (loading) return <p>Loading analytics data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold">Analytics</h2>
      {analyticsData ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h3 className="font-semibold">User Engagement</h3>
            <p>Average Time Spent: {analyticsData.userEngagement.avgTimeSpent}</p>
            <p>Daily Logins: {analyticsData.userEngagement.dailyLogins}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h3 className="font-semibold">Growth Stats</h3>
            <p>New Users (Day): {analyticsData.growthStats.newUsersToday}</p>
            <p>New Users (Week): {analyticsData.growthStats.newUsersThisWeek}</p>
            <p>New Users (Month): {analyticsData.growthStats.newUsersThisMonth}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 md:col-span-2">
            <h3 className="font-semibold">Top Content</h3>
            <ul>
              {analyticsData.topContent.map(post => (
                <li key={post._id}>{post.content.substring(0, 50)}... (Likes: {post.likes.length})</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>No analytics data available.</p>
      )}
    </div>
  );
};

export default Analytics;