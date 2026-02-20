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
  ChevronRight,
  Search,
  Menu,
  X,
  LogOut,
  Bell,
  Home
} from 'lucide-react';

const Layout = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load user data on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard size={20} />,
      type: 'link'
    },
    {
      title: 'Students',
      path: '/students',
      icon: <Users size={20} />,
      type: 'link'
    },
     {
    title: 'Subjects',          // <-- added Subjects here
    path: '/subjects',
    icon: <FileText size={20} />, // or BookOpen
    type: 'link'
  },
    {
      title: 'Marks',
      path: '/marks',
      icon: <FileText size={20} />,
      type: 'dropdown',
      items: [
        { title: 'Add Marks', path: '/marks/add' },
        { title: 'View Marks', path: '/marks/view' },
        { title: 'Edit Marks', path: '/marks/edit' },
      ]
    },
    {
      title: 'Rankings',
      path: '/rankings',
      icon: <TrendingUp size={20} />,
      type: 'dropdown',
      items: [
        { title: 'Generate Results', path: '/rankings/generate' },
        { title: 'View Rankings', path: '/rankings' },
        { title: 'Export Results', path: '/rankings/export' },
      ]
    },
    {
      title: 'Pending Reviews',
      path: '/pending-reviews',
      icon: <Bell size={20} />,
      type: 'link'
    },
    {
      title: 'My Profile',
      path: '/profile',
      icon: <User size={20} />,
      type: 'link' 
    },
    {
      title: 'System Settings',
      path: '/settings',
      icon: <Settings size={20} />,
      type: 'link' 
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo & Mobile menu button */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 hidden md:block">Student Ranking System</h1>
              </div>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students, courses, or rankings..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side - Profile with dropdown */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'admin@studentrank.com'}</p>
                    </div>
                    <button 
                      onClick={() => {
                        navigate('/profile');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      <User size={16} className="inline mr-2" />
                      My Profile
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/settings');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      <Settings size={16} className="inline mr-2" />
                      Settings
                    </button>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar & Main Content */}
      <div className="flex pt-16">
        {/* Sidebar - Desktop */}
        <aside className={`hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] fixed h-full overflow-y-auto`}>
          <div className="p-6">
            {/* User Info */}
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-medium">{user?.name || 'Admin Panel'}</p>
                  <p className="text-sm text-gray-500">{user?.role || 'Administrator'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.title}>
                  {item.type === 'link' ? (
                    <Link
                      to={item.path}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {openDropdown === item.title ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      
                      {openDropdown === item.title && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.title}
                              to={subItem.path}
                              className={`block px-4 py-2 rounded text-sm transition-colors ${
                                location.pathname === subItem.path
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Logout button in sidebar */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
            <aside className="fixed left-0 top-0 h-full w-64 bg-white z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Menu</h2>
                  <button onClick={() => setSidebarOpen(false)}>
                    <X size={24} />
                  </button>
                </div>
                
                {/* User Info in Mobile Sidebar */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-medium">{user?.name || 'Admin Panel'}</p>
                      <p className="text-sm text-gray-500">{user?.role || 'Administrator'}</p>
                    </div>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <div key={item.title}>
                      {item.type === 'link' ? (
                        <Link
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                            isActive(item.path)
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.icon}
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      ) : (
                        <div>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              {item.icon}
                              <span className="font-medium">{item.title}</span>
                            </div>
                            {openDropdown === item.title ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                          
                          {openDropdown === item.title && (
                            <div className="ml-8 mt-1 space-y-1">
                              {item.items.map((subItem) => (
                                <Link
                                  key={subItem.title}
                                  to={subItem.path}
                                  onClick={() => setSidebarOpen(false)}
                                  className="block px-4 py-2 rounded text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                >
                                  {subItem.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                {/* Logout in Mobile Sidebar */}
                <div className="mt-8">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                    className="flex items-center justify-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                  >
                    <LogOut size={18} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area - THIS IS WHERE PAGES RENDER */}
        <main className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-64'} transition-all duration-300 w-full`}>
          <div className="p-6">
            {/* Outlet renders the current page content */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;