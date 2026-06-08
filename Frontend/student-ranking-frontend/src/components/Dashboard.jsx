import React, { useState, useEffect, useCallback } from 'react';
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
  Award,
  BarChart2,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Minus,
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
import { UserMessage } from './UserMessage';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

const gradeLabel = (score) => {
  if (score >= 80) return { label: 'A', color: 'text-emerald-600 bg-emerald-50' };
  if (score >= 70) return { label: 'B', color: 'text-blue-600 bg-blue-50' };
  if (score >= 60) return { label: 'C', color: 'text-amber-600 bg-amber-50' };
  if (score >= 50) return { label: 'D', color: 'text-orange-600 bg-orange-50' };
  return { label: 'E', color: 'text-red-600 bg-red-50' };
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, sub, onClick, trend }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm
      hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-full
          ${trend > 0 ? 'text-emerald-700 bg-emerald-50' : trend < 0 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
          {trend > 0 ? <ChevronUp size={12} /> : trend < 0 ? <ChevronDown size={12} /> : <Minus size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-800 mb-0.5 tracking-tight">
      {value ?? <span className="text-gray-300 text-lg">—</span>}
    </p>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Mini bar ─────────────────────────────────────────────────────────────────
const Bar = ({ value, max, color = 'bg-blue-500' }) => (
  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
    <div
      className={`${color} h-2 rounded-full transition-all duration-700`}
      style={{ width: max ? `${Math.min(100, Math.round((value / max) * 100))}%` : '0%' }}
    />
  </div>
);

// ─── Error Banner ─────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <UserMessage message={message} onRetry={onRetry} className="mb-6" />
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate    = useNavigate();
  const role        = getRole();
  const isPrincipal = role === 'ROLE_PRINCIPAL';
  const isDeputy    = role === 'ROLE_DEPUTY';
  const canSeeAll   = isPrincipal || isDeputy;

  const [stats,   setStats]   = useState(null);
  const [period,  setPeriod]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [
        getAllStudents(),
        getAllSubjects(),
        getAllExams(),
        getAllMarks(),
        getAllClasses(),
        getCurrentPeriod(),
      ];
      if (canSeeAll) promises.push(getAllTeachers());

      const results = await Promise.allSettled(promises);
      const [
        studentsRes, subjectsRes, examsRes,
        marksRes, classesRes, periodRes, teachersRes,
      ] = results;

      const ok  = (res) => res.status === 'fulfilled' ? res.value : null;
      const students = ok(studentsRes);
      const subjects = ok(subjectsRes);
      const exams    = ok(examsRes);
      const marks    = ok(marksRes);
      const classes  = ok(classesRes);
      const teachers = canSeeAll ? ok(teachersRes) : null;

      setPeriod(ok(periodRes));

      // ── Mark analytics ──
      const markValues = Array.isArray(marks)
        ? marks.map((m) => Number(m.marksValue ?? m.marks ?? m.score ?? 0)).filter((v) => !isNaN(v))
        : [];

      const overallAvg   = markValues.length ? Math.round(avg(markValues)) : null;
      const passCount    = markValues.filter((v) => v >= 50).length;
      const failCount    = markValues.filter((v) => v < 50).length;
      const passRate     = markValues.length ? Math.round((passCount / markValues.length) * 100) : null;

      // ── Subject performance ──
      const subjectPerf = [];
      if (Array.isArray(subjects) && Array.isArray(marks)) {
        subjects.forEach((sub) => {
          const subMarks = marks
            .filter((m) => (m.subjectId ?? m.subject?.id) === sub.id)
            .map((m) => Number(m.marksValue ?? m.marks ?? m.score ?? 0))
            .filter((v) => !isNaN(v));
          if (subMarks.length) {
            subjectPerf.push({
              name: sub.subjectName || sub.name || `Subject ${sub.id}`,
              avg:  Math.round(avg(subMarks)),
              count: subMarks.length,
            });
          }
        });
        subjectPerf.sort((a, b) => b.avg - a.avg);
      }

      // ── Top students ──
      const topStudents = [];
      if (Array.isArray(students) && Array.isArray(marks)) {
        const byStudent = {};
        marks.forEach((m) => {
          const sid = m.studentId ?? m.student?.id;
          const val = Number(m.marksValue ?? m.marks ?? m.score ?? 0);
          if (sid && !isNaN(val)) {
            if (!byStudent[sid]) byStudent[sid] = [];
            byStudent[sid].push(val);
          }
        });
        students.forEach((s) => {
          const vals = byStudent[s.id];
          if (vals?.length) {
            topStudents.push({
              id:   s.id,
              name: s.studentName || s.name || `Student ${s.id}`,
              avg:  Math.round(avg(vals)),
              count: vals.length,
              className: s.classEntity?.className || s.className || '',
            });
          }
        });
        topStudents.sort((a, b) => b.avg - a.avg);
      }

      // ── Exam type breakdown ──
      const examTypeMap = {};
      if (Array.isArray(exams)) {
        exams.forEach((e) => {
          const type = e.examType || e.name || 'Unknown';
          examTypeMap[type] = (examTypeMap[type] || 0) + 1;
        });
      }
      const examTypes = Object.entries(examTypeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // ── Class breakdown ──
      const classBreakdown = Array.isArray(classes)
        ? classes.map((cls) => ({
            id:   cls.id,
            name: cls.name || cls.className || `Class ${cls.id}`,
            students: Array.isArray(students)
              ? students.filter(
                  (s) => s.classId === cls.id || s.classEntity?.id === cls.id
                ).length
              : 0,
          })).sort((a, b) => b.students - a.students)
        : [];

      // ── Recent exams ──
      const recentExams = Array.isArray(exams)
        ? [...exams]
            .sort((a, b) => new Date(b.examDate) - new Date(a.examDate))
            .slice(0, 6)
        : [];

      setStats({
        studentCount:  Array.isArray(students) ? students.length : null,
        subjectCount:  Array.isArray(subjects) ? subjects.length : null,
        examCount:     Array.isArray(exams)    ? exams.length    : null,
        marksCount:    markValues.length || null,
        classCount:    Array.isArray(classes)  ? classes.length  : null,
        teacherCount:  Array.isArray(teachers) ? teachers.length : null,
        overallAvg,
        passRate,
        passCount,
        failCount,
        subjectPerf,
        topStudents,
        examTypes,
        classBreakdown,
        recentExams,
      });
    } catch (err) {
      setError('Failed to load dashboard data. Check your backend connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [canSeeAll]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: canSeeAll ? 8 : 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const maxClassStudents = Math.max(...(stats?.classBreakdown?.map((c) => c.students) ?? [1]), 1);
  const maxSubjectAvg    = Math.max(...(stats?.subjectPerf?.map((s) => s.avg) ?? [1]), 1);

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          {period && (
            <p className="text-sm text-gray-500 mt-1">
              Period:{' '}
              <span className="font-semibold text-blue-600">
                {period.name || period.periodName || JSON.stringify(period)}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800
            border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAll} />}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.studentCount}
          icon={<Users size={20} className="text-white" />}
          color="bg-blue-500"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Classes"
          value={stats?.classCount}
          icon={<GraduationCap size={20} className="text-white" />}
          color="bg-violet-500"
          onClick={() => navigate('/classes')}
        />
        <StatCard
          title="Subjects"
          value={stats?.subjectCount}
          icon={<BookOpen size={20} className="text-white" />}
          color="bg-emerald-500"
          onClick={() => navigate('/subjects')}
        />
        <StatCard
          title="Exams"
          value={stats?.examCount}
          icon={<Calendar size={20} className="text-white" />}
          color="bg-amber-500"
          onClick={() => navigate('/exams')}
        />
        <StatCard
          title="Marks Recorded"
          value={stats?.marksCount}
          icon={<FileText size={20} className="text-white" />}
          color="bg-rose-500"
          onClick={() => navigate('/marks')}
        />
        <StatCard
          title="Overall Average"
          value={stats?.overallAvg != null ? `${stats.overallAvg}%` : null}
          icon={<BarChart2 size={20} className="text-white" />}
          color="bg-cyan-500"
          sub="Across all marks"
        />
        <StatCard
          title="Pass Rate"
          value={stats?.passRate != null ? `${stats.passRate}%` : null}
          icon={<CheckCircle size={20} className="text-white" />}
          color="bg-teal-500"
          sub={stats?.passCount != null ? `${stats.passCount} passed · ${stats.failCount} failed` : undefined}
        />
        {canSeeAll && (
          <StatCard
            title="Teachers"
            value={stats?.teacherCount}
            icon={<TrendingUp size={20} className="text-white" />}
            color="bg-indigo-500"
            onClick={() => navigate('/teachers')}
          />
        )}
      </div>

      {/* ── Row 2: Subject Performance · Top Students · Exam Types ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <SectionHeader title="Subject Performance" sub="Average score per subject" />
          {stats?.subjectPerf?.length ? (
            <ul className="space-y-3">
              {stats.subjectPerf.slice(0, 7).map((sub, i) => {
                const g = gradeLabel(sub.avg);
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-700 w-24 truncate font-medium">{sub.name}</span>
                    <Bar value={sub.avg} max={100} color={
                      sub.avg >= 70 ? 'bg-emerald-400' : sub.avg >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    } />
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${g.color}`}>{sub.avg}%</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No marks data yet.</p>
          )}
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <SectionHeader title="Top Students" sub="By average mark across all exams" />
          {stats?.topStudents?.length ? (
            <ul className="space-y-3">
              {stats.topStudents.slice(0, 7).map((stu, i) => {
                const g = gradeLabel(stu.avg);
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <li key={stu.id} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">
                      {medals[i] ?? <span className="text-xs text-gray-400 font-bold">{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{stu.name}</p>
                      {stu.className && (
                        <p className="text-xs text-gray-400 truncate">{stu.className}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.color}`}>
                      {stu.avg}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No student data yet.</p>
          )}
        </div>

        {/* Exam Type Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <SectionHeader title="Exam Types" sub="Number of exams per category" />
          {stats?.examTypes?.length ? (
            <ul className="space-y-3">
              {stats.examTypes.map((et, i) => {
                const totalExams = stats.examCount || 1;
                const colors = [
                  'bg-blue-400', 'bg-violet-400', 'bg-amber-400',
                  'bg-emerald-400', 'bg-rose-400', 'bg-cyan-400',
                ];
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-28 truncate">{et.type}</span>
                    <Bar value={et.count} max={totalExams} color={colors[i % colors.length]} />
                    <span className="text-sm font-semibold text-gray-600 w-6 text-right">{et.count}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No exam data yet.</p>
          )}

          {/* Pass/Fail donut-style summary */}
          {stats?.passRate != null && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Pass / Fail Split</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden flex">
                  <div
                    className="bg-emerald-400 h-3 transition-all duration-700"
                    style={{ width: `${stats.passRate}%` }}
                  />
                  <div
                    className="bg-red-400 h-3 transition-all duration-700"
                    style={{ width: `${100 - stats.passRate}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Pass {stats.passRate}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Fail {100 - stats.passRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Class Breakdown · Recent Exams ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Students per Class */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <SectionHeader title="Students per Class" sub="Enrollment distribution" />
          {stats?.classBreakdown?.length ? (
            <ul className="space-y-3">
              {stats.classBreakdown.map((cls, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className="text-sm font-semibold text-gray-700 w-28 truncate cursor-pointer hover:text-blue-600"
                    onClick={() => navigate('/classes')}
                  >
                    {cls.name}
                  </span>
                  <Bar value={cls.students} max={maxClassStudents} />
                  <span className="text-sm text-gray-500 w-8 text-right font-medium">{cls.students}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No class data found.</p>
          )}
        </div>

        {/* Recent Exams */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <SectionHeader title="Recent Exams" sub="Last 6 exams by date" />
          {stats?.recentExams?.length ? (
            <ul className="divide-y divide-gray-50">
              {stats.recentExams.map((exam) => {
                const g = gradeLabel(75); // placeholder color key
                return (
                  <li
                    key={exam.id}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer
                      hover:bg-gray-50 -mx-5 px-5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    onClick={() => navigate('/exams')}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {exam.examType || exam.name || `Exam #${exam.id}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exam.examDate
                          ? new Date(exam.examDate).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : 'No date'}
                        {exam.form ? ` · Form ${exam.form}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(exam.subjectName || exam.subject?.name) && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                          {exam.subjectName || exam.subject?.name}
                        </span>
                      )}
                      {(exam.className || exam.classEntity?.className) && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                          {exam.className || exam.classEntity?.className}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No exams found.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;