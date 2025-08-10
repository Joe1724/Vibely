import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Posts() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const [openReactionPostId, setOpenReactionPostId] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Respond to top-bar search (?q=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim();
    if (!q) {
      // back to normal feed
      setHasMore(true);
      setPage(1);
      fetchPosts(1);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/posts/search?query=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPosts(res.data);
        setHasMore(false);
      } catch {}
    })();
  }, [location.search]);

  const fetchPosts = async (nextPage = 1) => {
    const res = await axios.get(`http://localhost:5000/api/posts?page=${nextPage}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (Array.isArray(res.data)) {
      // fallback when backend returns full list (no pagination)
      setPosts(res.data);
      setHasMore(false);
      setPage(1);
    } else {
      setPosts((prev) => (nextPage === 1 ? res.data.posts : [...prev, ...res.data.posts]));
      setHasMore(res.data.hasMore);
      setPage(nextPage);
    }
  };

  const lastPostRef = useCallback(
    (node) => {
      if (!hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts(page + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [hasMore, page]
  );

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;

    try {
      const formData = new FormData();
      formData.append('text', newPost);
      if (mediaFile) formData.append('media', mediaFile);

      const res = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts([res.data, ...posts]);
      setNewPost('');
      setMediaFile(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      alert(msg);
      console.error('Create post failed:', err);
    }
  };

  const handleLike = async (postId) => {
    await axios.put(
      `http://localhost:5000/api/posts/like/${postId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchPosts();
  };

  const handleUnlike = async (postId) => {
    await axios.put(
      `http://localhost:5000/api/posts/unlike/${postId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchPosts();
  };

  // Optional: richer reactions
  const setReaction = async (postId, type) => {
    await axios.put(`http://localhost:5000/api/posts/reaction/${postId}`, { type }, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };
  const clearReaction = async (postId) => {
    await axios.delete(`http://localhost:5000/api/posts/reaction/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };

  const getMyReaction = (post) => {
    const me = String(user._id);
    const r = (post.reactions || []).find((x) => String(x.user) === me);
    return r ? r.type : null;
  };
  const getReactionCounts = (post) => {
    const counts = { love: 0, haha: 0, wow: 0 };
    (post.reactions || []).forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type] += 1;
    });
    return counts;
  };

  const handleComment = async (postId, text) => {
    await axios.post(
      `http://localhost:5000/api/posts/comment/${postId}`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchPosts();
  };
  const editPost = async (postId, currentText) => {
    const text = window.prompt('Edit post text:', currentText || '');
    if (text === null) return;
    await axios.put(`http://localhost:5000/api/posts/${postId}`, { text }, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };
  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await axios.delete(`http://localhost:5000/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts(1);
  };
  const addReply = async (postId, commentId, text) => {
    await axios.post(
      `http://localhost:5000/api/posts/reply/${postId}/${commentId}`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchPosts();
  };
  const toggleBookmark = async (postId) => {
    await axios.put(`http://localhost:5000/api/users/me/bookmarks/${postId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };
  const addView = async (postId) => {
    try {
      await axios.post(`http://localhost:5000/api/posts/view/${postId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Create Post */}
      <form onSubmit={handleCreatePost} className="p-4 overflow-hidden shadow rounded-2xl bg-white/90 dark:bg-gray-800/80 backdrop-blur ring-1 ring-black/5">
        <textarea
          className="w-full px-3 py-3 text-sm bg-white border border-gray-300 rounded-xl dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex items-center justify-between mt-3">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700"
          >
            Post
          </button>
        </div>
      </form>

      {/* Post Feed */}
      {posts.map((post, idx) => (
        <article
          key={post._id}
          ref={idx === posts.length - 1 ? lastPostRef : undefined}
          className="overflow-hidden shadow rounded-2xl bg-white/90 dark:bg-gray-800/80 backdrop-blur ring-1 ring-black/5"
          onMouseEnter={() => addView(post._id)}
        >
          {post.image && (
            <img src={`http://localhost:5000${post.image}`} alt="" className="w-full max-h-[520px] object-cover" />
          )}
          {post.video && (
            <video src={`http://localhost:5000${post.video}`} controls className="w-full max-h-[520px] object-contain bg-black" />
          )}
          <div className="p-4">
            <p className="text-gray-800 whitespace-pre-wrap dark:text-gray-200">
              {post.text}
            </p>
            {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
              <div className="mt-1 space-x-2 text-xs text-blue-600 dark:text-blue-400">
                {post.hashtags.map((h) => (
                  <button key={h} onClick={() => navigate(`/posts?q=%23${encodeURIComponent(h)}`)} className="hover:underline">#{h}</button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3">
              <div
                className="relative"
                onMouseEnter={() => setOpenReactionPostId(post._id)}
                onMouseLeave={() => setOpenReactionPostId((cur) => (cur === post._id ? null : cur))}
              >
                <button
                  onClick={() => {
                    const mine = getMyReaction(post);
                    if (mine) clearReaction(post._id);
                    else setReaction(post._id, 'love');
                  }}
                  className={`inline-flex items-center gap-1 ${getMyReaction(post) ? 'text-red-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <span>{getMyReaction(post) ? '❤️' : '🤍'}</span>
                </button>
                {openReactionPostId === post._id && (
                  <div className="absolute left-0 z-10 flex items-center gap-2 px-2 py-1 rounded-full shadow -top-10 bg-white/95 dark:bg-gray-800/95 ring-1 ring-black/5">
                    <button className="transition hover:scale-110" onClick={() => setReaction(post._id, 'love')}>❤️</button>
                    <button className="transition hover:scale-110" onClick={() => setReaction(post._id, 'haha')}>😂</button>
                    <button className="transition hover:scale-110" onClick={() => setReaction(post._id, 'wow')}>😮</button>
                  </div>
                )}
              </div>

              {(() => {
                const c = getReactionCounts(post);
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
              <button onClick={() => toggleBookmark(post._id)} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <span>🔖</span>
              </button>
              <span className="ml-auto text-xs text-gray-500">{post.views || 0} views</span>
              {post.user && post.user._id === user._id && (
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => editPost(post._id, post.text)} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">Edit</button>
                  <button onClick={() => deletePost(post._id)} className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Delete</button>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="mt-3">
              {post.comments.map((c) => (
                <div key={c._id} className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <b>{c.user?.username}:</b> {c.text}
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
                      addReply(post._id, c._id, text);
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
                  handleComment(post._id, e.target.comment.value);
                  e.target.comment.value = '';
                }}
                className="flex items-center gap-2 mt-2"
              >
                <input
                  name="comment"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}
