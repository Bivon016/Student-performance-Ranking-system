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
} from "../services/api";
import {
  Search, Plus, CheckCircle, FileText, X,
  Calendar, BookOpen, Users, Eye, Edit,
  Trash2, Save, BarChart, Lock, ShieldAlert,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getGradePoint = (marks) => {
  if (marks >= 80) return { point: 5, color: "bg-green-100 text-green-700" };
  if (marks >= 70) return { point: 4, color: "bg-blue-100 text-blue-700" };
  if (marks >= 60) return { point: 3, color: "bg-yellow-100 text-yellow-700" };
  if (marks >= 40) return { point: 2, color: "bg-orange-100 text-orange-700" };
  return { point: 1, color: "bg-red-100 text-red-700" };
};

const EXAM_TYPE_LABELS = {
  FINAL_EXAM: "Final Exam",
  MIDTERM:    "Midterm",
  QUIZ:       "Quiz",
  ASSIGNMENT: "Assignment",
  LAB_WORK:   "Lab Work",
  PROJECT:    "Project",
};

// ─── Component ────────────────────────────────────────────────────────────────

const Marks = () => {
  const role        = getRole();
  const isPrincipal = role === "ROLE_PRINCIPAL";
  const isDeputy    = role === "ROLE_DEPUTY";
  const isAdmin     = isPrincipal || isDeputy;
  const assignments = getAssignments();

  // ── Shared ──────────────────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true);
  const [students,    setStudents]    = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]); // { studentId, subjectId }
  const [activeTab,   setActiveTab]   = useState("add");

  // ── ADD TAB ─────────────────────────────────────────────────────────────────
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

  // ── VIEW TAB ────────────────────────────────────────────────────────────────
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

  // ── Bootstrap ────────────────────────────────────────────────────────────────
useEffect(() => {
  Promise.all([getAllStudents(), getAllSubjects(), getAllClasses()])
    .then(async ([s, sub, cls]) => {
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

  // ── Role-filtered subjects & classes ─────────────────────────────────────────
  const visibleSubjects = useMemo(() => {
    if (isAdmin) return subjects;
    const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId));
    return subjects.filter((s) => assignedSubjectIds.has(s.subjectId));
  }, [isAdmin, subjects, assignments]);

  const getVisibleClassesForSubject = (subjectId) => {
    if (!subjectId) return isAdmin ? classes : [];
    if (isAdmin) return classes;
    const assignedClassIds = new Set(
      assignments
        .filter((a) => a.subjectId === Number(subjectId))
        .map((a) => a.classId)
    );
    return classes.filter((c) => assignedClassIds.has(c.classId));
  };

  const addVisibleClasses  = useMemo(() => getVisibleClassesForSubject(addSubjectId),  [addSubjectId,  classes, assignments]);
  const viewVisibleClasses = useMemo(() => getVisibleClassesForSubject(viewSubjectId), [viewSubjectId, classes, assignments]);

  // ── classId → class object map ───────────────────────────────────────────────
  const classMap = useMemo(() =>
    classes.reduce((acc, c) => { acc[c.classId] = c; return acc; }, {}),
  [classes]);

  // ── Enrolled student IDs for the currently selected add-tab subject ──────────
  // Only students enrolled in addSubjectId are shown in the marks entry table.
  const enrolledStudentIds = useMemo(() => {
    if (!addSubjectId) return new Set();
    return new Set(
      enrollments
        .filter((e) => e.subjectId === Number(addSubjectId))
        .map((e) => e.studentId)
    );
  }, [enrollments, addSubjectId]);

  // ── Students in selected class who are also enrolled in the selected subject ──
  const addClassStudents = useMemo(() => {
    if (!addClassId || !addSubjectId) return [];
    return students.filter(
      (s) =>
        s.classId === Number(addClassId) &&
        enrolledStudentIds.has(s.id)
    );
  }, [students, addClassId, addSubjectId, enrolledStudentIds]);

  // ── Add tab: fetch exams when subject + class change ─────────────────────────
  useEffect(() => {
    if (!addSubjectId || !addClassId) { setAddExams([]); setAddExamId(""); return; }
    setLoadingAddExams(true);
    getExamsBySubjectAndClass(addSubjectId, addClassId)
      .then(setAddExams).catch(console.error)
      .finally(() => setLoadingAddExams(false));
  }, [addSubjectId, addClassId]);

  // ── Add tab: fetch existing marks when exam selected ─────────────────────────
  useEffect(() => {
    if (!addExamId) { setExistingMarks([]); return; }
    setLoadingExisting(true);
    getMarksByExam(addExamId)
      .then(setExistingMarks).catch(console.error)
      .finally(() => setLoadingExisting(false));
  }, [addExamId]);

  // ── View tab: fetch exams ────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewSubjectId || !viewClassId) {
      setViewExams([]); setViewExamId(""); setViewMarks([]);
      return;
    }
    setLoadingViewExams(true);
    getExamsBySubjectAndClass(viewSubjectId, viewClassId)
      .then(setViewExams).catch(console.error)
      .finally(() => setLoadingViewExams(false));
  }, [viewSubjectId, viewClassId]);

  // ── View tab: fetch marks when exam chosen ───────────────────────────────────
  useEffect(() => {
    if (!viewExamId) { setViewMarks([]); return; }
    setLoadingMarks(true);
    getMarksByExam(viewExamId)
      .then(setViewMarks).catch(console.error)
      .finally(() => setLoadingMarks(false));
  }, [viewExamId]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const existingMarksMap = Object.fromEntries(
    existingMarks.map((m) => [m.studentId, m])
  );

  const pendingStudents = addClassStudents.filter((s) => !existingMarksMap[s.id]);
  const doneStudents    = addClassStudents.filter((s) =>  existingMarksMap[s.id]);

  const filteredAddStudents = studentSearch.trim()
    ? addClassStudents.filter((s) =>
        `${s.firstName} ${s.secondName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
        String(s.id).includes(studentSearch))
    : addClassStudents;

  const filteredPending = filteredAddStudents.filter((s) => !existingMarksMap[s.id]);
  const filteredDone    = filteredAddStudents.filter((s) =>  existingMarksMap[s.id]);

  const filteredViewMarks = viewSearch.trim()
    ? viewMarks.filter((m) =>
        m.studentName?.toLowerCase().includes(viewSearch.toLowerCase()) ||
        String(m.studentId).includes(viewSearch))
    : viewMarks;

  const avgScore = viewMarks.length > 0
    ? Math.round(viewMarks.reduce((s, m) => s + m.marksValue, 0) / viewMarks.length)
    : null;

  // ── Add handlers ─────────────────────────────────────────────────────────────
  const resetAdd = () => {
    setAddSubjectId(""); setAddClassId(""); setAddExamId("");
    setAddExams([]); setExistingMarks([]); setMarksInput({});
    setStudentSearch(""); setSubmitted(false);
  };

  const handleSubmitMarks = async () => {
    if (!addExamId) { alert("Please select an exam."); return; }
    if (pendingStudents.length === 0) {
      alert("All students already have marks for this exam.");
      return;
    }
    const payload = {
      subjectId: Number(addSubjectId),
      examId:    Number(addExamId),
      classId:   Number(addClassId),
      marks: pendingStudents.map((s) => ({
        studentId:  s.id,
        marksValue: Number(marksInput[s.id] ?? 0),
      })),
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

  // ── View / edit handlers ──────────────────────────────────────────────────────
  const handleStartEdit = (mark) => {
    setEditingMark(mark.marksId);
    setEditingValue(mark.marksValue);
  };

  const handleSaveEdit = async (marksId) => {
    try {
      await updateMarks(marksId, Number(editingValue), Number(viewSubjectId), Number(viewClassId));
      setViewMarks((prev) =>
        prev.map((m) => m.marksId === marksId ? { ...m, marksValue: Number(editingValue) } : m)
      );
      setEditingMark(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update mark. You may not be assigned to this subject.");
    }
  };

  const handleDelete = async (marksId) => {
    if (!window.confirm("Delete this mark?")) return;
    try {
      await deleteMarks(marksId);
      setViewMarks((prev) => prev.filter((m) => m.marksId !== marksId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete mark.");
    }
  };

  // ── No assignments guard ─────────────────────────────────────────────────────
  if (!isAdmin && assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center">
        <ShieldAlert className="h-14 w-14 text-amber-400" />
        <h2 className="text-xl font-bold text-gray-800">No Subjects Assigned</h2>
        <p className="text-gray-500 max-w-sm">
          You haven't been assigned to any subjects yet. Please contact an administrator
          to assign your subjects and classes before you can enter marks.
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading…</p>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-800">Marks Submitted!</h2>
        <p className="text-gray-500">All marks were saved successfully.</p>
        <div className="flex gap-3">
          <button onClick={resetAdd}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add More Marks
          </button>
          <button onClick={() => { resetAdd(); setActiveTab("view"); }}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            View Marks
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Marks Management</h1>
          <p className="text-gray-600">
            {isAdmin
              ? "Add and view student marks by subject, class and exam"
              : `Showing your ${assignments.length} assigned subject${assignments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
        }`}>
          {isAdmin ? "Admin" : "Teacher"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold mt-1">{students.length}</p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{isAdmin ? "All Subjects" : "My Subjects"}</p>
            <p className="text-2xl font-bold mt-1">{visibleSubjects.length}</p>
          </div>
          <BookOpen className="h-8 w-8 text-green-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{isAdmin ? "All Classes" : "My Classes"}</p>
            <p className="text-2xl font-bold mt-1">
              {isAdmin ? classes.length : new Set(assignments.map((a) => a.classId)).size}
            </p>
          </div>
          <FileText className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      {/* Tabs container */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        {/* Tab buttons */}
        <div className="flex border-b">
          <button onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "add"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            <Plus size={16} />Add Marks
          </button>
          <button onClick={() => setActiveTab("view")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "view"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            <Eye size={16} />View &amp; Edit Marks
          </button>
        </div>

        <div className="p-6">

          {/* ══════════════════════════════════════
              ADD TAB
          ══════════════════════════════════════ */}
          {activeTab === "add" && (
            <div className="space-y-6">

              {/* Step 1 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Step 1 — Select Subject, Class &amp; Exam
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <BookOpen size={14} className="inline mr-1" />Subject *
                    </label>
                    <select value={addSubjectId}
                      onChange={(e) => {
                        setAddSubjectId(e.target.value);
                        setAddClassId("");
                        setAddExamId("");
                        setExistingMarks([]);
                        setMarksInput({});
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Subject</option>
                      {visibleSubjects.map((sub) => (
                        <option key={`sub-${sub.subjectId}`} value={sub.subjectId}>
                          {sub.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Users size={14} className="inline mr-1" />Class *
                    </label>
                    <select value={addClassId}
                      onChange={(e) => {
                        setAddClassId(e.target.value);
                        setAddExamId("");
                        setMarksInput({});
                        setExistingMarks([]);
                      }}
                      disabled={!addSubjectId}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">
                        {!addSubjectId ? "Select subject first" : "Select Class"}
                      </option>
                      {addVisibleClasses.map((c) => (
                        <option key={`add-cls-${c.classId}`} value={c.classId}>
                          {c.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar size={14} className="inline mr-1" />Exam *
                    </label>
                    {loadingAddExams ? (
                      <p className="text-sm text-gray-400 mt-2">Loading exams…</p>
                    ) : (
                      <select value={addExamId}
                        onChange={(e) => { setAddExamId(e.target.value); setMarksInput({}); }}
                        disabled={!addSubjectId || !addClassId}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                        <option value="">
                          {!addSubjectId || !addClassId
                            ? "Select subject & class first"
                            : addExams.length === 0
                            ? "No exams — create one in Exams page"
                            : "Select Exam"}
                        </option>
                        {addExams.map((ex) => (
                          <option key={`add-ex-${ex.examId}`} value={ex.examId}>
                            {EXAM_TYPE_LABELS[ex.examType] ?? ex.examType} — {ex.examDate}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 — student table */}
              {addExamId && addClassStudents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Step 2 — Enter Marks
                      </p>
                      {!loadingExisting && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                          {doneStudents.length}/{addClassStudents.length} submitted
                        </span>
                      )}
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" placeholder="Search student…"
                        value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {loadingExisting ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Checking existing marks…</div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade Point</th>
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">

                          {/* Pending students — enrolled in subject, no mark yet */}
                          {filteredPending.map((s) => {
                            const inputValue = marksInput[s.id];
                            const grade = inputValue === undefined || inputValue === ""
                              ? null : getGradePoint(Number(inputValue));
                            return (
                              <tr key={`pending-${s.id}`} className="hover:bg-gray-50">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {s.firstName?.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900">{s.firstName} {s.secondName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-gray-600 text-sm">{classMap[s.classId]?.className ?? "—"}</td>
                                <td className="px-5 py-3">
                                  <input type="number" min="0" max="100" placeholder="0"
                                    value={marksInput[s.id] ?? ""}
                                    onChange={(e) => setMarksInput((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                    className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </td>
                                <td className="px-5 py-3">
                                  {grade ? (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${grade.color}`}>
                                      {grade.point}
                                    </span>
                                  ) : <span className="text-gray-400 text-sm">—</span>}
                                </td>
                                <td className="px-5 py-3">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                    Pending
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Done students — already have a mark */}
                          {filteredDone.map((s) => {
                            const existing = existingMarksMap[s.id];
                            const grade = getGradePoint(existing.marksValue);
                            return (
                              <tr key={`done-${s.id}`} className="bg-green-50">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {s.firstName?.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-700">{s.firstName} {s.secondName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-gray-600 text-sm">{classMap[s.classId]?.className ?? "—"}</td>
                                <td className="px-5 py-3">
                                  <span className="font-bold text-gray-800">{existing.marksValue}</span>
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${grade.color}`}>
                                    {grade.point}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <Lock size={12} className="text-green-600" />
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      Submitted
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                        </tbody>
                      </table>
                    </div>
                  )}

                  {!loadingExisting && pendingStudents.length === 0 && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">All marks submitted for this exam</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          To edit marks, switch to the <strong>View &amp; Edit Marks</strong> tab
                        </p>
                      </div>
                      <button onClick={() => { resetAdd(); setActiveTab("view"); }}
                        className="ml-auto px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                        View &amp; Edit
                      </button>
                    </div>
                  )}

                  {!loadingExisting && pendingStudents.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <button onClick={resetAdd}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <X size={16} />Reset
                      </button>
                      <button onClick={handleSubmitMarks} disabled={submitting}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                        <CheckCircle size={16} />
                        <span>{submitting ? "Submitting…" : `Submit ${pendingStudents.length} Pending`}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No enrolled students in this class for this subject */}
              {addExamId && addClassStudents.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">No enrolled students</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      No students in this class are enrolled in the selected subject.
                      Go to <strong>Students → Enroll</strong> to set up subject enrollments.
                    </p>
                  </div>
                </div>
              )}

              {addSubjectId && addClassId && !addExamId && !loadingAddExams && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
                  ⚠️ No exam selected. Go to the <strong>Exams</strong> page to create one first.
                </p>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              VIEW & EDIT TAB
          ══════════════════════════════════════ */}
          {activeTab === "view" && (
            <div className="space-y-6">

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Select Subject, Class &amp; Exam to view marks
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <BookOpen size={14} className="inline mr-1" />Subject
                    </label>
                    <select value={viewSubjectId}
                      onChange={(e) => {
                        setViewSubjectId(e.target.value);
                        setViewClassId("");
                        setViewExamId("");
                        setViewMarks([]);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Subject</option>
                      {visibleSubjects.map((sub) => (
                        <option key={`view-sub-${sub.subjectId}`} value={sub.subjectId}>
                          {sub.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Users size={14} className="inline mr-1" />Class
                    </label>
                    <select value={viewClassId}
                      onChange={(e) => {
                        setViewClassId(e.target.value);
                        setViewExamId("");
                        setViewMarks([]);
                      }}
                      disabled={!viewSubjectId}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">
                        {!viewSubjectId ? "Select subject first" : "Select Class"}
                      </option>
                      {viewVisibleClasses.map((c) => (
                        <option key={`view-cls-${c.classId}`} value={c.classId}>
                          {c.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar size={14} className="inline mr-1" />Exam
                    </label>
                    {loadingViewExams ? (
                      <p className="text-sm text-gray-400 mt-2">Loading exams…</p>
                    ) : (
                      <select value={viewExamId}
                        onChange={(e) => setViewExamId(e.target.value)}
                        disabled={!viewSubjectId || !viewClassId}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
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
                    )}
                  </div>
                </div>
              </div>

              {loadingMarks && (
                <div className="text-center py-10 text-gray-400">Loading marks…</div>
              )}

              {!loadingMarks && viewExamId && (
                <>
                  {viewMarks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-6 p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">{viewMarks.length} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Class avg: <strong>{avgScore}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Top score: <strong>{Math.max(...viewMarks.map((m) => m.marksValue))}</strong>
                        </span>
                      </div>
                      <div className="relative ml-auto w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input type="text" placeholder="Search student…"
                          value={viewSearch} onChange={(e) => setViewSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}

                  <div className="border rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade Point</th>
                          {canEditSubject(Number(viewSubjectId), Number(viewClassId)) && (
                            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredViewMarks.map((m) => {
                          const isEditing = editingMark === m.marksId;
                          const grade     = getGradePoint(m.marksValue);
                          const canEdit   = canEditSubject(Number(viewSubjectId), Number(viewClassId));

                          return (
                            <tr key={`view-mark-${m.marksId}`} className="hover:bg-gray-50">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {m.studentName?.charAt(0) ?? "?"}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{m.studentName}</div>
                                    <div className="text-xs text-gray-400">ID {m.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-gray-600 text-sm">
                                {classMap[students.find((s) => s.id === m.studentId)?.classId]?.className ?? "—"}
                              </td>
                              <td className="px-5 py-3">
                                {isEditing ? (
                                  <input type="number" min="0" max="100"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-24 border border-blue-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus />
                                ) : (
                                  <span className="font-bold text-gray-900">{m.marksValue}</span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${grade.color}`}>
                                  {grade.point}
                                </span>
                              </td>

                              {canEdit && (
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <button onClick={() => handleSaveEdit(m.marksId)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                                          <Save size={12} /><span>Save</span>
                                        </button>
                                        <button onClick={() => setEditingMark(null)}
                                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50">
                                          <X size={12} /><span>Cancel</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => handleStartEdit(m)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                                          <Edit size={12} /><span>Edit</span>
                                        </button>
                                        {isAdmin && (
                                          <button onClick={() => handleDelete(m.marksId)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                                            <Trash2 size={12} /><span>Delete</span>
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
                      <div className="text-center py-12">
                        <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No marks found for this exam</p>
                        <p className="text-gray-400 text-sm">Switch to the Add Marks tab to enter marks</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!viewExamId && !loadingMarks && (
                <div className="text-center py-14">
                  <Eye className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Select a subject, class and exam above</p>
                  <p className="text-gray-400 text-sm">Marks will appear here once an exam is selected</p>
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