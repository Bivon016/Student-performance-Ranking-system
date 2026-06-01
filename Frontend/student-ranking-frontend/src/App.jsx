import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard      from './pages/Dashboard';
import Students       from './pages/Students';
import Rankings       from './pages/Rankings';
import Marks          from './pages/Marks';
import Exams          from './pages/Exams';
import Classes        from './pages/Classes';
import Subjects       from './pages/Subjects';
import Settings       from './pages/Settings';
import Profile        from './pages/Profile';
import PendingReviews from './pages/PendingReviews';
import AdminPanel from './pages/AdminPanel'
import TeacherManager from './pages/TeacherManager';
import ReportCard     from './pages/ReportCard';
import Layout         from './components/Layout';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import PrivateRoute   from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="classes" element={<Classes />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="marks" element={<Marks />} />

          <Route path="exams" element={<Exams />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="rankings/generate" element={<Rankings />} />
          <Route path="rankings/export" element={<Rankings />} />

          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />

          <Route path="report-card" element={<ReportCard />} />
          <Route path="pending-reviews" element={<PendingReviews />} />
          <Route path="admin" element={<AdminPanel />} />


          {/* Admin only */}
          <Route
            path="teachers"
            element={
              <PrivateRoute roles={['ROLE_PRINCIPAL']}>
                <TeacherManager />
              </PrivateRoute>
            }
          />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;