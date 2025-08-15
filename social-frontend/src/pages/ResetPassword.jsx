import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const query = useQuery();
  
  const token = query.get('token');
  const email = query.get('email');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 text-center bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">Invalid Link</h2>
            <p className="text-gray-600 dark:text-gray-400">
            This password reset link is invalid or incomplete. Please request a new one.
            </p>
            <Link to="/forgot-password" className="inline-block mt-6 font-medium text-primary-DEFAULT hover:underline dark:text-primary-light">
             Request a New Link
            </Link>
        </div>
        </div>
    );
  }


  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">Reset Your Password</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          Enter your new password below.
        </p>

        {message && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-300">
            <p>{message}</p>
            <p>Redirecting to login shortly...</p>
          </div>
        )}
        {error && (
          <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="password"
              name="password"
              placeholder="New Password"
              onChange={handleChange}
              value={form.password}
              required
              className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              onChange={handleChange}
              value={form.confirmPassword}
              required
              className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark disabled:bg-primary-light disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
       </div>
    </div>
  );
}