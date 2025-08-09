import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function UserProfile() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    const [u, p] = await Promise.all([
      axios.get(`http://localhost:5000/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`http://localhost:5000/api/posts?user=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    setProfile(u.data);
    setPosts(Array.isArray(p.data) ? p.data : p.data.posts || []);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const like = async (postId) => {
    await axios.put(`http://localhost:5000/api/posts/like/${postId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const toggleFollow = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const amFollowing = profile.followers?.some((f) => f._id === user._id);
      const url = `http://localhost:5000/api/users/${id}/${amFollowing ? 'unfollow' : 'follow'}`;
      await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAll();
    } finally {
      setBusy(false);
    }
  };
  const unlike = async (postId) => {
    await axios.put(`http://localhost:5000/api/posts/unlike/${postId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };
  const comment = async (postId, text) => {
    await axios.post(`http://localhost:5000/api/posts/comment/${postId}`, { text }, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  if (!profile) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-2xl p-4 mx-auto">
      <div className="p-0 mb-6 overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
        {profile.cover ? (
          <img src={`http://localhost:5000${profile.cover}`} alt="cover" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gray-200 dark:bg-gray-700" />
        )}
        <div className="p-6">
          {profile.avatar && (
            <img src={`http://localhost:5000${profile.avatar}`} alt="avatar" className="w-24 h-24 rounded-full" />
          )}
          <h2 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">{profile.username}</h2>
          <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
            <span>{profile.followers?.length || 0} followers</span>
            <span>{profile.following?.length || 0} following</span>
          </div>
          <div className="mt-3">
            <button
              disabled={busy}
              onClick={toggleFollow}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded"
            >
              {profile.followers?.some((f) => f._id === user._id) ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p._id} className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            {p.image && <img src={`http://localhost:5000${p.image}`} alt="" className="mb-2 rounded" />}
            <p className="text-gray-800 dark:text-gray-200">{p.text}</p>
            <div className="flex items-center gap-4 mt-3">
              {p.likes.includes(user._id) ? (
                <button onClick={() => unlike(p._id)} className="text-red-500">❤️ {p.likes.length}</button>
              ) : (
                <button onClick={() => like(p._id)} className="text-gray-500">🤍 {p.likes.length}</button>
              )}
            </div>
            <div className="mt-3">
              {p.comments.map((c) => (
                <p key={c._id} className="text-sm text-gray-600 dark:text-gray-400">
                  <b>{c.user?.username || ''}:</b> {c.text}
                </p>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  comment(p._id, e.target.comment.value);
                  e.target.comment.value = '';
                }}
                className="flex gap-2 mt-2"
              >
                <input name="comment" className="flex-1 p-2 border rounded-lg" placeholder="Write a comment..." />
                <button type="submit" className="px-3 py-1 bg-gray-200 rounded-lg">Send</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


