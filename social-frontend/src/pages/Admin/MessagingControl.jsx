import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext.jsx';

const MessagingControl = () => {
  const { token } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlaggedConversations = async () => {
      try {
        // This endpoint does not exist yet, so it will fail.
        // I will create it in the next step.
        const response = await axios.get('http://localhost:5000/api/admin/conversations/flagged', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setConversations(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch flagged conversations');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFlaggedConversations();
    }
  }, [token]);

  if (loading) return <p>Loading flagged conversations...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold">Messaging Control</h2>
      {conversations.length === 0 ? (
        <p>No flagged conversations found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Participants</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Last Message</th>
                <th className="px-4 py-2 text-sm font-semibold text-left text-gray-600 border-b-2 border-gray-200 dark:border-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((convo) => (
                <tr key={convo._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    {convo.participants.map(p => p.username).join(', ')}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    {convo.lastMessage?.content.substring(0, 50)}...
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600">
                      View
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

export default MessagingControl;