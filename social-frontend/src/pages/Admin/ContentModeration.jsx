import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.jsx';

const ContentModeration = () => {
  const { token } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'reported'

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoint = filter === 'reported' ? 'http://localhost:5000/api/admin/posts/reported' : 'http://localhost:5000/api/admin/posts';
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPosts(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPosts();
    }
  }, [token, filter]);

  const handleApprove = async (id) => {
    if (window.confirm('Are you sure you want to approve this post and clear its reports?')) {
      try {
        await axios.put(`http://localhost:5000/api/admin/posts/approve/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(posts.map(post => post._id === id ? { ...post, reports: [] } : post));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve post');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post permanently?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(posts.filter(post => post._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete post');
      }
    }
  };

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold">Content Moderation</h2>

      <div className="mb-4">
        <select
          className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Posts</option>
          <option value="reported">Reported Posts</option>
        </select>
      </div>

      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Content</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Author</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Reports</th>
                {filter === 'reported' && (
                  <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Report Details</th>
                )}
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{post.content.substring(0, 50)}...</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{post.userId?.username || 'Unknown'}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{post.reports?.length || 0}</td>
                  {filter === 'reported' && (
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      {post.reports && post.reports.map((report, index) => (
                        <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                          Reported by: {report.reportedBy?.username || 'Unknown'} - Reason: {report.reason}
                        </div>
                      ))}
                    </td>
                  )}
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleApprove(post._id)}
                      className="mr-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContentModeration;