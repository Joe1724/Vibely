import React, { useContext, useState } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Posts from './pages/Posts.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import ActivityTimeline from './pages/ActivityTimeline.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import ContentModeration from './pages/Admin/ContentModeration.jsx';
import MessagingControl from './pages/Admin/MessagingControl.jsx';
import AdsAndAnnouncements from './pages/Admin/AdsAndAnnouncements.jsx';
import Analytics from './pages/Admin/Analytics.jsx';
import Settings from './pages/Admin/Settings.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import { ThemeContext } from './context/ThemeContext.jsx';
import UserDropdown from './components/UserDropdown.jsx';
import TrendingTopics from './components/TrendingTopics.jsx';
import PeopleYouMayKnow from './components/PeopleYouMayKnow.jsx';
import RecentActivity from './components/RecentActivity.jsx';

function App() {
  const { user, loading } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
        <div className="container flex items-center justify-between px-4 py-3 mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-primary-DEFAULT">Vibely</span>
            {/* Search Bar (visible on larger screens) */}
            <div className="relative hidden md:block w-80">
              <input
                type="text"
                placeholder="Search for people, posts, or topics..."
                className="w-full px-4 py-2 text-gray-800 placeholder-gray-500 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              />
              <svg className="absolute w-5 h-5 text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          {/* User Actions / Auth Links */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="p-2 text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h2l2 2M18 10V6a4 4 0 00-8 0v4L3 14v4h18v-4l-3-4z"></path></svg>
                </button>
                <button className="p-2 text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.244-1.076C4.688 16.31 2 12.5 2 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </button>
                <UserDropdown />
              </>
            ) : (
              <>
                <NavLink to="/login" className="px-4 py-2 text-gray-700 rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Login</NavLink>
                <NavLink to="/register" className="px-4 py-2 text-white rounded-lg bg-primary-DEFAULT hover:bg-primary-dark">Register</NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container grid flex-1 grid-cols-1 gap-6 px-4 py-6 mx-auto md:grid-cols-1 lg:grid-cols-4">
        {/* Left Sidebar */}
        <aside className="hidden md:block">
          <div className="p-6 bg-white shadow-sm dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <img src={user?.avatar ? `http://localhost:5000${user.avatar}` : "https://via.placeholder.com/40"} alt="User Avatar" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.username || 'Guest'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username || 'guest'}</p>
              </div>
            </div>
            <div className="flex justify-around mb-6 text-center">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{user?.followers?.length || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{user?.following?.length || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
              </div>
            </div>
            <nav className="space-y-2">
              <NavLink to="/" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7m-2 2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                Home
              </NavLink>
              <NavLink to="/friends" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h2a2 2 0 002-2V9.86a2 2 0 00-1.105-1.79l-5.89-2.946a2 2 0 00-1.79 0L3.105 8.07A2 2 0 002 9.86V18a2 2 0 002 2h2m0 0V9.86a2 2 0 011.105-1.79l5.89-2.946a2 2 0 011.79 0L21 8.07a2 2 0 011.105 1.79V18a2 2 0 01-2 2h-2m-6 0V9.86a2 2 0 00-1.105-1.79l-5.89-2.946a2 2 0 00-1.79 0L3.105 8.07A2 2 0 002 9.86V18a2 2 0 002 2h2"></path></svg>
                Friends
              </NavLink>
              <NavLink to="/photos" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Photos
              </NavLink>
              <NavLink to="/settings" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Settings
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* Central Content */}
        <main className="md:col-span-2 lg:col-span-2">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/posts" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/posts" />} />
            <Route path="/verify-otp" element={!user ? <VerifyOtp /> : <Navigate to="/posts" />} />
            <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/posts" />} />
            <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/posts" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/posts" element={user ? <Posts /> : <Navigate to="/login" />} />
            <Route path="/users/:id" element={user ? <UserProfile /> : <Navigate to="/login" />} />
            <Route path="/settings/notifications" element={user ? <NotificationSettings /> : <Navigate to="/login" />} />
            <Route path="/activity" element={user ? <ActivityTimeline /> : <Navigate to="/login" />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/content" element={<ContentModeration />} />
              <Route path="/admin/messaging" element={<MessagingControl />} />
              <Route path="/admin/ads" element={<AdsAndAnnouncements />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
            <Route path="/posts/:id" element={user ? <Posts /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={user ? "/posts" : "/login"} />} />
          </Routes>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block">
          <TrendingTopics />

          <PeopleYouMayKnow />

          <RecentActivity />
        </aside>
      </div>

      {/* Floating Chat (example, will be a component) */}
      {user && <ChatSidebar isOpen={isChatSidebarOpen} setIsOpen={setIsChatSidebarOpen} />}
    </div>
  );
}

export default App;
