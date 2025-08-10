import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bio, setBio] = useState(user.bio || '');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [middleName, setMiddleName] = useState(user.middleName || '');
  const [surname, setSurname] = useState(user.surname || '');
  const [username, setUsername] = useState(user.username || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [saveError, setSaveError] = useState('');
  const [openReactionPostId, setOpenReactionPostId] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('firstName', firstName);
      formData.append('middleName', middleName);
      formData.append('surname', surname);
      formData.append('username', username);
      if (avatarFile) formData.append('avatar', avatarFile);

      await axios.put('http://localhost:5000/api/users/me', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Upload cover separately if present
      if (coverFile) {
        try {
          const coverData = new FormData();
          coverData.append('cover', coverFile);
          await axios.put('http://localhost:5000/api/users/me/cover', coverData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (coverErr) {
          setSaveError(coverErr.response?.data?.message || 'Failed to update cover photo');
        }
      }

      if (!saveError) window.location.reload();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/posts?user=${user.id || user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(Array.isArray(res.data) ? res.data : res.data.posts || []);
    } catch (err) {
      // ignore for now
    }
  };

  useEffect(() => {
    fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?._id]);

  const handleLike = async (postId) => {
    await axios.put(
      `http://localhost:5000/api/posts/like/${postId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUserPosts();
  };

  const handleUnlike = async (postId) => {
    await axios.put(
      `http://localhost:5000/api/posts/unlike/${postId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUserPosts();
  };

  const handleComment = async (postId, text) => {
    await axios.post(
      `http://localhost:5000/api/posts/comment/${postId}`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUserPosts();
  };

  const setReaction = async (postId, type) => {
    await axios.put(`http://localhost:5000/api/posts/reaction/${postId}`, { type }, { headers: { Authorization: `Bearer ${token}` } });
    fetchUserPosts();
  };
  const clearReaction = async (postId) => {
    await axios.delete(`http://localhost:5000/api/posts/reaction/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchUserPosts();
  };
  const getReactionCounts = (post) => {
    const counts = { love: 0, haha: 0, wow: 0 };
    (post.reactions || []).forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type] += 1;
    });
    return counts;
  };
  const getMyReaction = (post) => {
    const me = String(user._id || user.id);
    const r = (post.reactions || []).find((x) => String(x.user) === me);
    return r ? r.type : null;
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Profile hero */}
        <section className="relative overflow-hidden shadow-xl rounded-2xl bg-white/90 dark:bg-gray-800/80 backdrop-blur ring-1 ring-black/5">
          <div className="relative">
            <div className="w-full h-44 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-indigo-600 dark:to-blue-500">
              {user.cover && (
                <img src={`http://localhost:5000${user.cover}`} alt="cover" className="object-cover w-full h-44" />
              )}
            </div>
            {user.avatar && (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt="avatar"
                className="absolute object-cover w-24 h-24 -translate-x-1/2 rounded-full left-1/2 -bottom-12 ring-4 ring-white dark:ring-gray-800"
              />
            )}
          </div>
          <div className="px-6 pt-16 pb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {[user.firstName, user.middleName, user.surname].filter(Boolean).join(' ') || user.username || 'Profile'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user.username ? `@${user.username}` : ''}</p>

            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                {Array.isArray(user.followers) ? user.followers.length : 0} followers
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {Array.isArray(user.following) ? user.following.length : 0} following
              </span>
            </div>

            <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
              <p className="flex items-center justify-center gap-2"><span className="font-semibold">Email:</span> {user.email}</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300"><span className="font-semibold">Bio:</span> {user.bio || '—'}</p>
            </div>

            <div className="mt-6">
              {isEditing ? (
                <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-4 text-left">
                  {saveError && (
                    <p className="p-2 text-sm text-red-600 bg-red-100 rounded-md">{saveError}</p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">First name</label>
                      <input
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Middle name (optional)</label>
                      <input
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Surname</label>
                      <input
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Username</label>
                      <input
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Shown as @username</p>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Bio</label>
                    <textarea
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Avatar</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Cover photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-700"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg shadow hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Posts */}
        <section>
          <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Your Posts</h3>
          <div className="space-y-4">
            {posts.map((p) => (
              <article key={p._id} className="overflow-hidden shadow rounded-2xl bg-white/90 backdrop-blur ring-1 ring-black/5 dark:bg-gray-800/80">
                {p.image && (
                  <img src={`http://localhost:5000${p.image}`} alt="" className="w-full max-h-[420px] object-cover" />
                )}
                {p.video && (
                  <video src={`http://localhost:5000${p.video}`} controls className="w-full max-h-[420px] object-contain bg-black" />
                )}
                <div className="p-4">
                  <p className="text-gray-800 whitespace-pre-wrap dark:text-gray-200">{p.text}</p>
                  {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
                    <div className="mt-1 space-x-2 text-xs text-blue-600 dark:text-blue-400">
                      {p.hashtags.map((h) => (
                        <span key={h}>#{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <div
                      className="relative"
                      onMouseEnter={() => setOpenReactionPostId(p._id)}
                      onMouseLeave={() => setOpenReactionPostId((cur) => (cur === p._id ? null : cur))}
                    >
                      <button
                        onClick={() => {
                          const mine = getMyReaction(p);
                          if (mine) clearReaction(p._id);
                          else setReaction(p._id, 'love');
                        }}
                        className={`inline-flex items-center gap-1 ${getMyReaction(p) ? 'text-red-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                        <span>{getMyReaction(p) ? '❤️' : '🤍'}</span>
                      </button>
                      {openReactionPostId === p._id && (
                        <div className="absolute left-0 z-10 flex items-center gap-2 px-2 py-1 rounded-full shadow -top-10 bg-white/95 dark:bg-gray-800/95 ring-1 ring-black/5">
                          <button className="transition hover:scale-110" onClick={() => setReaction(p._id, 'love')}>❤️</button>
                          <button className="transition hover:scale-110" onClick={() => setReaction(p._id, 'haha')}>😂</button>
                          <button className="transition hover:scale-110" onClick={() => setReaction(p._id, 'wow')}>😮</button>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const c = getReactionCounts(p);
                      const total = (c.love || 0) + (c.haha || 0) + (c.wow || 0);
                      if (total === 0) return null;
                      return (
                        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                          {c.love > 0 && (
                            <span className="inline-flex items-center gap-1"><span>❤️</span><span>{c.love}</span></span>
                          )}
                          {c.haha > 0 && (
                            <span className="inline-flex items-center gap-1"><span>😂</span><span>{c.haha}</span></span>
                          )}
                          {c.wow > 0 && (
                            <span className="inline-flex items-center gap-1"><span>😮</span><span>{c.wow}</span></span>
                          )}
                        </div>
                      );
                    })()}
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
                        handleComment(p._id, e.target.comment.value);
                        e.target.comment.value = '';
                      }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <input
                        name="comment"
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                        placeholder="Write a comment..."
                      />
                      <button type="submit" className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
            {posts.length === 0 && (
              <p className="text-sm text-gray-500">No posts yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
