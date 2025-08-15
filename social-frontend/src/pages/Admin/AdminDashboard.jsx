import React, { useState, useEffect, useContext } from 'react';
import AdminSidebar from '../../components/AdminSidebar.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import axios from 'axios';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-white">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

        {dashboardData && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Stats */}
            <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold">User Statistics</h2>
              <p>Total Users: {dashboardData.userStats.totalUsers}</p>
              <p>Active Users Today: {dashboardData.userStats.activeUsersToday}</p>
              <p>New Sign-ups Today: {dashboardData.userStats.newSignUpsToday}</p>
            </div>

            {/* Post Stats */}
            <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold">Post Statistics</h2>
              <p>Total Posts: {dashboardData.postStats.totalPosts}</p>
              <p>Flagged Posts: {dashboardData.postStats.flaggedPosts}</p>
            </div>

            {/* Report Stats */}
            <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold">Report Statistics</h2>
              <p>Active Reports: {dashboardData.reportStats.activeReports}</p>
            </div>

            {/* Recent Activities */}
            <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-3">
              <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
              {dashboardData.recentActivities.length > 0 ? (
                <ul className="space-y-2">
                  {dashboardData.recentActivities.map((activity) => (
                    <li key={activity._id} className="pb-2 border-b border-gray-200 dark:border-gray-700">
                      <p>
                        <span className="font-medium">{activity.userId?.username || 'Unknown'}</span>{' '}
                        {activity.type} {activity.postId ? `on post "${activity.postId.content.substring(0, 20)}..."` : ''}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent activity.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;