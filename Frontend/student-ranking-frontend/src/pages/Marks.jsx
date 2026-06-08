import { useState, useEffect, useMemo } from "react";
import {
  getAllStudents,
  getAllSubjects,
  getAllClasses,
  addMarksBatch,
  getExamsBySubjectAndClass,
  getMarksByExam,
  updateMarks,
  deleteMarks,
  getRole,
  canEditSubject,
  getAssignments,
  getStudentEnrollment,
  getCurrentPeriod,
  getAllPeriods,
} from "../services/api";
import {
  Search, Plus, CheckCircle, FileText, X,
  Calendar, BookOpen, Users, Eye, Edit,
  Trash2, Save, BarChart2, Lock, ShieldAlert, TrendingUp,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getGradePoint = (marks) => {
  if (marks >= 80) return { point: 5, label: "A", tw: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (marks >= 70) return { point: 4, label: "B", tw: "bg-blue-100 text-blue-700 border-blue-200" };
  if (marks >= 60) return { point: 3, label: "C", tw: "bg-violet-100 text-violet-700 border-violet-200" };
  if (marks >= 40) return { point: 2, label: "D", tw: "bg-amber-100 text-amber-700 border-amber-200" };
  return { point: 1, label: "E", tw: "bg-red-100 text-red-700 border-red-200" };
};

const EXAM_TYPE_LABELS = {
  FINAL_EXAM: "Final Exam",
  MIDTERM:    "Midterm",
  QUIZ:       "Quiz",
  ASSIGNMENT: "Assignment",
  LAB_WORK:   "Lab Work",
  PROJECT:    "Project",
};

const STAT_CARDS = [
  {
    key: "students",
    label: "Total Students",
    icon: Users,
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-200",
    iconBg: "bg-white/20",
  },
  {
    key: "subjects",
    label: (isAdmin) => isAdmin ? "All Subjects" : "My Subjects",
    icon: BookOpen,
    gradient: "from-teal-500 to-emerald-600",
    shadow: "shadow-teal-200",
    iconBg: "bg-white/20",
  },
  {
    key: "classes",
    label: (isAdmin) => isAdmin ? "All Classes" : "My Classes",
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-200",
    iconBg: "bg-white/20",
  },
  {
    key: "month",
    label: "Active Exams",
    icon: Calendar,
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-200",
    iconBg: "bg-white/20",
  },
];

// Avatar colour from name
const avatarColor = (name = "") => {
  const colors = [
    "from-rose-400 to-pink-500",
    "from-violet-400 to-purple-500",
    "from-blue-400 to-indigo-500",
    "from-teal-400 to-emerald-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
  ];
  return colors[(name.charCodeAt(0) ?? 0) % colors.length];
};

// ─── Component ────────────────────────────────────────────────────────────────

const Marks = () => {
  const role        = getRole();
  const isPrincipal = role === "ROLE_PRINCIPAL";
  const isDeputy    = role === "ROLE_DEPUTY";
  const isAdmin     = isPrincipal || isDeputy;
  const assignments = getAssignments();

  const [loading,     setLoading]     = useState(true);
  const [students,    setStudents]    = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab,   setActiveTab]   = useState("add");

  const [addSubjectId,    setAddSubjectId]    = useState("");
  const [addClassId,      setAddClassId]      = useState("");
  const [addExamId,       setAddExamId]       = useState("");
  const [addExams,        setAddExams]        = useState([]);
  const [loadingAddExams, setLoadingAddExams] = useState(false);
  const [existingMarks,   setExistingMarks]   = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [marksInput,      setMarksInput]      = useState({});
  const [studentSearch,   setStudentSearch]   = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [submitted,       setSubmitted]       = useState(false);

  const [viewSubjectId,    setViewSubjectId]    = useState("");
  const [viewClassId,      setViewClassId]      = useState("");
  const [viewExamId,       setViewExamId]       = useState("");
  const [viewExams,        setViewExams]        = useState([]);
  const [loadingViewExams, setLoadingViewExams] = useState(false);
  const [viewMarks,        setViewMarks]        = useState([]);
  const [loadingMarks,     setLoadingMarks]     = useState(false);
  const [viewSearch,       setViewSearch]       = useState("");
  const [editingMark,      setEditingMark]      = useState(null);
  const [editingValue,     setEditingValue]     = useState("");
  const [currentPeriod,    setCurrentPeriod]    = useState(null);
  const [allPeriods,       setAllPeriods]       = useState([]);
  const [viewPeriodId,     setViewPeriodId]     = useState("");

  useEffect(() => {
    Promise.all([getAllStudents(), getAllSubjects(), getAllClasses(), getCurrentPeriod(), getAllPeriods()])
      .then(async ([s, sub, cls, period, periods]) => {
        setCurrentPeriod(period);
        setAllPeriods(periods);
        setStudents(s);
        setSubjects(sub);
        setClasses(cls);
        const results = await Promise.all(
          s.map((student) =>
            getStudentEnrollment(student.id)
              .then((data) =>
                (data.enrolledSubjects ?? []).map((subj) => ({
                  studentId: student.id,
                  subjectId: subj.subjectId,
                }))
              )
              .catch(() => [])
          )
        );
        setEnrollments(results.flat());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visibleSubjects = useMemo(() => {
    if (isAdmin) return subjects;
    const ids = new Set(assignments.map((a) => a.subjectId));
    return subjects.filter((s) => ids.has(s.subjectId));
  }, [isAdmin, subjects, assignments]);

  const getVisibleClassesForSubject = (subjectId) => {
    if (!subjectId) return isAdmin ? classes : [];
    if (isAdmin) return classes;
    const ids = new Set(assignments.filter((a) => a.subjectId === Number(subjectId)).map((a) => a.classId));
    return classes.filter((c) => ids.has(c.classId));
  };

  const addVisibleClasses  = useMemo(() => getVisibleClassesForSubject(addSubjectId),  [addSubjectId,  classes, assignments]);
  const viewVisibleClasses = useMemo(() => getVisibleClassesForSubject(viewSubjectId), [viewSubjectId, classes, assignments]);

  const classMap = useMemo(() =>
    classes.reduce((acc, c) => { acc[c.classId] = c; return acc; }, {}),
  [classes]);

  const enrolledStudentIds = useMemo(() => {
    if (!addSubjectId) return new Set();
    return new Set(enrollments.filter((e) => e.subjectId === Number(addSubjectId)).map((e) => e.studentId));
  }, [enrollments, addSubjectId]);

  const addClassStudents = useMemo(() => {
    if (!addClassId || !addSubjectId) return [];
    return students.filter((s) => s.classId === Number(addClassId) && enrolledStudentIds.has(s.id));
  }, [students, addClassId, addSubjectId, enrolledStudentIds]);

  useEffect(() => {
    if (!addSubjectId || !addClassId) { setAddExams([]); setAddExamId(""); return; }
    setLoadingAddExams(true);
    getExamsBySubjectAndClass(addSubjectId, addClassId)
      .then(setAddExams).catch(console.error)
      .finally(() => setLoadingAddExams(false));
  }, [addSubjectId, addClassId]);

  useEffect(() => {
    if (!addExamId) { setExistingMarks([]); return; }
    setLoadingExisting(true);
    getMarksByExam(addExamId)
      .then(setExistingMarks).catch(console.error)
      .finally(() => setLoadingExisting(false));
  }, [addExamId]);

  useEffect(() => {
    if (!viewSubjectId || !viewClassId) { setViewExams([]); setViewExamId(""); setViewMarks([]); return; }
    setLoadingViewExams(true);
    const periodId = viewPeriodId || null;
    getExamsBySubjectAndClass(viewSubjectId, viewClassId, periodId)
      .then(setViewExams).catch(console.error)
      .finally(() => setLoadingViewExams(false));
  }, [viewSubjectId, viewClassId, viewPeriodId]);

  useEffect(() => {
    if (!viewExamId) { setViewMarks([]); return; }
    setLoadingMarks(true);
    getMarksByExam(viewExamId)
      .then(setViewMarks).catch(console.error)
      .finally(() => setLoadingMarks(false));
  }, [viewExamId]);

  const existingMarksMap   = Object.fromEntries(existingMarks.map((m) => [m.studentId, m]));
  const pendingStudents    = addClassStudents.filter((s) => !existingMarksMap[s.id]);
  const doneStudents       = addClassStudents.filter((s) =>  existingMarksMap[s.id]);
  const filteredAddStudents = studentSearch.trim()
    ? addClassStudents.filter((s) =>
        `${s.firstName} ${s.secondName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
        String(s.id).includes(studentSearch))
    : addClassStudents;
  const filteredPending    = filteredAddStudents.filter((s) => !existingMarksMap[s.id]);
  const filteredDone       = filteredAddStudents.filter((s) =>  existingMarksMap[s.id]);
  const filteredViewMarks  = viewSearch.trim()
    ? viewMarks.filter((m) =>
        m.studentName?.toLowerCase().includes(viewSearch.toLowerCase()) ||
        String(m.studentId).includes(viewSearch))
    : viewMarks;
  const avgScore = viewMarks.length > 0
    ? Math.round(viewMarks.reduce((s, m) => s + m.marksValue, 0) / viewMarks.length)
    : null;

  const selectedViewExam = viewExams.find((ex) => String(ex.examId) === String(viewExamId));
  const viewReadOnly = selectedViewExam?.readOnly
    || (viewPeriodId && allPeriods.find((p) => String(p.id) === String(viewPeriodId))?.status === "CLOSED");

  const resetAdd = () => {
    setAddSubjectId(""); setAddClassId(""); setAddExamId("");
    setAddExams([]); setExistingMarks([]); setMarksInput({});
    setStudentSearch(""); setSubmitted(false);
  };

  const handleSubmitMarks = async () => {
    if (!addExamId) { alert("Please select an exam."); return; }
    if (pendingStudents.length === 0) { alert("All students already have marks for this exam."); return; }
    const payload = {
      subjectId: Number(addSubjectId),
      examId:    Number(addExamId),
      classId:   Number(addClassId),
      marks: pendingStudents.map((s) => ({ studentId: s.id, marksValue: Number(marksInput[s.id] ?? 0) })),
    };
    setSubmitting(true);
    try {
      await addMarksBatch(payload);
      const refreshed = await getMarksByExam(addExamId);
      setExistingMarks(refreshed);
      setMarksInput({});
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit marks. You may not be assigned to this subject.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (mark) => { setEditingMark(mark.marksId); setEditingValue(mark.marksValue); };
  const handleSaveEdit  = async (marksId) => {
    try {
      await updateMarks(marksId, Number(editingValue), Number(viewSubjectId), Number(viewClassId));
      setViewMarks((prev) => prev.map((m) => m.marksId === marksId ? { ...m, marksValue: Number(editingValue) } : m));
      setEditingMark(null);
    } catch (err) { console.error(err); alert("Failed to update mark."); }
  };
  const handleDelete = async (marksId) => {
    if (!window.confirm("Delete this mark?")) return;
    try {
      await deleteMarks(marksId);
      setViewMarks((prev) => prev.filter((m) => m.marksId !== marksId));
    } catch (err) { console.error(err); alert("Failed to delete mark."); }
  };

  // ── Shared select style ───────────────────────────────────────────────────
  const selectCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm disabled:bg-gray-50 disabled:text-gray-400 transition";

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isAdmin && assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">No Subjects Assigned</h2>
        <p className="text-gray-500 max-w-sm text-sm">You haven't been assigned to any subjects yet. Please contact an administrator.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="text-gray-400 text-sm">Loading marks data…</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-5">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Marks Submitted!</h2>
          <p className="text-gray-500 mt-1">All marks were saved successfully.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetAdd}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all">
            Add More Marks
          </button>
          <button onClick={() => { resetAdd(); setActiveTab("view"); }}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            View Marks
          </button>
        </div>
      </div>
    );
  }

  // ── Stat values ───────────────────────────────────────────────────────────
  const statValues = {
    students: students.length,
    subjects: visibleSubjects.length,
    classes:  isAdmin ? classes.length : new Set(assignments.map((a) => a.classId)).size,
    month:    addExams.length + viewExams.length || 0,
  };

  return (
    <div className="space-y-6 p-1">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marks Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isAdmin
              ? "Add and view student marks by subject, class and exam"
              : `Managing ${assignments.length} assigned subject${assignments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border ${
          isAdmin
            ? "bg-violet-50 text-violet-700 border-violet-200"
            : "bg-sky-50 text-sky-700 border-sky-200"
        }`}>
          {isAdmin ? "✦ Admin" : "◆ Teacher"}
        </span>
      </div>

      {currentPeriod && (
        <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-100
          rounded-xl px-4 py-2.5 font-semibold">
          Active term: {currentPeriod.year} · Term {currentPeriod.term}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, gradient, shadow, iconBg }) => (
          <div key={key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} text-white`}>
            {/* decorative circle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/10" />
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-3xl font-extrabold leading-none">{statValues[key]}</p>
            <p className="text-white/80 text-xs font-medium mt-1">
              {typeof label === "function" ? label(isAdmin) : label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tabs container ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tab buttons */}
        <div className="flex border-b border-gray-100 bg-gray-50/60">
          {[
            { id: "add",  icon: Plus, label: "Add Marks" },
            { id: "view", icon: Eye,  label: "View & Edit Marks" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                activeTab === id
                  ? "border-violet-600 text-violet-600 bg-white"
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-white/60"
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ══ ADD TAB ══ */}
          {activeTab === "add" && (
            <div className="space-y-5">

              {/* Step 1 */}
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Step 1 — Select Subject, Class &amp; Exam
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <BookOpen size={12} className="text-teal-500" /> Subject <span className="text-rose-400">*</span>
                    </label>
                    <select value={addSubjectId}
                      onChange={(e) => { setAddSubjectId(e.target.value); setAddClassId(""); setAddExamId(""); setExistingMarks([]); setMarksInput({}); }}
                      className={selectCls}>
                      <option value="">Select Subject</option>
                      {visibleSubjects.map((sub) => (
                        <option key={`sub-${sub.subjectId}`} value={sub.subjectId}>{sub.subjectName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Users size={12} className="text-violet-500" /> Class <span className="text-rose-400">*</span>
                    </label>
                    <select value={addClassId}
                      onChange={(e) => { setAddClassId(e.target.value); setAddExamId(""); setMarksInput({}); setExistingMarks([]); }}
                      disabled={!addSubjectId}
                      className={selectCls}>
                      <option value="">{!addSubjectId ? "Select subject first" : "Select Class"}</option>
                      {addVisibleClasses.map((c) => (
                        <option key={`add-cls-${c.classId}`} value={c.classId}>{c.className}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Calendar size={12} className="text-rose-500" /> Exam <span className="text-rose-400">*</span>
                    </label>
                    {loadingAddExams
                      ? <p className="text-sm text-gray-400 mt-2">Loading exams…</p>
                      : (
                        <select value={addExamId}
                          onChange={(e) => { setAddExamId(e.target.value); setMarksInput({}); }}
                          disabled={!addSubjectId || !addClassId}
                          className={selectCls}>
                          <option value="">
                            {!addSubjectId || !addClassId ? "Select subject & class first"
                              : addExams.length === 0 ? "No exams — create one in Exams page"
                              : "Select Exam"}
                          </option>
                          {addExams.map((ex) => (
                            <option key={`add-ex-${ex.examId}`} value={ex.examId}>
                              {EXAM_TYPE_LABELS[ex.examType] ?? ex.examType} — {ex.examDate}
                            </option>
                          ))}
                        </select>
                      )
                    }
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              {addExamId && addClassStudents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2 — Enter Marks</p>
                      {!loadingExisting && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-100">
                          {doneStudents.length}/{addClassStudents.length} submitted
                        </span>
                      )}
                    </div>
                    <div className="relative w-60">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <input type="text" placeholder="Search student…"
                        value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm" />
                    </div>
                  </div>

                  {loadingExisting
                    ? <div className="text-center py-10 text-gray-400 text-sm">Checking existing marks…</div>
                    : (
                      <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              {["Student", "Class", "Marks /100", "Grade", "Status"].map((h) => (
                                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredPending.map((s) => {
                              const val   = marksInput[s.id];
                              const grade = val === undefined || val === "" ? null : getGradePoint(Number(val));
                              return (
                                <tr key={`pending-${s.id}`} className="hover:bg-violet-50/30 transition-colors">
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 bg-gradient-to-br ${avatarColor(s.firstName)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                        {s.firstName?.charAt(0)}
                                      </div>
                                      <span className="font-semibold text-gray-800 text-sm">{s.firstName} {s.secondName}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-gray-500 text-sm">{classMap[s.classId]?.className ?? "—"}</td>
                                  <td className="px-5 py-3">
                                    <input type="number" min="0" max="100" placeholder="—"
                                      value={marksInput[s.id] ?? ""}
                                      onChange={(e) => setMarksInput((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                      className="w-20 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm" />
                                  </td>
                                  <td className="px-5 py-3">
                                    {grade
                                      ? <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.tw}`}>{grade.label} · {grade.point}</span>
                                      : <span className="text-gray-300 text-sm">—</span>
                                    }
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">Pending</span>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredDone.map((s) => {
                              const existing = existingMarksMap[s.id];
                              const grade    = getGradePoint(existing.marksValue);
                              return (
                                <tr key={`done-${s.id}`} className="bg-emerald-50/40">
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                        {s.firstName?.charAt(0)}
                                      </div>
                                      <span className="font-semibold text-gray-700 text-sm">{s.firstName} {s.secondName}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-gray-500 text-sm">{classMap[s.classId]?.className ?? "—"}</td>
                                  <td className="px-5 py-3">
                                    <span className="font-extrabold text-gray-800 text-base">{existing.marksValue}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.tw}`}>{grade.label} · {grade.point}</span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <Lock size={11} className="text-emerald-500" />
                                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Submitted</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  }

                  {!loadingExisting && pendingStudents.length === 0 && (
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-800">All marks submitted for this exam</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Switch to <strong>View &amp; Edit Marks</strong> to make changes</p>
                      </div>
                      <button onClick={() => { resetAdd(); setActiveTab("view"); }}
                        className="px-4 py-2 text-xs bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition">
                        View &amp; Edit
                      </button>
                    </div>
                  )}

                  {!loadingExisting && pendingStudents.length > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={resetAdd}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                        <X size={14} /> Reset
                      </button>
                      <button onClick={handleSubmitMarks} disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all disabled:opacity-60">
                        <CheckCircle size={15} />
                        {submitting ? "Submitting…" : `Submit ${pendingStudents.length} Pending`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {addExamId && addClassStudents.length === 0 && (
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800">No enrolled students</p>
                    <p className="text-xs text-amber-600 mt-0.5">No students in this class are enrolled in the selected subject. Go to <strong>Students → Enroll</strong>.</p>
                  </div>
                </div>
              )}

              {addSubjectId && addClassId && !addExamId && !loadingAddExams && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-700 font-medium">
                  ⚠️ No exam selected. Go to the <strong>Exams</strong> page to create one first.
                </div>
              )}
            </div>
          )}

          {/* ══ VIEW & EDIT TAB ══ */}
          {activeTab === "view" && (
            <div className="space-y-5">

              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Select Subject, Class &amp; Exam to view marks
                </p>
                {viewReadOnly && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <Lock size={14} /> This term is closed — marks are read-only.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Academic Term</label>
                    <select
                      value={viewPeriodId}
                      onChange={(e) => { setViewPeriodId(e.target.value); setViewExamId(""); setViewMarks([]); }}
                      className={selectCls}>
                      <option value="">Current term</option>
                      {allPeriods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.year} · Term {p.term}{p.status === "CLOSED" ? " (closed)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <BookOpen size={12} className="text-teal-500" /> Subject
                    </label>
                    <select value={viewSubjectId}
                      onChange={(e) => { setViewSubjectId(e.target.value); setViewClassId(""); setViewExamId(""); setViewMarks([]); }}
                      className={selectCls}>
                      <option value="">Select Subject</option>
                      {visibleSubjects.map((sub) => (
                        <option key={`view-sub-${sub.subjectId}`} value={sub.subjectId}>{sub.subjectName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Users size={12} className="text-violet-500" /> Class
                    </label>
                    <select value={viewClassId}
                      onChange={(e) => { setViewClassId(e.target.value); setViewExamId(""); setViewMarks([]); }}
                      disabled={!viewSubjectId}
                      className={selectCls}>
                      <option value="">{!viewSubjectId ? "Select subject first" : "Select Class"}</option>
                      {viewVisibleClasses.map((c) => (
                        <option key={`view-cls-${c.classId}`} value={c.classId}>{c.className}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Calendar size={12} className="text-rose-500" /> Exam
                    </label>
                    {loadingViewExams
                      ? <p className="text-sm text-gray-400 mt-2">Loading exams…</p>
                      : (
                        <select value={viewExamId}
                          onChange={(e) => setViewExamId(e.target.value)}
                          disabled={!viewSubjectId || !viewClassId}
                          className={selectCls}>
                          <option value="">
                            {!viewSubjectId || !viewClassId ? "Select subject & class first"
                              : viewExams.length === 0 ? "No exams found"
                              : "Select Exam"}
                          </option>
                          {viewExams.map((ex) => (
                            <option key={`view-ex-${ex.examId}`} value={ex.examId}>
                              {EXAM_TYPE_LABELS[ex.examType] ?? ex.examType} — {ex.examDate}
                            </option>
                          ))}
                        </select>
                      )
                    }
                  </div>
                </div>
              </div>

              {loadingMarks && (
                <div className="flex items-center justify-center py-14 gap-3 text-gray-400">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
                  <span className="text-sm">Loading marks…</span>
                </div>
              )}

              {!loadingMarks && viewExamId && (
                <>
                  {viewMarks.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Students", value: viewMarks.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
                        { label: "Class Average", value: `${avgScore}%`, icon: BarChart2, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                        { label: "Top Score", value: `${Math.max(...viewMarks.map((m) => m.marksValue))}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                        { label: "Lowest Score", value: `${Math.min(...viewMarks.map((m) => m.marksValue))}%`, icon: BarChart2, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
                      ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${bg}`}>
                          <Icon size={16} className={color} />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">{label}</p>
                            <p className={`text-base font-extrabold ${color}`}>{value}</p>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-2 md:col-span-4 flex justify-end">
                        <div className="relative w-60">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                          <input type="text" placeholder="Search student…"
                            value={viewSearch} onChange={(e) => setViewSearch(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["Student", "Class", "Marks", "Grade",
                            canEditSubject(Number(viewSubjectId), Number(viewClassId)) && !viewReadOnly ? "Actions" : null
                          ].filter(Boolean).map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {filteredViewMarks.map((m) => {
                          const isEditing = editingMark === m.marksId;
                          const grade     = getGradePoint(m.marksValue);
                          const canEdit   = canEditSubject(Number(viewSubjectId), Number(viewClassId)) && !viewReadOnly;
                          return (
                            <tr key={`view-mark-${m.marksId}`} className="hover:bg-violet-50/20 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 bg-gradient-to-br ${avatarColor(m.studentName)} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                    {m.studentName?.charAt(0) ?? "?"}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800 text-sm">{m.studentName}</div>
                                    <div className="text-xs text-gray-400">ID {m.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-gray-500 text-sm">
                                {classMap[students.find((s) => s.id === m.studentId)?.classId]?.className ?? "—"}
                              </td>
                              <td className="px-5 py-3.5">
                                {isEditing
                                  ? <input type="number" min="0" max="100"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-20 border border-violet-300 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-400"
                                      autoFocus />
                                  : <span className="font-extrabold text-gray-800 text-base">{m.marksValue}</span>
                                }
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.tw}`}>
                                  {grade.label} · {grade.point}
                                </span>
                              </td>
                              {canEdit && (
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <button onClick={() => handleSaveEdit(m.marksId)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-xl font-semibold hover:bg-emerald-700 transition">
                                          <Save size={11} /> Save
                                        </button>
                                        <button onClick={() => setEditingMark(null)}
                                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-xl font-semibold hover:bg-gray-50 transition">
                                          <X size={11} /> Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => handleStartEdit(m)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-xl font-semibold hover:bg-violet-700 transition">
                                          <Edit size={11} /> Edit
                                        </button>
                                        {isAdmin && (
                                          <button onClick={() => handleDelete(m.marksId)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs rounded-xl font-semibold hover:bg-rose-700 transition">
                                            <Trash2 size={11} /> Delete
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {filteredViewMarks.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-semibold">No marks found for this exam</p>
                        <p className="text-gray-400 text-sm mt-1">Switch to the Add Marks tab to enter marks</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!viewExamId && !loadingMarks && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-semibold">Select a subject, class and exam above</p>
                  <p className="text-gray-400 text-sm mt-1">Marks will appear here once an exam is selected</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Marks;