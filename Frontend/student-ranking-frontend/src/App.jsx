import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rankings from './pages/Rankings';
import Marks from './pages/Marks';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import PendingReviews from './pages/PendingReviews';
import Layout from './components/Layout';
import Login from './pages/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsAuthenticated(loggedIn);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Nested routes inside Layout */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="marks" element={<Marks />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="pending-reviews" element={<PendingReviews />} />
          <Route path="marks/add" element={<Marks />} />
          <Route path="marks/view" element={<Marks />} />
          <Route path="marks/edit" element={<Marks />} />
          <Route path="rankings/generate" element={<Rankings />} />
          <Route path="rankings/export" element={<Rankings />} />
          {/* Remove NotificationsPage route if you don't have the file */}
        </Route>
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;