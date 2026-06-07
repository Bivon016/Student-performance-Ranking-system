import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Award, BookOpen, Calendar,
  RefreshCw, AlertCircle, FileText, GraduationCap,
  CheckCircle, XCircle, BarChart2, Star, ChevronRight,
} from 'lucide-react';
import {
  getAllStudents,
  getAllMarks,
  getAllExams,
  getAllSubjects,
  getAllClasses,
} from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avg  = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const fmt  = (n, d = 1) => n == null ? '—' : Number(n).toFixed(d);
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const gradeInfo = (score) => {
  if (score >= 80) return { label: 'A', bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (score >= 70) return { label: 'B', bg: 'bg-blue-100',    text: 'text-blue-700',    bar: 'bg-blue-500'    };
  if (score >= 60) return { label: 'C', bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500'   };
  if (score >= 50) return { label: 'D', bg: 'bg-orange-100',  text: 'text-orange-700',  bar: 'bg-orange-500'  };
  return               { label: 'E', bg: 'bg-red-100',     text: 'text-red-700',     bar: 'bg-red-500'     };
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />;

// ─── Stat Card — gradient hero style ─────────────────────────────────────────
const HeroCard = ({ title, value, sub, icon, gradient, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl p-6 text-white cursor-pointer
      shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${gradient}`}
  >
    {/* decorative circle */}
    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <ChevronRight size={16} className="opacity-60" />
      </div>
      <p className="text-3xl font-extrabold tracking-tight leading-none mb-1">
        {value ?? <span className="opacity-40 text-xl font-normal">—</span>}
      </p>
      <p className="text-sm font-semibold opacity-80">{title}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── Flat info card ───────────────────────────────────────────────────────────
const InfoCard = ({ title, value, sub, icon, iconBg, iconColor, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
      ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        {React.cloneElement(icon, { size: 18, className: iconColor })}
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-800 tracking-tight">
      {value ?? <span className="text-gray-300">—</span>}
    </p>
    <p className="text-sm font-medium text-gray-500 mt-0.5">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [students, marks, exams, subjects, classes] = await Promise.all([
        getAllStudents().catch(() => []),
        getAllMarks().catch(()    => []),
        getAllExams().catch(()    => []),
        getAllSubjects().catch(() => []),
        getAllClasses().catch(()  => []),
      ]);

      // Mark values
      const markValues = (Array.isArray(marks) ? marks : [])
        .map((m) => Number(m.marksValue ?? m.marks ?? m.score ?? 0))
        .filter((v) => !isNaN(v) && v > 0);

      const overallAvg  = markValues.length ? avg(markValues) : null;
      const passCount   = markValues.filter((v) => v >= 50).length;
      const failCount   = markValues.filter((v) => v  < 50).length;
      const passRate    = markValues.length ? (passCount / markValues.length) * 100 : null;

      // Top performer
      let topPerformer = null;
      if (Array.isArray(students) && marks.length) {
        const byStudent = {};
        marks.forEach((m) => {
          const sid = m.studentId ?? m.student?.id;
          const val = Number(m.marksValue ?? m.marks ?? m.score ?? 0);
          if (sid && !isNaN(val) && val > 0) {
            if (!byStudent[sid]) byStudent[sid] = [];
            byStudent[sid].push(val);
          }
        });
        let bestId = null, bestAvg = -1;
        Object.entries(byStudent).forEach(([sid, vals]) => {
          const a = avg(vals);
          if (a > bestAvg) { bestAvg = a; bestId = Number(sid); }
        });
        if (bestId != null) {
          const stu = students.find((s) => s.id === bestId);
          topPerformer = {
            name:  stu?.studentName || stu?.name || `Student #${bestId}`,
            avg:   bestAvg,
            class: stu?.classEntity?.className || stu?.className || '',
          };
        }
      }

      // Subject performance
      const subjectPerf = [];
      if (Array.isArray(subjects) && marks.length) {
        subjects.forEach((sub) => {
          const vals = marks
            .filter((m) => (m.subjectId ?? m.subject?.id) === sub.id)
            .map((m) => Number(m.marksValue ?? m.marks ?? m.score ?? 0))
            .filter((v) => !isNaN(v) && v > 0);
          if (vals.length) subjectPerf.push({
            name: sub.subjectName || sub.name || `Subject ${sub.id}`,
            avg:  Math.round(avg(vals)),
            count: vals.length,
          });
        });
        subjectPerf.sort((a, b) => b.avg - a.avg);
      }

      // Top students list
      const topStudents = [];
      if (Array.isArray(students) && marks.length) {
        const byStudent = {};
        marks.forEach((m) => {
          const sid = m.studentId ?? m.student?.id;
          const val = Number(m.marksValue ?? m.marks ?? m.score ?? 0);
          if (sid && !isNaN(val) && val > 0) {
            if (!byStudent[sid]) byStudent[sid] = [];
            byStudent[sid].push(val);
          }
        });
        students.forEach((s) => {
          const vals = byStudent[s.id];
          if (vals?.length) topStudents.push({
            id:    s.id,
            name:  s.studentName || s.name || `Student ${s.id}`,
            avg:   Math.round(avg(vals)),
            class: s.classEntity?.className || s.className || '',
          });
        });
        topStudents.sort((a, b) => b.avg - a.avg);
      }

      // Recent exams
      const recentExams = Array.isArray(exams)
        ? [...exams]
            .filter((e) => e.examDate)
            .sort((a, b) => new Date(b.examDate) - new Date(a.examDate))
            .slice(0, 5)
        : [];

      // Class breakdown
      const classBreakdown = Array.isArray(classes)
        ? classes.map((cls) => ({
            name: cls.name || cls.className || `Class ${cls.id}`,
            students: Array.isArray(students)
              ? students.filter((s) => s.classId === cls.id || s.classEntity?.id === cls.id).length
              : 0,
          })).sort((a, b) => b.students - a.students)
        : [];

      setData({
        studentCount: Array.isArray(students) ? students.length : null,
        subjectCount: Array.isArray(subjects) ? subjects.length : null,
        examCount:    Array.isArray(exams)    ? exams.length    : null,
        marksCount:   markValues.length || null,
        classCount:   Array.isArray(classes)  ? classes.length  : null,
        overallAvg, passRate, passCount, failCount,
        topPerformer, subjectPerf, topStudents, recentExams, classBreakdown,
      });
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard data. Check your backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="space-y-6">
      <Sk className="h-8 w-60" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Sk key={i} className="h-36" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Sk key={i} className="h-72" />)}
      </div>
    </div>
  );

  const maxClass = Math.max(...(data?.classBreakdown?.map((c) => c.students) ?? [1]), 1);

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-0.5">Welcome back! Here's the students' updates today.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
            border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700
          rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button onClick={fetchAll} className="ml-auto font-medium hover:underline flex items-center gap-1">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* ── Row 1: Hero gradient cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard
          title="Total Students"
          value={data?.studentCount?.toLocaleString()}
          sub={`${data?.classCount ?? '—'} classes enrolled`}
          icon={<Users size={20} className="text-white" />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          onClick={() => navigate('/students')}
        />
        <HeroCard
          title="Average Score"
          value={data?.overallAvg != null ? `${fmt(data.overallAvg)}%` : null}
          sub={data?.passRate != null ? `${fmt(data.passRate)}% pass rate` : 'No marks yet'}
          icon={<BarChart2 size={20} className="text-white" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => navigate('/marks')}
        />
        <HeroCard
          title="Top Performer"
          value={data?.topPerformer ? `${fmt(data.topPerformer.avg)}%` : null}
          sub={data?.topPerformer?.name || 'No data yet'}
          icon={<Award size={20} className="text-white" />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          onClick={() => navigate('/rankings')}
        />
        <HeroCard
          title="Total Exams"
          value={data?.examCount}
          sub={`${data?.subjectCount ?? '—'} subjects`}
          icon={<Calendar size={20} className="text-white" />}
          gradient="bg-gradient-to-br from-orange-400 to-rose-500"
          onClick={() => navigate('/exams')}
        />
      </div>

      {/* ── Row 2: Info cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoCard
          title="Marks Recorded"
          value={data?.marksCount?.toLocaleString()}
          sub="Total entries"
          icon={<FileText />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          onClick={() => navigate('/marks')}
        />
        <InfoCard
          title="Passed"
          value={data?.passCount?.toLocaleString()}
          sub={data?.passRate != null ? `${fmt(data.passRate)}% of total` : undefined}
          icon={<CheckCircle />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <InfoCard
          title="Failed"
          value={data?.failCount?.toLocaleString()}
          sub={data?.passRate != null ? `${fmt(100 - data.passRate)}% of total` : undefined}
          icon={<XCircle />}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <InfoCard
          title="Subjects"
          value={data?.subjectCount}
          sub="Active subjects"
          icon={<BookOpen />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => navigate('/subjects')}
        />
      </div>

      {/* ── Row 3: Three panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Top Students</h2>
            <Star size={15} className="text-amber-400" />
          </div>
          {data?.topStudents?.length ? (
            <ul className="space-y-3">
              {data.topStudents.slice(0, 6).map((stu, i) => {
                const g = gradeInfo(stu.avg);
                const medals = ['🥇','🥈','🥉'];
                return (
                  <li key={stu.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-base">
                      {medals[i] ?? <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{stu.name}</p>
                      {stu.class && <p className="text-xs text-gray-400 truncate">{stu.class}</p>}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.bg} ${g.text}`}>
                      {stu.avg}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-gray-400">No data yet.</p>}
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Subject Performance</h2>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          {data?.subjectPerf?.length ? (
            <ul className="space-y-3">
              {data.subjectPerf.slice(0, 6).map((sub, i) => {
                const g = gradeInfo(sub.avg);
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-24 truncate">{sub.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${g.bar} h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${sub.avg}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${g.bg} ${g.text}`}>
                      {sub.avg}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-gray-400">No marks data yet.</p>}
        </div>

        {/* Class Enrollment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Class Enrollment</h2>
            <GraduationCap size={15} className="text-blue-500" />
          </div>
          {data?.classBreakdown?.length ? (
            <>
              {/* Pass/fail bar */}
              {data.passRate != null && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                    <span>Pass / Fail split</span>
                    <span>{fmt(data.passRate)}% / {fmt(100 - data.passRate)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-400 h-full transition-all duration-700" style={{ width: `${data.passRate}%` }} />
                    <div className="bg-red-400 h-full transition-all duration-700" style={{ width: `${100 - data.passRate}%` }} />
                  </div>
                </div>
              )}
              <ul className="space-y-2.5">
                {data.classBreakdown.map((cls, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-20 truncate">{cls.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-400 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((cls.students / maxClass) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 w-6 text-right">{cls.students}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-sm text-gray-400">No class data found.</p>}
        </div>
      </div>

      {/* ── Row 4: Recent Exams ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800 text-lg">Recent Exams</h2>
          <Link to="/exams" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {data?.recentExams?.length ? (
          <div className="divide-y divide-gray-50">
            {data.recentExams.map((exam) => {
              const examLabel = exam.examType || exam.name || `Exam #${exam.id}`;
              const subject   = exam.subjectName || exam.subject?.name || '';
              const cls       = exam.className   || exam.classEntity?.className || '';
              return (
                <div
                  key={exam.id}
                  onClick={() => navigate('/exams')}
                  className="flex items-center justify-between py-3.5 hover:bg-gray-50
                    -mx-6 px-6 cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50
                      rounded-xl flex items-center justify-center shrink-0">
                      <Calendar size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{examLabel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[subject, exam.form ? `Form ${exam.form}` : '', cls].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm text-gray-600">
                      {exam.examDate
                        ? new Date(exam.examDate).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : ''}
                    </p>
                    {exam.examDate && (
                      <p className="text-xs text-gray-400">{timeAgo(exam.examDate)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">No exams found.</p>
        )}
      </div>

    </div>
  );
};

export default Dashboard;