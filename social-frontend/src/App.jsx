import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Posts from './pages/Posts.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import { ThemeContext } from './context/ThemeContext.jsx';
import UserDropdown from './components/UserDropdown.jsx';

function App() {
  const { user, loading, logout, token } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true); // New state for sidebar

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
      <header className="sticky top-0 z-40 border-b border-gray-200 shadow-sm backdrop-blur bg-white/80 dark:bg-gray-900/80 dark:border-gray-800">
        <div className={`px-4 ${user && isChatSidebarOpen ? 'md:pr-[480px]' : ''} py-3`}>
          <div className="flex items-center justify-between gap-4 mx-auto max-w-7xl">
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-primary-DEFAULT">MiniSocial</span>
              {user && (
                <nav className="flex items-center gap-2">
                  <NavLink
                    to="/posts"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                        isActive
                          ? 'bg-primary-DEFAULT text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    Posts
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                        isActive
                          ? 'bg-primary-DEFAULT text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    Profile
                  </NavLink>
                </nav>
              )}
            </div>
            {user && (
              <div className="relative flex-1 max-w-md mx-4">
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
                  className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 ease-in-out bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                  placeholder="Search posts or users..."
                />
                {showDropdown && userResults.length > 0 && (
                  <div className="absolute z-30 w-full mt-2 overflow-hidden transition-opacity duration-300 ease-in-out bg-white border border-gray-200 rounded-lg shadow-lg opacity-100 dark:bg-gray-800 dark:border-gray-700">
                    {userResults.map((u) => (
                      <button
                        key={u._id}
                        className="w-full px-4 py-3 text-left text-gray-800 transition-colors duration-200 ease-in-out dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onMouseDown={() => {
                          if (u._id === user._id) navigate('/profile');
                          else navigate(`/users/${u._id}`);
                        }}
                      >
                        {u.username} <span className="text-sm text-gray-500 dark:text-gray-400">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {user && (
                <>
                  <button
                    className="px-4 py-2 text-sm text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark"
                    disabled={!query.trim()}
                    onClick={() => navigate(`/posts?q=${encodeURIComponent(query)}`)}
                  >
                    Search Posts
                  </button>
                  <button
                    className="px-4 py-2 text-sm text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-secondary-DEFAULT hover:bg-secondary-dark"
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
                </>
              )}
              {user ? (
                <UserDropdown />
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="px-4 py-2 text-sm text-gray-800 transition-colors duration-200 ease-in-out bg-gray-200 rounded-lg shadow-sm dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="px-4 py-2 text-sm text-white transition-colors duration-200 ease-in-out rounded-lg shadow-md bg-primary-DEFAULT hover:bg-primary-dark"
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Routes */}
      <div className={`px-4 py-6 transition-all duration-300 ease-in-out ${user && isChatSidebarOpen ? 'md:mr-[480px]' : ''}`}>
      <main>
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
      
      {/* Catch-all route should be last */}
      <Route
        path="*"
        element={<Navigate to={user ? "/profile" : "/login"} />}
      />
      </Routes>
      </main>
      </div>
      {user && <ChatSidebar isOpen={isChatSidebarOpen} setIsOpen={setIsChatSidebarOpen} />}
    </>
  );
}

export default App;
