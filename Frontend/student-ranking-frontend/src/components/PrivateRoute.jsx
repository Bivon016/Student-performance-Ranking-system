import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getRole } from '../services/api';

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

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (localStorage.getItem('requiresSchool') === 'true') {
    return <Navigate to="/select-school" />;
  }

  if (roles && !roles.includes(userRole)) return <Navigate to="/" />;

  return children;
};

export default PrivateRoute;