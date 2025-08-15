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
  const [openReactionPostId, setOpenReactionPostId] = useState(null);

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
  const addReply = async (postId, commentId, text) => {
    await axios.post(`http://localhost:5000/api/posts/reply/${postId}/${commentId}`, { text }, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };
  const addView = async (postId) => {
    try {
      await axios.post(`http://localhost:5000/api/posts/view/${postId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };
  const toggleBookmark = async (postId) => {
    await axios.put(`http://localhost:5000/api/users/me/bookmarks/${postId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };
  const setReaction = async (postId, type) => {
    await axios.put(`http://localhost:5000/api/posts/reaction/${postId}`, { type }, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };
  const clearReaction = async (postId) => {
    await axios.delete(`http://localhost:5000/api/posts/reaction/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };
  const getReactionCounts = (post) => {
    const counts = { love: 0, haha: 0, wow: 0 };
    (post.reactions || []).forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type] += 1;
    });
    return counts;
  };
  const getMyReaction = (post) => {
    const me = String(user._id);
    const r = (post.reactions || []).find((x) => String(x.user) === me);
    return r ? r.type : null;
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
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-5xl mx-auto">
        {/* Profile header */}
        <div className="relative overflow-hidden shadow-xl rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur ring-1 ring-black/5">
          <div className="relative">
            <div className="w-full h-48" style={{ backgroundColor: profile.profileThemeColor || '#3B82F6' }}>
              {profile.cover && (
                <img src={`http://localhost:5000${profile.cover}`} alt="cover" className="object-cover w-full h-48" />
              )}
            </div>
            {profile.avatar && (
              <img
                src={`http://localhost:5000${profile.avatar}`}
                alt="avatar"
                className="absolute object-cover w-24 h-24 rounded-full -bottom-12 left-6 ring-4 ring-white dark:ring-gray-800"
              />
            )}
          </div>
          <div className="px-6 pt-16 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {[profile.firstName, profile.middleName, profile.surname].filter(Boolean).join(' ') || profile.username}
                  {profile.isVerified && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profile.username ? `@${profile.username}` : ''}</p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.profileAccentColor || '#10B981' }}></span>
                    {profile.followers?.length || 0} followers
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.profileAccentColor || '#10B981' }}></span>
                    {profile.following?.length || 0} following
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profile.profileAccentColor || '#10B981' }}></span>
                    {profile.profileViews || 0} views
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={busy}
                  onClick={toggleFollow}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {profile.followers?.some((f) => f._id === user._id) ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  onClick={openOrStartChat}
                  className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
            <article key={p._id} onMouseEnter={() => addView(p._id)} className="overflow-hidden shadow rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur ring-1 ring-black/5">
              {p.image && <img src={`http://localhost:5000${p.image}`} alt="" className="w-full max-h-[420px] object-cover" />}
              <div className="p-4">
                <p className="text-gray-800 whitespace-pre-wrap dark:text-gray-200">{p.text}</p>
                {Array.isArray(p.hashtags) && p.hashtags.length > 0 && (
                  <div className="mt-1 space-x-2 text-xs text-blue-600 dark:text-blue-400">
                    {p.hashtags.map((h) => (
                      <span key={h}>#{h}</span>
                    ))}
                  </div>
                )}
                {p.video && <video src={`http://localhost:5000${p.video}`} controls className="w-full max-h-[420px] object-contain bg-black mt-2" />}
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
                  <button onClick={() => toggleBookmark(p._id)} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <span>🔖</span>
                  </button>
                  <span className="ml-auto text-xs text-gray-500">{p.views || 0} views</span>
                </div>
                <div className="mt-3">
                  {p.comments.map((c) => (
                    <div key={c._id} className="mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <b>{c.user?.username || ''}:</b> {c.text}
                      </p>
                      {Array.isArray(c.replies) && c.replies.length > 0 && (
                        <div className="mt-1 ml-4 space-y-1">
                          {c.replies.map((r) => (
                            <p key={r._id} className="text-xs text-gray-500 dark:text-gray-400">
                              <b>{r.user?.username}:</b> {r.text}
                            </p>
                          ))}
                        </div>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = e.target[`reply-${c._id}`].value;
                          addReply(p._id, c._id, text);
                          e.target[`reply-${c._id}`].value = '';
                        }}
                        className="flex items-center gap-2 mt-1 ml-4"
                      >
                        <input
                          name={`reply-${c._id}`}
                          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Reply..."
                        />
                        <button type="submit" className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                          Reply
                        </button>
                      </form>
                    </div>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      comment(p._id, e.target.comment.value);
                      e.target.comment.value = '';
                    }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <input
                      name="comment"
                      className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write a comment..."
                    />
                    <button type="submit" className="px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Send</button>
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


