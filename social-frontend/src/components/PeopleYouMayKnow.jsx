import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

export default function PeopleYouMayKnow() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/suggestions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        setError('Could not fetch user suggestions.');
      }
    };

    if (token) {
      fetchSuggestions();
    }
  }, [token]);

  if (error) {
    return (
      <div className="p-6 mt-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">People You May Know</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 mt-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">People You May Know</h3>
      <ul className="space-y-4">
        {users.map((user) => (
          <li key={user._id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatar ? `http://localhost:5000${user.avatar}` : "https://via.placeholder.com/32"} alt="User Avatar" className="w-8 h-8 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{user.firstName} {user.surname}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
              </div>
            </div>
            <NavLink to={`/users/${user._id}`} className="px-3 py-1 text-sm text-white rounded-full bg-primary-DEFAULT hover:bg-primary-dark">
              View
            </NavLink>
          </li>
        ))}
        {users.length === 0 && <p className="text-sm text-gray-500">No suggestions right now.</p>}
      </ul>
    </div>
  );
}