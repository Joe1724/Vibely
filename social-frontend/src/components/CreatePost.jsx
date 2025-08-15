import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function CreatePost({ onPostCreated }) {
  const { user, token } = useContext(AuthContext);
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [error, setError] = useState('');

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaFile) {
      setError('Please add some content or a file to your post.');
      return;
    }
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', text);
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      const res = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onPostCreated(res.data);
      setText('');
      setMediaFile(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      setError(msg);
      console.error('Create post failed:', err);
    }
  };

  return (
    <div className="p-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
      <form onSubmit={handleCreatePost}>
        <div className="flex items-start gap-4">
          <img src={user?.avatar ? `http://localhost:5000${user.avatar}` : "https://via.placeholder.com/40"} alt="User Avatar" className="w-10 h-10 rounded-full" />
          <textarea
            className="w-full h-24 p-3 text-gray-800 placeholder-gray-500 bg-gray-100 rounded-lg resize-none dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
            placeholder={`What's on your mind, ${user?.username}?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <label className="text-gray-500 cursor-pointer dark:text-gray-400 hover:text-primary-DEFAULT">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
            </label>
            <button type="button" className="text-gray-500 dark:text-gray-400 hover:text-primary-DEFAULT">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </button>
            <button type="button" className="text-gray-500 dark:text-gray-400 hover:text-primary-DEFAULT">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2 font-semibold text-white rounded-full bg-primary-DEFAULT hover:bg-primary-dark"
          >
            Share Post
          </button>
        </div>
      </form>
    </div>
  );
}