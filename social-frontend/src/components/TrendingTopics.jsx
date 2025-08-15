import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function TrendingTopics() {
  const { token } = useContext(AuthContext);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/trending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTopics(res.data);
      } catch (err) {
        setError('Could not fetch trending topics.');
      }
    };

    if (token) {
      fetchTopics();
    }
  }, [token]);

  if (error) {
    return <div className="p-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Trending Topics</h3>
      <p className="text-sm text-red-500">{error}</p>
    </div>;
  }

  return (
    <div className="p-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Trending Topics</h3>
      <ul className="space-y-3">
        {topics.map((topic) => (
          <li key={topic.hashtag}>
            <a href={`/posts?q=%23${topic.hashtag}`} className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-primary-DEFAULT">
              #{topic.hashtag}
              <span className="text-sm text-gray-500">{topic.count} posts</span>
            </a>
          </li>
        ))}
        {topics.length === 0 && <p className="text-sm text-gray-500">No trending topics right now.</p>}
      </ul>
    </div>
  );
}