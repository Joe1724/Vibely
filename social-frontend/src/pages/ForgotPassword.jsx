import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">Forgot Password</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message && (
          <p className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-300">
            {message}
          </p>
        )}
        {error && (
          <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark disabled:bg-primary-light disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary-DEFAULT hover:underline dark:text-primary-light">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}