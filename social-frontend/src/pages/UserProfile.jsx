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

  const openOrStartChat = async () => {
    try {
      // try to start or get direct conversation
      const res = await axios.post(
        'http://localhost:5000/api/chat/conversations/direct',
        { userId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const convo = res.data;
      // navigate via query param to open in sidebar
      window.history.pushState({}, '', `?c=${convo._id}`);
      // trigger sidebar to pick it up (location change already does)
    } catch (e) {
      alert('Unable to start conversation');
    }
  };

  if (!profile) return <div className="p-4 text-gray-700 dark:text-gray-200">Loading...</div>;

  return (
    <div className="px-4 py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-4xl">
        {/* Profile header */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-xl ring-1 ring-black/5">
          <div className="relative">
            <div className="h-48 w-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-indigo-600 dark:to-blue-500">
              {profile.cover && (
                <img src={`http://localhost:5000${profile.cover}`} alt="cover" className="h-48 w-full object-cover" />
              )}
            </div>
            {profile.avatar && (
              <img
                src={`http://localhost:5000${profile.avatar}`}
                alt="avatar"
                className="absolute -bottom-12 left-6 h-24 w-24 rounded-full ring-4 ring-white dark:ring-gray-800 object-cover"
              />
            )}
          </div>
          <div className="px-6 pt-16 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{[profile.firstName, profile.middleName, profile.surname].filter(Boolean).join(' ') || profile.username}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profile.username ? `@${profile.username}` : ''}</p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    {profile.followers?.length || 0} followers
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {profile.following?.length || 0} following
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={busy}
                  onClick={toggleFollow}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {profile.followers?.some((f) => f._id === user._id) ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={openOrStartChat}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-4">
          {posts.map((p) => (
            <article key={p._id} className="overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow ring-1 ring-black/5">
              {p.image && <img src={`http://localhost:5000${p.image}`} alt="" className="w-full max-h-[420px] object-cover" />}
              <div className="p-4">
                <p className="text-gray-800 dark:text-gray-200">{p.text}</p>
                <div className="mt-3 flex items-center gap-4">
                  {p.likes.includes(user._id) ? (
                    <button onClick={() => unlike(p._id)} className="inline-flex items-center gap-1 text-red-500 hover:opacity-80">
                      <span>❤️</span>
                      <span className="text-sm font-medium">{p.likes.length}</span>
                    </button>
                  ) : (
                    <button onClick={() => like(p._id)} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>🤍</span>
                      <span className="text-sm font-medium">{p.likes.length}</span>
                    </button>
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
                    className="mt-2 flex items-center gap-2"
                  >
                    <input
                      name="comment"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write a comment..."
                    />
                    <button type="submit" className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Send</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}


