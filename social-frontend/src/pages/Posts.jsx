import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Posts() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

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
    if (!newPost.trim() && !imageFile) return;

    try {
      const formData = new FormData();
      formData.append('text', newPost);
      if (imageFile) formData.append('image', imageFile);

      const res = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts([res.data, ...posts]);
      setNewPost('');
      setImageFile(null);
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

  const handleComment = async (postId, text) => {
    await axios.post(
      `http://localhost:5000/api/posts/comment/${postId}`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchPosts();
  };

  return (
    <div className="max-w-2xl p-4 mx-auto">
      {/* Create Post */}
      <form onSubmit={handleCreatePost} className="p-4 mb-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <textarea
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="flex items-center justify-between mt-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Post
          </button>
        </div>
      </form>

      {/* Search moved to header; show results driven by ?q= */}

      {/* Post Feed */}
      {posts.map((post, idx) => (
        <div
          key={post._id}
          ref={idx === posts.length - 1 ? lastPostRef : undefined}
          className="p-4 mb-4 bg-white rounded-lg shadow dark:bg-gray-800"
        >
          {post.image && (
            <img src={`http://localhost:5000${post.image}`} alt="" className="mb-2 rounded" />
          )}
          <p className="text-gray-800 dark:text-gray-200">{post.text}</p>
          <div className="flex items-center gap-4 mt-3">
            {post.likes.includes(user._id) ? (
              <button
                onClick={() => handleUnlike(post._id)}
                className="text-red-500"
              >
                ❤️ {post.likes.length}
              </button>
            ) : (
              <button
                onClick={() => handleLike(post._id)}
                className="text-gray-500"
              >
                🤍 {post.likes.length}
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="mt-3">
            {post.comments.map((c) => (
              <p key={c._id} className="text-sm text-gray-600 dark:text-gray-400">
                <b>{c.user.username}:</b> {c.text}
              </p>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleComment(post._id, e.target.comment.value);
                e.target.comment.value = '';
              }}
              className="flex gap-2 mt-2"
            >
              <input
                name="comment"
                className="flex-1 p-2 border rounded-lg"
                placeholder="Write a comment..."
              />
              <button
                type="submit"
                className="px-3 py-1 bg-gray-200 rounded-lg"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
