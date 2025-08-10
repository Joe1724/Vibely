import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Posts from './pages/Posts.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Messages from './pages/Messages.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import { ThemeContext } from './context/ThemeContext.jsx';

function App() {
  const { user, loading, logout, token } = useContext(AuthContext);
  const { theme, toggle } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUserResults([]);
      setShowDropdown(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/search?query=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) {
          setUserResults(res.data);
          setShowDropdown(true);
        }
      } catch {
        if (!cancelled) setUserResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, token]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {/* App Header / Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 md:pr-[480px] py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg">MiniSocial</span>
            {user && (
              <nav className="flex items-center gap-2 ml-4">
                <NavLink
                  to="/posts"
                  className={({ isActive }) =>
                    `px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`
                  }
                >
                  Posts
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`
                  }
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    `px-3 py-1 rounded ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`
                  }
                >
                  Messages
                </NavLink>
              </nav>
            )}
          </div>
          {user && (
            <div className="relative flex-1 max-w-md ml-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(userResults.length > 0)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    navigate(`/posts?q=${encodeURIComponent(query)}`);
                  }
                }}
                className="w-full px-3 py-1.5 rounded border bg-white/80 dark:bg-gray-800/80"
                placeholder="Search posts or users..."
              />
              {showDropdown && userResults.length > 0 && (
                <div className="absolute z-30 w-full mt-1 overflow-hidden bg-white border rounded shadow dark:bg-gray-800">
                  {userResults.map((u) => (
                    <button
                      key={u._id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onMouseDown={() => {
                        if (u._id === user._id) navigate('/profile');
                        else navigate(`/users/${u._id}`);
                      }}
                    >
                      {u.username} <span className="text-xs text-gray-500">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 ml-2">
              <button
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded"
                disabled={!query.trim()}
                onClick={() => navigate(`/posts?q=${encodeURIComponent(query)}`)}
              >
                Search Posts
              </button>
              <button
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded"
                disabled={!query.trim()}
                onClick={async () => {
                  try {
                    const res = await axios.get(
                      `http://localhost:5000/api/users/search?query=${encodeURIComponent(query)}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const first = res.data?.[0];
                    if (first) {
                      navigate(first._id === user._id ? '/profile' : `/users/${first._id}`);
                    } else {
                      alert('No users');
                    }
                  } catch (e) {
                    alert('Search failed');
                  }
                }}
              >
                Search Users
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggle} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded">
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
            {user ? (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login" className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded">Login</NavLink>
                <NavLink to="/register" className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Register</NavLink>
              </>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Routes */}
      <div className="px-4 py-6 md:pr-[480px]">
      <main className="max-w-6xl mx-auto">
      <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/profile" />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/profile" />}
      />
      <Route
        path="/verify-otp"
        element={!user ? <VerifyOtp /> : <Navigate to="/profile" />}
      />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/posts"
        element={user ? <Posts /> : <Navigate to="/login" />}
      />
        <Route
          path="/users/:id"
          element={user ? <UserProfile /> : <Navigate to="/login" />}
        />
        <Route
          path="/messages"
          element={user ? <Messages /> : <Navigate to="/login" />}
        />
      {/* Catch-all route should be last */}
      <Route
        path="*"
        element={<Navigate to={user ? "/profile" : "/login"} />}
      />
      </Routes>
      </main>
      </div>
      {user && <ChatSidebar />}
    </>
  );
}

export default App;
