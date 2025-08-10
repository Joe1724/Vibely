// Register.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // added Link
import { AuthContext } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', middleName: '', surname: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (!payload.middleName) delete payload.middleName; // optional
      const res = await axios.post('http://localhost:5000/api/auth/register', payload);
      login(res.data.token, res.data.user);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex items-center justify-center w-screen min-h-screen px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h2 className="mb-6 text-3xl font-semibold text-center text-gray-800 dark:text-gray-100">Register</h2>

        {error && (
          <p className="p-2 mb-4 text-sm text-red-600 bg-red-100 rounded">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="firstName"
            placeholder="First name"
            onChange={handleChange}
            value={form.firstName}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            name="middleName"
            placeholder="Middle name (optional)"
            onChange={handleChange}
            value={form.middleName}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            name="surname"
            placeholder="Surname"
            onChange={handleChange}
            value={form.surname}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            value={form.username}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            value={form.email}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            value={form.password}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
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
