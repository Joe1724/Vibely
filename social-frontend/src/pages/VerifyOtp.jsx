import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Get email from query string
  const { search } = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(search);
    const qEmail = params.get('email') || '';
    setEmail(qEmail);
    // Autofill dev code if backend returned it on init
    try {
      const dev = sessionStorage.getItem(`otp_dev_${qEmail}`);
      if (dev) setCode(dev);
    } catch {}
  }, [search]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register/verify', { email, code });
      login(res.data.token, res.data.user);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register/resend', { email });
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend code');
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <div className="flex items-center justify-center w-screen min-h-screen px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="mb-6 text-3xl font-semibold text-center text-gray-800 dark:text-gray-100">Verify your email</h2>
        {error && <p className="p-2 mb-4 text-sm text-red-600 bg-red-100 rounded">{error}</p>}
        <form onSubmit={handleVerify} className="space-y-5">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            name="code"
            placeholder="6-digit code"
            onChange={(e) => setCode(e.target.value)}
            value={code}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <button type="submit" className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-md hover:bg-blue-700">
            Verify
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full py-2 mt-4 font-semibold text-blue-600 transition bg-blue-100 rounded-md disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
