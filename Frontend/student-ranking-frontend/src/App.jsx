import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rankings from './pages/Rankings';
import Marks from './pages/Marks';
import Exams from "./pages/Exams";
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import PendingReviews from './pages/PendingReviews';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Nested Routes inside Layout */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="classes" element={<Classes />} />
          <Route path="marks" element={<Marks />} />
          <Route path="marks/add" element={<Marks />} />
          <Route path="marks/view" element={<Marks />} />
          <Route path="marks/edit" element={<Marks />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="pending-reviews" element={<PendingReviews />} />

          {/* Optional nested routes */}
          <Route path="rankings/generate" element={<Rankings />} />
          <Route path="rankings/export" element={<Rankings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
