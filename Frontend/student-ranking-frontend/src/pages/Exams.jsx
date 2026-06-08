import React, { useState, useEffect } from "react";
import {
  getAllSubjects, getAllExams, createExam, deleteExam, getAllClasses,
  getCurrentPeriod, getAllPeriods,
} from "../services/api";
import * as XLSX from "xlsx";
import {
  Plus, Trash2, Edit, X, Save,
  Calendar, BookOpen, Users, FileText,
  Search, CheckCircle, Zap, ChevronDown, ChevronRight, BarChart2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_TYPE_OPTIONS = [
  { value: "FINAL_EXAM",  label: "Final Exam"  },
  { value: "MIDTERM",     label: "Midterm"     },
  { value: "QUIZ",        label: "Quiz"        },
  { value: "ASSIGNMENT",  label: "Assignment"  },
  { value: "LAB_WORK",    label: "Lab Work"    },
  { value: "PROJECT",     label: "Project"     },
];

// Distinct gradient per exam type for group headers and chips
const EXAM_TYPE_GRADIENTS = {
  FINAL_EXAM:  "from-rose-500    to-red-600",
  MIDTERM:     "from-orange-400  to-amber-500",
  QUIZ:        "from-yellow-400  to-lime-500",
  ASSIGNMENT:  "from-sky-500     to-blue-600",
  LAB_WORK:    "from-violet-500  to-purple-600",
  PROJECT:     "from-emerald-500 to-teal-600",
};

const EXAM_TYPE_BADGES = {
  FINAL_EXAM:  "bg-rose-100    text-rose-800",
  MIDTERM:     "bg-orange-100  text-orange-800",
  QUIZ:        "bg-yellow-100  text-yellow-800",
  ASSIGNMENT:  "bg-sky-100     text-sky-800",
  LAB_WORK:    "bg-violet-100  text-violet-800",
  PROJECT:     "bg-emerald-100 text-emerald-800",
};

// Stat card gradients — deliberately different from subjects/students
const STAT_GRADIENTS = [
  "from-rose-500    to-pink-600",
  "from-teal-500    to-emerald-600",
  "from-violet-500  to-purple-600",
  "from-amber-400   to-orange-500",
];

const EMPTY_FORM    = { subjectId: "", classId: "", examType: "", examDate: "" };
const EMPTY_FILTERS = { subject: "all", type: "all", class: "all" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const examTypeLabel    = (v) => EXAM_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;
const getTypeGradient  = (v) => EXAM_TYPE_GRADIENTS[v] ?? "from-gray-400 to-gray-500";
const getTypeBadge     = (v) => EXAM_TYPE_BADGES[v]    ?? "bg-gray-100 text-gray-700";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />
);

// ─── Select All Bar ───────────────────────────────────────────────────────────
function SelectAllBar({ onAll, onClear }) {
  return (
    <div className="flex gap-2 text-xs">
      <button onClick={onAll}   className="text-blue-600 hover:underline font-medium">All</button>
      <span className="text-gray-300">|</span>
      <button onClick={onClear} className="text-gray-400 hover:underline">Clear</button>
    </div>
  );
}

// ─── Exam Group (collapsible) ─────────────────────────────────────────────────
function ExamGroup({ examType, rows, subjects, classes, onEdit, onDelete, onView, viewingClosed }) {
  const [open, setOpen] = useState(true);
  const label    = examTypeLabel(examType);
  const gradient = getTypeGradient(examType);
  const badge    = getTypeBadge(examType);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Coloured top stripe */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      {/* Group header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5
          hover:bg-gray-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronDown  size={16} className="text-gray-400" />
            : <ChevronRight size={16} className="text-gray-400" />}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
            {label}
          </span>
          <span className="text-sm text-gray-500 font-medium">
            {rows.length} exam{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-gray-50">
          <table className="min-w-full divide-y divide-gray-50">
            <thead>
              <tr className="bg-gray-50/50">
                {["Subject", "Class", "Date", "Term", "ID", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold
                    text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((exam) => {
                const subjectName = subjects.find((s) => s.subjectId === exam.subjectId)?.subjectName ?? "—";
                const className   = classes.find((c) => c.classId   === exam.classId)?.className     ?? "—";
                return (
                  <tr key={exam.examId}
                    className="hover:bg-gray-50/80 transition-colors duration-150">

                    {/* Subject */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          text-white font-bold text-xs shrink-0 bg-gradient-to-br ${gradient}`}>
                          {subjectName.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{subjectName}</span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1
                        rounded-full font-semibold">
                        {className}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Calendar size={13} className="text-gray-400 shrink-0" />
                        {exam.examDate}
                      </div>
                    </td>

                    {/* Term */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1
                        rounded-full font-medium">
                        {exam.periodYear} T{exam.periodTerm}
                      </span>
                    </td>

                    {/* ID */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono bg-gray-100 text-gray-500
                        px-2.5 py-1 rounded-lg">
                        #{exam.examId}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onView(exam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                            bg-emerald-50 text-emerald-600 text-xs font-semibold
                            hover:bg-emerald-600 hover:text-white transition-colors">
                          <BarChart2 size={12} /> View Marks
                        </button>
                        {!viewingClosed && !exam.readOnly && (
                          <>
                            <button onClick={() => onEdit(exam)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-blue-50 text-blue-600 text-xs font-semibold
                                hover:bg-blue-600 hover:text-white transition-colors">
                              <Edit size={12} /> Edit
                            </button>
                            <button onClick={() => onDelete(exam.examId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-red-50 text-red-500 text-xs font-semibold
                                hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 size={12} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Exams = () => {
  const [loading,  setLoading]  = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [period,       setPeriod]       = useState(null);
  const [allPeriods,   setAllPeriods]   = useState([]);
  const [viewPeriodId, setViewPeriodId] = useState("");

  const [mode, setMode] = useState(null); // null | "single" | "bulk"

  // Single form
  const [editingExam, setEditingExam] = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  // Bulk
  const [bulkClasses,  setBulkClasses]  = useState([]);
  const [bulkSubjects, setBulkSubjects] = useState([]);
  const [bulkExamType, setBulkExamType] = useState("");
  const [bulkDate,     setBulkDate]     = useState("");
  const [bulkSaving,   setBulkSaving]   = useState(false);
  const [bulkDone,     setBulkDone]     = useState(null);

  // Search / filter
  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Drawer
  const [drawerExam,     setDrawerExam]     = useState(null);
  const [comparisonData, setComparisonData] = useState([]);
  const [drawerLoading,  setDrawerLoading]  = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getAllSubjects(), getAllClasses(), getCurrentPeriod(), getAllPeriods()])
      .then(([s, c, p, periods]) => {
        setSubjects(s);
        setClasses(c);
        setPeriod(p);
        setAllPeriods(periods);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const periodId = viewPeriodId || null;
    getAllExams(periodId)
      .then(setExams)
      .catch(console.error);
  }, [viewPeriodId]);

  const viewingClosed = viewPeriodId
    ? allPeriods.find((p) => String(p.id) === String(viewPeriodId))?.status === "CLOSED"
    : false;
  const canCreateExams = period && period.status !== "CLOSED" && !viewingClosed;

  // ── Filtering & grouping ──────────────────────────────────────────────────
  const filteredExams = exams.filter((ex) => {
    const subjectName = subjects.find((s) => s.subjectId === ex.subjectId)?.subjectName ?? "";
    const clsName     = classes.find((c)  => c.classId   === ex.classId)?.className     ?? "";
    const typeLabel   = examTypeLabel(ex.examType);
    const matchSearch =
      subjectName.toLowerCase().includes(search.toLowerCase()) ||
      typeLabel.toLowerCase().includes(search.toLowerCase())   ||
      clsName.toLowerCase().includes(search.toLowerCase())     ||
      String(ex.examDate).includes(search);
    const matchSubject = filters.subject === "all" || String(ex.subjectId) === String(filters.subject);
    const matchType    = filters.type    === "all" || ex.examType === filters.type;
    const matchClass   = filters.class   === "all" || String(ex.classId)   === String(filters.class);
    return matchSearch && matchSubject && matchType && matchClass;
  });

  const grouped = EXAM_TYPE_OPTIONS
    .map(({ value }) => ({ examType: value, rows: filteredExams.filter((ex) => ex.examType === value) }))
    .filter(({ rows }) => rows.length > 0);

  const filtersActive = search || Object.values(filters).some((v) => v !== "all");
  const clearFilters  = () => { setSearch(""); setFilters(EMPTY_FILTERS); };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const thisMonthCount = exams.filter((e) => {
    const d = new Date(e.examDate), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  // ── Bulk helpers ──────────────────────────────────────────────────────────
  const toggleBulkSubject = (id) => setBulkSubjects((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleBulkClass   = (id) => setBulkClasses((p)  => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const bulkCombinations = bulkSubjects.flatMap((sId) =>
    bulkClasses.map((cId) => ({
      subjectId:   sId, classId: cId,
      subjectName: subjects.find((s) => s.subjectId === sId)?.subjectName ?? "?",
      className:   classes.find((c)  => c.classId   === cId)?.className   ?? "?",
    }))
  );

  const handleBulkCreate = async () => {
    if (!bulkSubjects.length) { alert("Select at least one subject."); return; }
    if (!bulkClasses.length)  { alert("Select at least one class.");   return; }
    if (!bulkExamType)        { alert("Select an exam type.");         return; }
    if (!bulkDate)            { alert("Select a date.");               return; }
    setBulkSaving(true);
    let created = 0, skipped = 0;
    const newExams = [];
    for (const combo of bulkCombinations) {
      try {
        const selectedClass = classes.find((c) => c.classId === combo.classId);
        const exam = await createExam({
          subjectId: combo.subjectId, classId: combo.classId,
          form: selectedClass?.formNumber, examType: bulkExamType, examDate: bulkDate,
        });
        newExams.push(exam); created++;
      } catch { skipped++; }
    }
    setExams((p) => [...p, ...newExams]);
    setBulkDone({ created, skipped });
    setBulkSaving(false);
  };

  const resetBulk = () => {
    setBulkSubjects([]); setBulkClasses([]);
    setBulkExamType(""); setBulkDate(""); setBulkDone(null); setMode(null);
  };

  // ── Single form helpers ───────────────────────────────────────────────────
  const openAdd  = () => { setFormData(EMPTY_FORM); setEditingExam(null); setMode("single"); };
  const openEdit = (exam) => {
    setFormData({
      subjectId: String(exam.subjectId),
      classId:   String(exam.classId ?? ""),
      examType:  exam.examType,
      examDate:  exam.examDate,
    });
    setEditingExam(exam); setMode("single");
  };
  const closeForm = () => { setMode(null); setEditingExam(null); setFormData(EMPTY_FORM); };

  const handleSave = async () => {
    const { subjectId, classId, examType, examDate } = formData;
    if (!subjectId || !classId || !examType || !examDate) { alert("Please fill all fields."); return; }
    setSaving(true);
    try {
      const selectedClass = classes.find((c) => c.classId === Number(classId));
      if (editingExam) {
        await deleteExam(editingExam.examId);
        const created = await createExam({ subjectId: Number(subjectId), classId: Number(classId), form: selectedClass?.formNumber, examType, examDate });
        setExams((p) => p.map((ex) => ex.examId === editingExam.examId ? created : ex));
      } else {
        const created = await createExam({ subjectId: Number(subjectId), classId: Number(classId), form: selectedClass?.formNumber, examType, examDate });
        setExams((p) => [...p, created]);
      }
      closeForm();
    } catch (err) { console.error(err); alert("Failed to save exam."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("Delete this exam? Any marks linked to it will also be affected.")) return;
    try {
      await deleteExam(examId);
      setExams((p) => p.filter((ex) => ex.examId !== examId));
    } catch (err) { console.error(err); alert("Failed to delete exam."); }
  };

  // ── Drawer helpers ────────────────────────────────────────────────────────
  const openDrawer = async (exam) => {
    setDrawerExam(exam); setDrawerLoading(true);
    try {
      const data = await fetch(
        `http://localhost:8080/marks/exam/${exam.examId}/comparison`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      ).then((r) => r.json());
      setComparisonData(data);
    } catch { setComparisonData([]); }
    finally { setDrawerLoading(false); }
  };
  const closeDrawer = () => { setDrawerExam(null); setComparisonData([]); };

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!drawerExam || comparisonData.length === 0) { alert("No data to export"); return; }
    const subjectName = subjects.find((s) => s.subjectId === drawerExam.subjectId)?.subjectName ?? "Subject";
    const clsName     = classes.find((c)  => c.classId   === drawerExam.classId)?.className     ?? "Class";
    const mean = (comparisonData.reduce((s, r) => s + r.currentMarks, 0) / comparisonData.length).toFixed(1);
    const rows = comparisonData.sort((a, b) => b.currentMarks - a.currentMarks).map((row, i) => ({
      Rank: i + 1, Student: row.studentName,
      CurrentMarks: row.currentMarks, PreviousMarks: row.previousMarks ?? "", Change: row.change ?? "",
    }));
    const wsData = [
      ["Subject", subjectName], ["Class", clsName],
      ["Exam Type", examTypeLabel(drawerExam.examType)],
      ["Year", drawerExam.periodYear], ["Term", drawerExam.periodTerm],
      ["Class Mean", mean], [],
      ["Rank", "Student", "Current Marks", "Previous Marks", "Change"],
      ...rows.map((r) => [r.Rank, r.Student, r.CurrentMarks, r.PreviousMarks, r.Change]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam Results");
    XLSX.writeFile(wb, `${subjectName}_${clsName}_${drawerExam.examType}.xlsx`);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6">
      <Sk className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        <Sk className="h-32" /><Sk className="h-32" /><Sk className="h-32" /><Sk className="h-32" />
      </div>
      <Sk className="h-16" /><Sk className="h-96" />
    </div>
  );

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Exam Management</h1>
          <p className="text-gray-500 mt-0.5">Create and manage exams before entering marks</p>
          {period && (
            <span className="inline-block mt-1.5 text-xs bg-blue-100 text-blue-700
              px-3 py-1 rounded-full font-semibold">
              Active: {period.year} · Term {period.term}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (!canCreateExams) return; setMode("bulk"); setBulkDone(null); }}
            disabled={!canCreateExams}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              border-2 border-violet-600 text-violet-600
              hover:bg-violet-50 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed">
            <Zap size={16} /> Bulk Create
          </button>
          <button
            onClick={() => { if (!canCreateExams) return; openAdd(); }}
            disabled={!canCreateExams}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm
              hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
              disabled:opacity-50 disabled:translate-y-0">
            <Plus size={16} /> Single Exam
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Exams",  value: exams.length,                                  icon: <FileText size={20} />, grad: STAT_GRADIENTS[0] },
          { label: "Subjects",     value: new Set(exams.map((e) => e.subjectId)).size,    icon: <BookOpen size={20} />, grad: STAT_GRADIENTS[1] },
          { label: "Classes",      value: new Set(exams.map((e) => e.classId)).size,      icon: <Users    size={20} />, grad: STAT_GRADIENTS[2] },
          { label: "This Month",   value: thisMonthCount,                                 icon: <Calendar size={20} />, grad: STAT_GRADIENTS[3] },
        ].map(({ label, value, icon, grad }) => (
          <div key={label}
            className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${grad}`}>
            <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -right-1 -bottom-5 w-28 h-28 rounded-full bg-white/5" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold opacity-80">{label}</p>
                <p className="text-3xl font-extrabold tracking-tight mt-1">{value}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {!period && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800
          rounded-xl px-4 py-3 text-sm">
          No active academic period. A principal must create and activate one before exams can be created.
        </div>
      )}
      {viewingClosed && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 text-gray-700
          rounded-xl px-4 py-3 text-sm">
          Viewing a closed term — exams and marks are read-only.
        </div>
      )}
      {classes.length === 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800
          rounded-xl px-4 py-3 text-sm">
          No classes found. Go to the <strong className="ml-1">Classes</strong>&nbsp;page to create classes first.
        </div>
      )}

      {/* ════ BULK CREATE ════ */}
      {mode === "bulk" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Zap size={15} className="text-violet-600" />
                </span>
                Bulk Create Exams
              </h2>
              <p className="text-sm text-gray-500 mt-1">Select classes, subjects, type and date</p>
            </div>
            <button onClick={resetBulk}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {bulkDone ? (
            <div className="text-center py-10 space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-800">Done!</h3>
              <p className="text-gray-600">
                <span className="text-emerald-600 font-bold">{bulkDone.created}</span> exams created
                {bulkDone.skipped > 0 && (
                  <span className="text-gray-400"> · {bulkDone.skipped} skipped (duplicates or errors)</span>
                )}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={resetBulk}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600
                    text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all">
                  Create More
                </button>
                <button onClick={() => setMode(null)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl
                    text-sm font-semibold hover:bg-gray-50">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Exam type */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Exam Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EXAM_TYPE_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          onClick={() => setBulkExamType(opt.value)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                            bulkExamType === opt.value
                              ? `bg-gradient-to-br ${getTypeGradient(opt.value)} border-transparent text-white shadow-sm`
                              : "border-gray-200 text-gray-600 hover:border-violet-300"
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Exam Date *
                    </label>
                    <input type="date" value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                        focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>

                {/* Classes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Classes *</label>
                    <SelectAllBar
                      onAll={() => setBulkClasses(classes.map((c) => c.classId))}
                      onClear={() => setBulkClasses([])}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((c, i) => (
                      <button key={c.classId}
                        onClick={() => toggleBulkClass(c.classId)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          bulkClasses.includes(c.classId)
                            ? "bg-gradient-to-br from-teal-500 to-emerald-600 border-transparent text-white shadow-sm"
                            : "border-gray-200 text-gray-600 hover:border-teal-300"
                        }`}>
                        {c.className}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Subjects *</label>
                  <SelectAllBar
                    onAll={() => setBulkSubjects(subjects.map((s) => s.subjectId))}
                    onClear={() => setBulkSubjects([])}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {subjects.map((sub) => (
                    <button key={sub.subjectId}
                      onClick={() => toggleBulkSubject(sub.subjectId)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2
                        transition-all text-left ${
                        bulkSubjects.includes(sub.subjectId)
                          ? "bg-gradient-to-br from-sky-500 to-blue-600 border-transparent text-white shadow-sm"
                          : "border-gray-200 text-gray-600 hover:border-sky-300"
                      }`}>
                      {sub.subjectName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {bulkCombinations.length > 0 && bulkExamType && bulkDate && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50
                  border border-violet-100 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-violet-700">
                    Preview — {bulkCombinations.length} exam{bulkCombinations.length !== 1 ? "s" : ""} will be created
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {bulkCombinations.map((c, i) => (
                      <span key={i}
                        className="px-3 py-1 bg-white border border-violet-200 rounded-full
                          text-xs text-violet-700 font-medium whitespace-nowrap">
                        {c.className} · {c.subjectName}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-violet-500">
                    Type: <strong>{examTypeLabel(bulkExamType)}</strong> · Date: <strong>{bulkDate}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                <button onClick={resetBulk}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl
                    text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleBulkCreate}
                  disabled={bulkSaving || bulkCombinations.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r
                    from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold
                    shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all
                    disabled:opacity-50 disabled:translate-y-0">
                  <Zap size={16} />
                  {bulkSaving
                    ? "Creating…"
                    : `Create ${bulkCombinations.length || ""} Exam${bulkCombinations.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════ SINGLE FORM ════ */}
      {mode === "single" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                {editingExam
                  ? <Edit size={15} className="text-rose-600" />
                  : <Plus size={15} className="text-rose-600" />}
              </span>
              {editingExam ? "Edit Exam" : "Add Single Exam"}
            </h2>
            <button onClick={closeForm}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <BookOpen size={13} className="inline mr-1" /> Subject *
              </label>
              <select value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users size={13} className="inline mr-1" /> Class *
              </label>
              <select value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText size={13} className="inline mr-1" /> Exam Type *
              </label>
              <select value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option value="">Select Type</option>
                {EXAM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={13} className="inline mr-1" /> Exam Date *
              </label>
              <input type="date" value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </div>
          </div>

          {/* Preview pill */}
          {formData.subjectId && formData.classId && formData.examType && formData.examDate && (
            <div className="mt-5 p-4 bg-gradient-to-r from-rose-50 to-pink-50
              border border-rose-100 rounded-xl flex items-center gap-4 text-sm max-w-lg">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center
                text-white font-bold text-lg shadow-sm bg-gradient-to-br
                ${getTypeGradient(formData.examType)}`}>
                {examTypeLabel(formData.examType).charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">
                  {subjects.find((s) => s.subjectId === Number(formData.subjectId))?.subjectName}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {classes.find((c) => c.classId === Number(formData.classId))?.className}
                  {" · "}{examTypeLabel(formData.examType)} · {formData.examDate}
                </p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold
                ${getTypeBadge(formData.examType)}`}>
                {examTypeLabel(formData.examType)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-50">
            <button onClick={closeForm}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl
                text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r
                from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold
                shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all
                disabled:opacity-50 disabled:translate-y-0">
              <Save size={15} />
              {saving ? "Saving…" : editingExam ? "Save Changes" : "Create Exam"}
            </button>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
          <select
            value={viewPeriodId}
            onChange={(e) => setViewPeriodId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-rose-400 min-w-[180px]">
            <option value="">Current term</option>
            {allPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.year} · Term {p.term}{p.status === "CLOSED" ? " (closed)" : ""}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search subject, class, type, date…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "subject", label: "All Subjects", items: subjects.map((s) => ({ value: s.subjectId, label: s.subjectName })) },
              { key: "class",   label: "All Classes",  items: classes.map((c)  => ({ value: c.classId,   label: c.className   })) },
              { key: "type",    label: "All Types",    items: EXAM_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label   })) },
            ].map(({ key, label, items }) => (
              <select key={key} value={filters[key]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white">
                <option value="all">{label}</option>
                {items.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            ))}
            {filtersActive && (
              <button onClick={clearFilters}
                className="px-3 py-2.5 text-xs text-gray-500 border border-gray-200
                  rounded-xl hover:bg-gray-50 transition-colors">
                <X size={14} className="inline mr-1" /> Clear
              </button>
            )}
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-100
            px-3 py-1.5 rounded-lg ml-auto whitespace-nowrap">
            {filteredExams.length} of {exams.length} exams
          </span>
        </div>
      </div>

      {/* ── Grouped Exam List ── */}
      {grouped.length > 0 ? (
        <div className="space-y-3">
          {grouped.map(({ examType, rows }) => (
            <ExamGroup
              key={examType}
              examType={examType}
              rows={rows}
              subjects={subjects}
              classes={classes}
              onEdit={openEdit}
              onDelete={handleDelete}
              onView={openDrawer}
              viewingClosed={viewingClosed}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-300" size={28} />
          </div>
          <p className="text-gray-600 font-semibold">
            {exams.length === 0 ? "No exams yet" : "No exams match your filters"}
          </p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            {exams.length === 0
              ? "Use Bulk Create for exam season or Single Exam for one-off entries"
              : "Try adjusting your search or clearing the filters"}
          </p>
          {exams.length === 0 ? (
            <button onClick={() => setMode("bulk")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r
                from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl
                shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <Zap size={16} /> Bulk Create
            </button>
          ) : (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200
                text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── Marks Comparison Drawer ── */}
      {drawerExam && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={closeDrawer} />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">

            {/* Drawer header — coloured stripe */}
            <div className={`h-1.5 bg-gradient-to-r ${getTypeGradient(drawerExam.examType)} shrink-0`} />

            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {examTypeLabel(drawerExam.examType)} —{" "}
                  {subjects.find((s) => s.subjectId === drawerExam.subjectId)?.subjectName}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {classes.find((c) => c.classId === drawerExam.classId)?.className}
                  {" · "}{drawerExam.periodYear} Term {drawerExam.periodTerm}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportToExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r
                    from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold
                    hover:shadow-md transition-all">
                  Export Excel
                </button>
                <button onClick={closeDrawer}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Summary bar */}
            {!drawerLoading && comparisonData.length > 0 && (() => {
              const mean         = (comparisonData.reduce((s, r) => s + r.currentMarks, 0) / comparisonData.length).toFixed(1);
              const top          = comparisonData.reduce((a, b) => a.currentMarks > b.currentMarks ? a : b);
              const withChange   = comparisonData.filter((r) => r.change !== null);
              const mostImproved = withChange.length ? withChange.reduce((a, b) => (a.change ?? -999) > (b.change ?? -999) ? a : b, {}) : null;
              const mostDeclined = withChange.length ? withChange.reduce((a, b) => (a.change ?? 999)  < (b.change ?? 999)  ? a : b, {}) : null;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 bg-gray-50/80
                  border-b shrink-0">
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Class Mean</p>
                    <p className="text-xl font-extrabold text-gray-800 mt-0.5">{mean}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Top Performer</p>
                    <p className="text-sm font-bold text-gray-800 truncate mt-0.5">{top.studentName}</p>
                    <p className="text-xs text-gray-400">{top.currentMarks} marks</p>
                  </div>
                  {mostImproved?.studentName && (
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-medium">Most Improved</p>
                      <p className="text-sm font-bold text-emerald-800 truncate mt-0.5">{mostImproved.studentName}</p>
                      <p className="text-xs text-emerald-500 font-semibold">+{mostImproved.change}</p>
                    </div>
                  )}
                  {mostDeclined?.studentName && (
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                      <p className="text-xs text-red-500 font-medium">Most Declined</p>
                      <p className="text-sm font-bold text-red-800 truncate mt-0.5">{mostDeclined.studentName}</p>
                      <p className="text-xs text-red-500 font-semibold">{mostDeclined.change}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Marks table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {drawerLoading ? (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  Loading marks…
                </div>
              ) : comparisonData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  No marks entered for this exam yet.
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Student", "This Term", "Last Term", "Change"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500
                          uppercase tracking-wider py-2.5 first:text-left text-center first:text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {comparisonData
                      .sort((a, b) => b.currentMarks - a.currentMarks)
                      .map((row, i) => (
                        <tr key={row.studentId} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs text-gray-400 w-5 font-mono">#{i + 1}</span>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                text-white font-bold text-xs shrink-0 bg-gradient-to-br
                                ${getTypeGradient(drawerExam.examType)}`}>
                                {row.studentName?.charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-gray-800">{row.studentName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-sm font-bold text-gray-800">{row.currentMarks}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-sm text-gray-500">{row.previousMarks ?? "—"}</span>
                          </td>
                          <td className="py-3 text-center">
                            {row.change === null ? (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">New</span>
                            ) : row.change > 0 ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                +{row.change} ↑
                              </span>
                            ) : row.change < 0 ? (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                {row.change} ↓
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Exams;