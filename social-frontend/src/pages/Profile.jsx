import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bio, setBio] = useState(user.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await axios.put('http://localhost:5000/api/users/me', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // naive local update
      if (coverFile) {
        const coverData = new FormData();
        coverData.append('cover', coverFile);
        await axios.put('http://localhost:5000/api/users/me/cover', coverData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
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

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="mb-4 -mx-8 -mt-8">
          {user.cover ? (
            <img src={`http://localhost:5000${user.cover}`} alt="cover" className="object-cover w-full h-40 rounded-t-lg" />
          ) : (
            <div className="w-full h-40 bg-gray-200 rounded-t-lg dark:bg-gray-700" />
          )}
        </div>
        <h2 className="mb-2 text-3xl font-semibold text-center text-gray-800 dark:text-gray-100">Profile</h2>
        <p className="mb-4 text-sm text-center text-gray-600 dark:text-gray-300">
          {Array.isArray(user.followers) ? user.followers.length : 0} followers · {Array.isArray(user.following) ? user.following.length : 0} following
        </p>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          {user.avatar && (
            <img src={`http://localhost:5000${user.avatar}`} alt="avatar" className="w-24 h-24 mx-auto rounded-full" />
          )}
          <p><span className="font-bold">Name:</span> {[user.firstName, user.middleName, user.surname].filter(Boolean).join(' ') || '—'}</p>
          <p><span className="font-bold">Username:</span> {user.username ? `@${user.username}` : '—'}</p>
          <p><span className="font-bold">Email:</span> {user.email}</p>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block mb-1 text-sm">Bio</label>
                <textarea className="w-full p-2 border rounded" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Avatar</label>
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block mb-1 text-sm">Cover Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex gap-2">
                <button disabled={saving} className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded dark:bg-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-white bg-blue-600 rounded">
              Edit Profile
            </button>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 mt-8 font-semibold text-white transition bg-red-600 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
        </div>

        <div className="mt-10">
          <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-100">Your Posts</h3>
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p._id} className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
                {p.image && (
                  <img src={`http://localhost:5000${p.image}`} alt="" className="mb-2 rounded" />
                )}
                <p className="text-gray-800 dark:text-gray-200">{p.text}</p>
                <div className="flex items-center gap-4 mt-3">
                  {p.likes.includes(user._id) ? (
                    <button onClick={() => handleUnlike(p._id)} className="text-red-500">❤️ {p.likes.length}</button>
                  ) : (
                    <button onClick={() => handleLike(p._id)} className="text-gray-500">🤍 {p.likes.length}</button>
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
                      handleComment(p._id, e.target.comment.value);
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
            {posts.length === 0 && (
              <p className="text-sm text-gray-500">No posts yet.</p>
            )}
          </div>
        </div>
    </div>
  );
}
