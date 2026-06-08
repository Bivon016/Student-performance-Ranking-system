import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Settings,
  User,
  ChevronDown,
  Search,
  Menu,
  X,
  LogOut,
  BookOpen,
  Calendar,
  GraduationCap,
  UserCog,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import { getRole } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const role = getRole();
  const isPrincipal = role === 'ROLE_PRINCIPAL';

  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatRole = (r) => {
    if (!r) return 'User';
    return r.replace('ROLE_', '').replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { title: 'Classes', path: '/classes', icon: <GraduationCap size={20} /> },
    { title: 'Teachers', path: '/teachers', icon: <UserCog size={20} /> },
    { title: 'Students', path: '/students', icon: <Users size={20} /> },
    { title: 'Subjects', path: '/subjects', icon: <BookOpen size={20} /> },
    { title: 'Exams', path: '/exams', icon: <Calendar size={20} /> },
    { title: 'Marks', path: '/marks', icon: <FileText size={20} /> },
    { title: 'Rankings', path: '/rankings', icon: <TrendingUp size={20} /> },
    { title: 'My Profile', path: '/profile', icon: <User size={20} /> },
    { title: 'System Settings', path: '/settings', icon: <Settings size={20} /> },
    { title: 'Admin Panel', path: '/admin', icon: <Shield size={20} />, principalOnly: true },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkCls = (path) => {
    const active = isActive(path);
    if (active) {
      return isDark
        ? 'flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors bg-indigo-950/60 text-indigo-400 border-l-4 border-indigo-500'
        : 'flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500';
    }
    return isDark
      ? 'flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-gray-300 hover:bg-gray-700'
      : 'flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-gray-700 hover:bg-gray-100';
  };

  const renderNav = (onNavigate) =>
    menuItems
      .filter(item => !item.principalOnly || isPrincipal)
      .map(item => (
        <Link key={item.title} to={item.path} onClick={onNavigate} className={navLinkCls(item.path)}>
          {item.icon}
          <span className="font-medium">{item.title}</span>
        </Link>
      ));

  const profileCardCls = isDark
    ? 'mb-8 p-4 bg-indigo-950/40 rounded-xl border border-indigo-900'
    : 'mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100';

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navbar */}
      <nav className={`fixed w-full z-50 border-b transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h1 className={`text-xl font-bold hidden md:block ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  Student Ranking System
                </h1>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students, courses, or rankings..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    isDark
                      ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                      {user?.name || 'User'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatRole(user?.role)}
                    </p>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {isProfileOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border py-2 z-50 ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {user?.name || 'User'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatRole(user?.role)}
                      </p>
                    </div>
                    <button
                      onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <User size={16} className="inline mr-2" />My Profile
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Settings size={16} className="inline mr-2" />Settings
                    </button>
                    <div className={`border-t mt-2 pt-2 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm text-red-600 flex items-center ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <LogOut size={16} className="mr-2" />Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block w-64 fixed h-full overflow-y-auto min-h-[calc(100vh-64px)] border-r transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className={profileCardCls}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                    {user?.name || 'User'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatRole(user?.role)}
                  </p>
                </div>
              </div>
            </div>

            <nav className="space-y-1">{renderNav()}</nav>

            <div className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <button
                onClick={handleLogout}
                className={`flex items-center justify-center w-full px-4 py-3 text-red-600 rounded-xl transition-colors font-medium ${
                  isDark ? 'hover:bg-red-950/30' : 'hover:bg-red-50'
                }`}
              >
                <LogOut size={18} className="mr-2" />Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <aside className={`fixed left-0 top-0 h-full w-64 z-50 overflow-y-auto ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    <X size={24} />
                  </button>
                </div>

                <div className={profileCardCls.replace('mb-8', 'mb-6')}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {user?.name || 'User'}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatRole(user?.role)}
                      </p>
                    </div>
                  </div>
                </div>

                <nav className="space-y-1">{renderNav(() => setSidebarOpen(false))}</nav>

                <div className="mt-8">
                  <button
                    onClick={() => { handleLogout(); setSidebarOpen(false); }}
                    className={`flex items-center justify-center w-full px-4 py-3 text-red-600 rounded-xl font-medium ${
                      isDark ? 'hover:bg-red-950/30' : 'hover:bg-red-50'
                    }`}
                  >
                    <LogOut size={18} className="mr-2" />Logout
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 lg:ml-64 transition-all duration-300 w-full">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
