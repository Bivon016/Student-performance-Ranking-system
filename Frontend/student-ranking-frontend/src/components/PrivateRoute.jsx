import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getRole } from '../services/api';

/**
 * PrivateRoute — protects pages behind authentication.
 *
 * Usage:
 *   <PrivateRoute>                        // any logged-in user
 *   <PrivateRoute roles={["ADMIN"]}>      // admin only
 *   <PrivateRoute roles={["ADMIN","TEACHER"]}> // either role
 *
 * If unauthenticated  → redirects to /login
 * If wrong role       → redirects to / (dashboard)
 */
const PrivateRoute = ({ children, roles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [userRole, setUserRole]               = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = getRole();
    setIsAuthenticated(!!token);
    setUserRole(role);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) return <Navigate to="/login" />;

  // Logged in but wrong role → go to dashboard
  if (roles && !roles.includes(userRole)) return <Navigate to="/" />;

  return children;
};

export default PrivateRoute;