import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  TrendingUp,
  GraduationCap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  getAllStudents,
  getAllSubjects,
  getAllExams,
  getAllMarks,
  getAllClasses,
  getAllTeachers,
  getCurrentPeriod,
  getRole,
} from '../services/api';

// ─── Reusable stat card ────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, sub, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm
      hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-800 mb-1">
      {value ?? <span className="text-gray-300 text-xl">—</span>}
    </p>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Error banner ──────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
    <AlertCircle size={18} className="shrink-0" />
    <span className="flex-1 text-sm">{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate  = useNavigate();
  const role      = getRole();
  const isPrincipal = role === 'ROLE_PRINCIPAL';
  const isDeputy   = role === 'ROLE_DEPUTY';
  const canSeeAll  = isPrincipal || isDeputy;

  const [stats, setStats]       = useState(null);
  const [period, setPeriod]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Always fetch these
      const promises = [
        getAllStudents(),
        getAllSubjects(),
        getAllExams(),
        getAllMarks(),
        getAllClasses(),
        getCurrentPeriod(),
      ];

      // Only fetch teachers if principal / deputy
      if (canSeeAll) promises.push(getAllTeachers());

      const results = await Promise.allSettled(promises);

      const [
        studentsRes,
        subjectsRes,
        examsRes,
        marksRes,
        classesRes,
        periodRes,
        teachersRes,
      ] = results;

      const value = (res) => (res.status === 'fulfilled' ? res.value : null);

      const students = value(studentsRes);
      const subjects = value(subjectsRes);
      const exams    = value(examsRes);
      const marks    = value(marksRes);
      const classes  = value(classesRes);
      const teachers = canSeeAll ? value(teachersRes) : null;

      setPeriod(value(periodRes));

      setStats({
        studentCount:  Array.isArray(students) ? students.length : null,
        subjectCount:  Array.isArray(subjects) ? subjects.length : null,
        examCount:     Array.isArray(exams)    ? exams.length    : null,
        marksCount:    Array.isArray(marks)    ? marks.length    : null,
        classCount:    Array.isArray(classes)  ? classes.length  : null,
        teacherCount:  Array.isArray(teachers) ? teachers.length : null,

        // Derive a few quick insights
        recentExams: Array.isArray(exams)
          ? [...exams]
              .sort((a, b) => new Date(b.examDate) - new Date(a.examDate))
              .slice(0, 5)
          : [],

        classBreakdown: Array.isArray(classes)
          ? classes.map((cls) => ({
              name: cls.name || cls.className || `Class ${cls.id}`,
              students: Array.isArray(students)
                ? students.filter((s) => s.classId === cls.id || s.classEntity?.id === cls.id).length
                : '—',
            }))
          : [],
      });
    } catch (err) {
      setError('Failed to load dashboard data. Check your backend connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: canSeeAll ? 6 : 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-36 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {period && (
            <p className="text-sm text-gray-500 mt-1">
              Current period: <span className="font-medium text-blue-600">{period.name || period.periodName || JSON.stringify(period)}</span>
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAll} />}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.studentCount}
          icon={<Users size={22} className="text-white" />}
          color="bg-blue-500"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Classes"
          value={stats?.classCount}
          icon={<GraduationCap size={22} className="text-white" />}
          color="bg-purple-500"
          onClick={() => navigate('/classes')}
        />
        <StatCard
          title="Subjects"
          value={stats?.subjectCount}
          icon={<BookOpen size={22} className="text-white" />}
          color="bg-emerald-500"
          onClick={() => navigate('/subjects')}
        />
        <StatCard
          title="Exams"
          value={stats?.examCount}
          icon={<Calendar size={22} className="text-white" />}
          color="bg-amber-500"
          onClick={() => navigate('/exams')}
        />
        <StatCard
          title="Marks Entered"
          value={stats?.marksCount}
          icon={<FileText size={22} className="text-white" />}
          color="bg-rose-500"
          onClick={() => navigate('/marks')}
        />
        {canSeeAll && (
          <StatCard
            title="Teachers"
            value={stats?.teacherCount}
            icon={<TrendingUp size={22} className="text-white" />}
            color="bg-indigo-500"
            onClick={() => navigate('/teachers')}
          />
        )}
      </div>

      {/* ── Bottom row: recent exams + class breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Exams */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Recent Exams</h2>
          {stats?.recentExams?.length ? (
            <ul className="divide-y divide-gray-100">
              {stats.recentExams.map((exam) => (
                <li key={exam.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {exam.examType || exam.name || `Exam #${exam.id}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {exam.examDate
                        ? new Date(exam.examDate).toLocaleDateString()
                        : 'No date'}
                      {exam.form ? ` · Form ${exam.form}` : ''}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                    {exam.subjectName || exam.subject?.name || '—'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No exams found.</p>
          )}
        </div>

        {/* Class Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Students per Class</h2>
          {stats?.classBreakdown?.length ? (
            <ul className="space-y-3">
              {stats.classBreakdown.map((cls, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-28 truncate">{cls.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width:
                          typeof cls.students === 'number' && stats.studentCount
                            ? `${Math.round((cls.students / stats.studentCount) * 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{cls.students}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No class data found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;