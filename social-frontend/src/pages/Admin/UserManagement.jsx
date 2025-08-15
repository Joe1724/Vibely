import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.jsx';

const UserManagement = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'banned', 'suspended'

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleSuspend = async (id) => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      try {
        await axios.put(`http://localhost:5000/api/admin/users/suspend/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.map(user => user._id === id ? { ...user, isVerified: false } : user));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to suspend user');
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm('Are you sure you want to activate this user?')) {
      try {
        await axios.put(`http://localhost:5000/api/admin/users/activate/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.map(user => user._id === id ? { ...user, isVerified: true } : user));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to activate user');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user permanently?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter(user => user._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'active' && user.isVerified) ||
                          (filterStatus === 'suspended' && !user.isVerified); // Assuming suspended means not verified
    return matchesSearch && matchesStatus;
  });

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold">User Management</h2>

      <div className="flex flex-col gap-4 mb-6 md:flex-row">
        <input
          type="text"
          placeholder="Search users by username or email..."
          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Username</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Email</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Role</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{user.username}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{user.email}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{user.role}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    {user.isVerified ? (
                      <span className="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">Active</span>
                    ) : (
                      <span className="inline-flex px-2 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full">Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => alert('Edit user functionality to be implemented')}
                      className="mr-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600"
                    >
                      Edit
                    </button>
                    {user.isVerified ? (
                      <button
                        onClick={() => handleSuspend(user._id)}
                        className="mr-2 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-600"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(user._id)}
                        className="mr-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-600"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user._id)}
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

export default UserManagement;