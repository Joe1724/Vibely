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
  const [profileThemeColor, setProfileThemeColor] = useState(user.profileThemeColor || '#3B82F6');
  const [profileAccentColor, setProfileAccentColor] = useState(user.profileAccentColor || '#10B981');
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);

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
      formData.append('profileThemeColor', profileThemeColor);
      formData.append('profileAccentColor', profileAccentColor);
      formData.append('isPrivate', isPrivate);

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
    <div className="w-full min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Profile hero */}
        <section className="relative overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="relative">
            <div className="w-full h-48" style={{ backgroundColor: user.profileThemeColor || '#3B82F6' }}>
              {user.cover && (
                <img src={`http://localhost:5000${user.cover}`} alt="cover" className="object-cover w-full h-48" />
              )}
            </div>
            {user.avatar && (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt="avatar"
                className="absolute object-cover -translate-x-1/2 rounded-full shadow-md w-28 h-28 left-1/2 -bottom-14 ring-4 ring-white dark:ring-gray-800"
              />
            )}
          </div>
          <div className="px-6 pt-20 pb-8 text-center">
            <h2 className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
              {[user.firstName, user.middleName, user.surname].filter(Boolean).join(' ') || user.username || 'Profile'}
              {user.isVerified && (
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              )}
            </h2>
            <p className="mt-1 text-base text-gray-600 dark:text-gray-400">{user.username ? `@${user.username}` : ''}</p>

            <div className="flex items-center justify-center gap-6 mt-5 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user.profileAccentColor || '#10B981' }} />
                {Array.isArray(user.followers) ? user.followers.length : 0} followers
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user.profileAccentColor || '#10B981' }} />
                {Array.isArray(user.following) ? user.following.length : 0} following
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: user.profileAccentColor || '#10B981' }} />
                {user.profileViews || 0} views
              </span>
            </div>

            <div className="mt-6 text-base text-gray-700 dark:text-gray-300">
              <p className="flex items-center justify-center gap-2"><span className="font-semibold">Email:</span> {user.email}</p>
              <p className="mt-2 text-gray-700 dark:text-gray-300"><span className="font-semibold">Bio:</span> {user.bio || 'No bio provided.'}</p>
            </div>

            <div className="mt-8">
              {isEditing ? (
                <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-5 text-left">
                  {saveError && (
                    <p className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300">{saveError}</p>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                      <input
                        className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Middle name (optional)</label>
                      <input
                        className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Surname</label>
                      <input
                        className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                      <input
                        className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Shown as @username</p>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                    <textarea
                      className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Avatar</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        className="w-full text-sm transition-colors duration-200 ease-in-out file:mr-4 file:rounded-lg file:border-0 file:bg-primary-DEFAULT file:px-4 file:py-2 file:text-white hover:file:bg-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cover photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="w-full text-sm transition-colors duration-200 ease-in-out file:mr-4 file:rounded-lg file:border-0 file:bg-secondary-DEFAULT file:px-4 file:py-2 file:text-white hover:file:bg-secondary-dark"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Profile Theme Color</label>
                      <input
                        type="color"
                        value={profileThemeColor}
                        onChange={(e) => setProfileThemeColor(e.target.value)}
                        className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Profile Accent Color</label>
                      <input
                        type="color"
                        value={profileAccentColor}
                        onChange={(e) => setProfileAccentColor(e.target.value)}
                        className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Private Account</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isPrivate}
                          onChange={() => setIsPrivate(!isPrivate)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${isPrivate ? 'bg-primary-DEFAULT' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isPrivate ? 'translate-x-full' : ''}`}></div>
                      </div>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">If your account is private, only people you approve can see your photos and videos on Social.</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 text-base font-medium text-white transition-all duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2 text-base font-medium text-gray-800 transition-colors duration-200 ease-in-out bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-base font-medium text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-base font-medium text-white transition-colors duration-200 ease-in-out bg-red-600 rounded-lg shadow-md hover:bg-red-700"
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
          <h3 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Your Posts</h3>
          <div className="space-y-6">
            {posts.map((p) => (
              <article key={p._id} className="p-6 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
                {p.image && (
                  <img src={`http://localhost:5000${p.image}`} alt="" className="w-full max-h-[420px] object-cover rounded-lg mb-4" />
                )}
                {p.video && (
                  <video src={`http://localhost:5000${p.video}`} controls className="w-full max-h-[420px] object-contain bg-black rounded-lg mb-4" />
                )}
                <div className="mb-4">
                  <p className="text-base text-gray-800 whitespace-pre-wrap dark:text-gray-200">{p.text}</p>
                  {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-primary-DEFAULT dark:text-primary-light">
                      {p.hashtags.map((h) => (
                        <span key={h} className="font-medium">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      className={`inline-flex items-center gap-1 text-lg transition-colors duration-200 ease-in-out ${getMyReaction(p) ? 'text-red-500' : 'text-gray-500 hover:text-primary-DEFAULT'}`}
                    >
                      <span>{getMyReaction(p) ? '❤️' : '🤍'}</span>
                    </button>
                    {openReactionPostId === p._id && (
                      <div className="absolute left-0 z-10 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg -top-12 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
                        <button className="text-2xl transition-transform duration-200 ease-in-out hover:scale-125" onClick={() => setReaction(p._id, 'love')}>❤️</button>
                        <button className="text-2xl transition-transform duration-200 ease-in-out hover:scale-125" onClick={() => setReaction(p._id, 'haha')}>😂</button>
                        <button className="text-2xl transition-transform duration-200 ease-in-out hover:scale-125" onClick={() => setReaction(p._id, 'wow')}>😮</button>
                      </div>
                    )}
                  </div>
                  {(() => {
                    const c = getReactionCounts(p);
                    const total = (c.love || 0) + (c.haha || 0) + (c.wow || 0);
                    if (total === 0) return null;
                    return (
                      <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  {p.comments.map((c) => (
                    <div key={c._id} className="p-2 mb-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <b>{c.user?.username || ''}:</b> {c.text}
                      </p>
                      {Array.isArray(c.replies) && c.replies.length > 0 && (
                        <div className="mt-2 ml-4 space-y-2">
                          {c.replies.map((r) => (
                            <p key={r._id} className="text-xs text-gray-600 dark:text-gray-300">
                              <b>{r.user?.username}:</b> {r.text}
                            </p>
                          ))}
                        </div>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = e.target.reply.value;
                          addReply(p._id, c._id, text);
                          e.target.reply.value = '';
                        }}
                        className="flex items-center gap-2 mt-2 ml-4"
                      >
                        <input
                          name="reply"
                          className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-1 focus:ring-primary-DEFAULT focus:border-transparent"
                          placeholder="Reply..."
                        />
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-gray-800 transition-colors duration-200 ease-in-out bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                          Reply
                        </button>
                      </form>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleComment(p._id, e.target.comment.value);
                      e.target.comment.value = '';
                    }}
                    className="flex items-center gap-2 mt-3"
                  >
                    <input
                      name="comment"
                      className="flex-1 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                      placeholder="Write a comment..."
                    />
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark">
                      Send
                    </button>
                  </form>
                </div>
              </article>
            ))}
            {posts.length === 0 && (
              <p className="py-4 text-sm text-center text-gray-500 dark:text-gray-400">No posts yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
