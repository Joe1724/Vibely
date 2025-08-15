import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import CreatePost from '../components/CreatePost.jsx';

export default function Posts() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
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

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
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
    <div className="space-y-6">
      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Post Feed */}
      {posts.map((post, idx) => (
        <article
          key={post._id}
          ref={idx === posts.length - 1 ? lastPostRef : undefined}
          className="bg-white shadow-sm dark:bg-gray-800 rounded-xl"
          onMouseEnter={() => addView(post._id)}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.user?.avatar ? `http://localhost:5000${post.user.avatar}`: "https://via.placeholder.com/40"} alt="User Avatar" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{post.user?.username || 'User'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
              </button>
            </div>
            
            <p className="mt-4 text-gray-800 dark:text-gray-200">{post.text}</p>
          </div>

          {post.image && <img src={`http://localhost:5000${post.image}`} alt="Post media" className="object-cover w-full" />}
          {post.video && <video src={`http://localhost:5000${post.video}`} controls className="w-full bg-black" />}

          <div className="p-6">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 hover:text-red-500" onClick={() => getMyReaction(post) ? clearReaction(post._id) : setReaction(post._id, 'love')}>
                  <svg className={`w-6 h-6 ${getMyReaction(post) ? 'text-red-500' : ''}`} fill={`${getMyReaction(post) ? 'currentColor': 'none'}`} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  {post.reactions?.length || 0}
                </button>
                <button className="flex items-center gap-2 hover:text-primary-DEFAULT">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.244-1.076C4.688 16.31 2 12.5 2 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  {post.comments?.length || 0}
                </button>
                <button className="flex items-center gap-2 hover:text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.012l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path></svg>
                  Share
                </button>
              </div>
              <button onClick={() => toggleBookmark(post._id)} className="flex items-center gap-2 hover:text-yellow-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
