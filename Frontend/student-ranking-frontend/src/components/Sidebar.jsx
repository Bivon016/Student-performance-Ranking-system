import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  TrendingUp, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/students', label: 'Students', icon: <Users size={20} /> },
    { path: '/rankings', label: 'Rankings', icon: <TrendingUp size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ];
  
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <h1 className="text-xl font-bold">StudentRank</h1>
        </div>
        <p className="text-gray-400 text-sm mt-2">Performance Analytics Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Main
          </h2>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Settings
          </h2>
          <ul className="space-y-1">
            <li>
              <Link
                to="/settings"
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                  isActive('/settings')
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </li>
            <li>
              <button className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-700 w-full text-left transition-all">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-400">admin@studentrank.com</p>
            </div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;