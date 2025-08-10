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
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/90 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/80">
        <h2 className="mb-6 text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">Verify your email</h2>
        {error && <p className="p-2 mb-4 text-sm text-red-600 bg-red-100 rounded">{error}</p>}
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            name="code"
            placeholder="6-digit code"
            onChange={(e) => setCode(e.target.value)}
            value={code}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:placeholder-gray-400 dark:text-white"
          />
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow hover:bg-blue-700">
            Verify
          </button>
        </form>
        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full mt-4 rounded-lg bg-blue-100 py-2 font-semibold text-blue-600 disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
