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
    <div className="w-full max-w-4xl py-8 mx-auto space-y-8">
      {/* Create Post */}
      <form onSubmit={handleCreatePost} className="p-6 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <textarea
          className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent transition-all duration-200 ease-in-out resize-y min-h-[100px]"
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex items-center justify-between mt-4">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            className="text-sm transition-colors duration-200 ease-in-out cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-primary-DEFAULT file:px-4 file:py-2 file:text-white hover:file:bg-primary-dark"
          />
          <button
            type="submit"
            className="px-6 py-2 text-base font-medium text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark"
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
          className="p-6 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700"
          onMouseEnter={() => addView(post._id)}
        >
          {post.image && (
            <img src={`http://localhost:5000${post.image}`} alt="" className="w-full max-h-[520px] object-cover rounded-lg mb-4" />
          )}
          {post.video && (
            <video src={`http://localhost:5000${post.video}`} controls className="w-full max-h-[520px] object-contain bg-black rounded-lg mb-4" />
          )}
          <div className="mb-4">
            <p className="text-base text-gray-800 whitespace-pre-wrap dark:text-gray-200">
              {post.text}
            </p>
            {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-primary-DEFAULT dark:text-primary-light">
                {post.hashtags.map((h) => (
                  <button key={h} onClick={() => navigate(`/posts?q=%23${encodeURIComponent(h)}`)} className="font-medium hover:underline">#{h}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                className={`inline-flex items-center gap-1 text-lg transition-colors duration-200 ease-in-out ${getMyReaction(post) ? 'text-red-500' : 'text-gray-500 hover:text-primary-DEFAULT'}`}
              >
                <span>{getMyReaction(post) ? '❤️' : '🤍'}</span>
              </button>
              {openReactionPostId === post._id && (
                <div className="absolute left-0 z-10 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg -top-12 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
                  <button className="text-2xl transition-transform duration-200 ease-in-out hover:scale-125" onClick={() => setReaction(post._id, 'love')}>❤️</button>
                  <button className="text-2xl transition-transform duration-200 ease-in-out hover:scale-125" onClick={() => setReaction(post._id, 'haha')}>😂</button>
                  <button className="text-2xl transition-transform duration-200 ease-in-out hover:scale-125" onClick={() => setReaction(post._id, 'wow')}>😮</button>
                </div>
              )}
            </div>

            {(() => {
              const c = getReactionCounts(post);
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
            <button onClick={() => toggleBookmark(post._id)} className="inline-flex items-center gap-1 text-gray-500 transition-colors duration-200 ease-in-out hover:text-primary-DEFAULT">
              <span>🔖</span>
            </button>
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{post.views || 0} views</span>
            {post.user && post.user._id === user._id && (
              <div className="flex items-center gap-2 ml-2">
                <button onClick={() => editPost(post._id, post.text)} className="px-3 py-1 text-sm text-gray-800 transition-colors duration-200 ease-in-out bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">Edit</button>
                <button onClick={() => deletePost(post._id)} className="px-3 py-1 text-sm text-red-600 transition-colors duration-200 ease-in-out bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50">Delete</button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            {post.comments.map((c) => (
              <div key={c._id} className="p-2 mb-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <b>{c.user?.username}:</b> {c.text}
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
                    const text = e.target[`reply-${c._id}`].value;
                    addReply(post._id, c._id, text);
                    e.target[`reply-${c._id}`].value = '';
                  }}
                  className="flex items-center gap-2 mt-2 ml-4"
                >
                  <input
                    name={`reply-${c._id}`}
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
                handleComment(post._id, e.target.comment.value);
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
    </div>
  );
}
