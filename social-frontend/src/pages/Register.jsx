// Register.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // added Link
import { AuthContext } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    surname: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!form.password || !form.confirmPassword || form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const payload = { ...form };
      if (!payload.middleName) delete payload.middleName; // optional
      // Do not send confirmPassword to backend unnecessarily
      const { confirmPassword, ...toSend } = payload;
      const res = await axios.post('http://localhost:5000/api/auth/register/init', toSend);
      if (res?.data?.devCode) {
        try {
          sessionStorage.setItem(`otp_dev_${form.email}`, String(res.data.devCode));
        } catch {}
      }
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">Create Your Account</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">Join MiniSocial today!</p>
 
        {error && (
          <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300">{error}</p>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
            value={form.firstName}
            required
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <input
            name="middleName"
            placeholder="Middle name (optional)"
            onChange={handleChange}
            value={form.middleName}
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <input
            name="surname"
            placeholder="Surname"
            onChange={handleChange}
            value={form.surname}
            required
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            value={form.username}
            required
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            value={form.email}
            required
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            value={form.password}
            required
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            onChange={handleChange}
            value={form.confirmPassword}
            required
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
