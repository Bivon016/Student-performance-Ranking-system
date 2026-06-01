// pages/Exams.jsx — classes only (no form/form-number field)

import React, { useState, useEffect } from "react";
import {
  getAllSubjects, getAllExams, createExam, deleteExam, getAllClasses,
} from "../services/api";
import { getCurrentPeriod } from '../services/api'
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

const EXAM_TYPE_COLORS = {
  FINAL_EXAM:  "bg-red-100    text-red-800",
  MIDTERM:     "bg-orange-100 text-orange-800",
  QUIZ:        "bg-yellow-100 text-yellow-800",
  ASSIGNMENT:  "bg-blue-100   text-blue-800",
  LAB_WORK:    "bg-purple-100 text-purple-800",
  PROJECT:     "bg-green-100  text-green-800",
};

const EMPTY_FORM    = { subjectId: "", classId: "", examType: "", examDate: "" };
const EMPTY_FILTERS = { subject: "all", type: "all", class: "all" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function examTypeLabel(value) {
  return EXAM_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      {icon}
    </div>
  );
}

function SelectAllBar({ onAll, onClear }) {
  return (
    <div className="flex gap-2 text-xs">
      <button onClick={onAll}   className="text-blue-600 hover:underline">All</button>
      <span className="text-gray-300">|</span>
      <button onClick={onClear} className="text-gray-400 hover:underline">Clear</button>
    </div>
  );
}

/** Collapsible group of exams sharing the same examType */
function ExamGroup({ examType, rows, subjects, classes, onEdit, onDelete, onView }) {
  const [open, setOpen] = useState(true);
  const color = EXAM_TYPE_COLORS[examType] ?? "bg-gray-100 text-gray-700";
  const label = examTypeLabel(examType);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronDown  size={16} className="text-gray-400" />
            : <ChevronRight size={16} className="text-gray-400" />}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>
          <span className="text-sm text-gray-500">{rows.length} exam{rows.length !== 1 ? "s" : ""}</span>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                {["Subject", "Class", "Date", "Term", "ID", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map((exam) => {
                const subjectName = subjects.find((s) => s.subjectId === exam.subjectId)?.subjectName ?? "—";
                const className   = classes.find((c) => c.classId === exam.classId)?.className ?? "—";
                return (
                  <tr key={exam.examId} className="hover:bg-gray-50 transition-colors">
                    {/* Subject */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {subjectName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{subjectName}</span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-gray-800">{className}</span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                        {exam.examDate}
                      </div>
                    </td>

                    {/* Term */}
                    <td className="px-5 py-3">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                        {exam.periodYear} T{exam.periodTerm}
                      </span>
                    </td>

                    {/* ID */}
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                        #{exam.examId}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(exam)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <BarChart2 size={12} /> View Marks
                        </button>
                        <button
                          onClick={() => onEdit(exam)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => onDelete(exam.examId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
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

// ─── Main component ───────────────────────────────────────────────────────────

const Exams = () => {
  const [loading,  setLoading]  = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [classes,  setClasses]  = useState([]);

  const [mode, setMode] = useState(null); // null | "single" | "bulk"

  // Single-exam form
  const [editingExam, setEditingExam] = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  // Bulk-create state
  const [bulkClasses,  setBulkClasses]  = useState([]);
  const [bulkSubjects, setBulkSubjects] = useState([]);
  const [bulkExamType, setBulkExamType] = useState("");
  const [bulkDate,     setBulkDate]     = useState("");
  const [bulkSaving,   setBulkSaving]   = useState(false);
  const [bulkDone,     setBulkDone]     = useState(null);

  // Search & filter
  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Drawer
  const [drawerExam,     setDrawerExam]     = useState(null);
  const [comparisonData, setComparisonData] = useState([]);
  const [drawerLoading,  setDrawerLoading]  = useState(false);

  // ─── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([getAllSubjects(), getAllExams(), getAllClasses()])
      .then(([subjectData, examData, classData]) => {
        setSubjects(subjectData);
        setExams(examData);
        setClasses(classData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ─── Current period ─────────────────────────────────────────────────────────

  const [period, setPeriod] = useState(null);

  useEffect(() => {
    getCurrentPeriod()
      .then(setPeriod)
      .catch(() => setPeriod(null));
  }, []);

  // ─── Filtering + grouping ───────────────────────────────────────────────────

  const filteredExams = exams.filter((ex) => {
    const subjectName = subjects.find((s) => s.subjectId === ex.subjectId)?.subjectName ?? "";
    const clsName     = classes.find((c) => c.classId === ex.classId)?.className ?? "";
    const typeLabel   = examTypeLabel(ex.examType);

    const matchSearch =
      subjectName.toLowerCase().includes(search.toLowerCase()) ||
      typeLabel.toLowerCase().includes(search.toLowerCase())   ||
      clsName.toLowerCase().includes(search.toLowerCase())     ||
      String(ex.examDate).includes(search);

    const matchSubject = filters.subject === "all" || String(ex.subjectId) === String(filters.subject);
    const matchType    = filters.type    === "all" || ex.examType           === filters.type;
    const matchClass   = filters.class   === "all" || String(ex.classId)   === String(filters.class);

    return matchSearch && matchSubject && matchType && matchClass;
  });

  // Group by examType, preserving defined order
  const grouped = EXAM_TYPE_OPTIONS
    .map(({ value }) => ({
      examType: value,
      rows: filteredExams.filter((ex) => ex.examType === value),
    }))
    .filter(({ rows }) => rows.length > 0);

  const filtersActive = search || Object.values(filters).some((v) => v !== "all");
  const clearFilters  = () => { setSearch(""); setFilters(EMPTY_FILTERS); };

  // ─── Bulk helpers ───────────────────────────────────────────────────────────

  const toggleBulkSubject = (id) => setBulkSubjects((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleBulkClass   = (id) => setBulkClasses((p)  => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const bulkCombinations = bulkSubjects.flatMap((sId) =>
    bulkClasses.map((cId) => ({
      subjectId:   sId,
      classId:     cId,
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
          subjectId: combo.subjectId,
          classId:   combo.classId,
          form:      selectedClass?.formNumber,
          examType:  bulkExamType,
          examDate:  bulkDate,
        });
        newExams.push(exam);
        created++;
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

  // ─── Single-exam helpers ────────────────────────────────────────────────────

  const openAdd  = () => { setFormData(EMPTY_FORM); setEditingExam(null); setMode("single"); };
  const openEdit = (exam) => {
    setFormData({
      subjectId: String(exam.subjectId),
      classId:   String(exam.classId ?? ""),
      examType:  exam.examType,
      examDate:  exam.examDate,
    });
    setEditingExam(exam);
    setMode("single");
  };
  const closeForm = () => { setMode(null); setEditingExam(null); setFormData(EMPTY_FORM); };

  const handleSave = async () => {
    const { subjectId, classId, examType, examDate } = formData;
    if (!subjectId || !classId || !examType || !examDate) {
      alert("Please fill all fields.");
      return;
    }
    setSaving(true);
    try {
      const selectedClass = classes.find((c) => c.classId === Number(classId));
      if (editingExam) {
        await deleteExam(editingExam.examId);
        const created = await createExam({
          subjectId: Number(subjectId),
          classId:   Number(classId),
          form:      selectedClass?.formNumber,
          examType,
          examDate,
        });
        setExams((p) => p.map((ex) => ex.examId === editingExam.examId ? created : ex));
      } else {
        const created = await createExam({
          subjectId: Number(subjectId),
          classId:   Number(classId),
          form:      selectedClass?.formNumber,
          examType,
          examDate,
        });
        setExams((p) => [...p, created]);
      }
      closeForm();
    } catch (err) {
      console.error(err); alert("Failed to save exam.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("Delete this exam? Any marks linked to it will also be affected.")) return;
    try {
      await deleteExam(examId);
      setExams((p) => p.filter((ex) => ex.examId !== examId));
    } catch (err) { console.error(err); alert("Failed to delete exam."); }
  };

              const exportToExcel = () => {
  if (!drawerExam || comparisonData.length === 0) {
    alert("No data to export");
    return;
  }

  const subjectName =
    subjects.find(s => s.subjectId === drawerExam.subjectId)?.subjectName || "Subject";

  const className =
    classes.find(c => c.classId === drawerExam.classId)?.className || "Class";

  const mean = (
    comparisonData.reduce((sum, row) => sum + row.currentMarks, 0) /
    comparisonData.length
  ).toFixed(1);

  const rows = comparisonData
    .sort((a, b) => b.currentMarks - a.currentMarks)
    .map((row, index) => ({
      Rank: index + 1,
      Student: row.studentName,
      CurrentMarks: row.currentMarks,
      PreviousMarks: row.previousMarks ?? "",
      Change: row.change ?? ""
    }));

  const worksheetData = [
    ["Subject", subjectName],
    ["Class", className],
    ["Exam Type", examTypeLabel(drawerExam.examType)],
    ["Year", drawerExam.periodYear],
    ["Term", drawerExam.periodTerm],
    ["Class Mean", mean],
    [],
    ["Rank", "Student", "Current Marks", "Previous Marks", "Change"],
    ...rows.map(r => [
      r.Rank,
      r.Student,
      r.CurrentMarks,
      r.PreviousMarks,
      r.Change
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Exam Results"
  );

  XLSX.writeFile(
    workbook,
    `${subjectName}_${className}_${drawerExam.examType}.xlsx`
  );
};
  // ─── Drawer helpers ─────────────────────────────────────────────────────────

  const openDrawer = async (exam) => {
    setDrawerExam(exam);
    setDrawerLoading(true);
    try {
      const data = await fetch(
        `http://localhost:8080/marks/exam/${exam.examId}/comparison`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      ).then(r => r.json());
      setComparisonData(data);
    } catch {
      setComparisonData([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => { setDrawerExam(null); setComparisonData([]); };

  // ─── Derived stats ──────────────────────────────────────────────────────────

  const thisMonthCount = exams.filter((e) => {
    const d = new Date(e.examDate), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500 text-lg">Loading…</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
          <p className="text-gray-600">Create and manage exams before entering marks</p>
          {period && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              {period.periodYear} · Term {period.periodTerm}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setMode("bulk"); setBulkDone(null); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Zap size={18} /> Bulk Create
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> Single Exam
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Exams" value={exams.length}                                icon={<FileText className="h-8 w-8 text-blue-500"   />} />
        <StatCard label="Subjects"    value={new Set(exams.map((e) => e.subjectId)).size} icon={<BookOpen className="h-8 w-8 text-green-500"  />} />
        <StatCard label="Classes"     value={new Set(exams.map((e) => e.classId)).size}   icon={<Users    className="h-8 w-8 text-purple-500" />} />
        <StatCard label="This Month"  value={thisMonthCount}                              icon={<Calendar className="h-8 w-8 text-orange-500" />} />
      </div>

      {!period && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ No active academic period. A principal must create and activate one before exams can be created.
        </div>
      )}

      {classes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ No classes found. Go to the <strong>Classes</strong> page to create classes first.
        </div>
      )}

      {/* ════ BULK CREATE ════ */}
      {mode === "bulk" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Zap size={20} className="text-purple-600" /> Bulk Create Exams
              </h2>
              <p className="text-sm text-gray-500 mt-1">Select classes, subjects, exam type and date</p>
            </div>
            <button onClick={resetBulk} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
          </div>

          {bulkDone ? (
            /* ── Success state ── */
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-800">Done!</h3>
              <p className="text-gray-600">
                <span className="text-green-600 font-bold">{bulkDone.created}</span> exams created
                {bulkDone.skipped > 0 && (
                  <span className="text-gray-400"> · {bulkDone.skipped} skipped (duplicates or errors)</span>
                )}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={resetBulk}           className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create More</button>
                <button onClick={() => setMode(null)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Done</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Exam type + date */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <FileText size={14} /> Exam Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EXAM_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setBulkExamType(opt.value)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all text-left ${
                            bulkExamType === opt.value
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 text-gray-600 hover:border-purple-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar size={14} /> Exam Date *
                    </label>
                    <input
                      type="date"
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Classes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Users size={14} /> Classes *
                      <span className="text-gray-400 font-normal text-xs ml-1">(pick your assigned classes)</span>
                    </label>
                    <SelectAllBar
                      onAll={() => setBulkClasses(classes.map((c) => c.classId))}
                      onClear={() => setBulkClasses([])}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((c) => (
                      <button
                        key={c.classId}
                        onClick={() => toggleBulkClass(c.classId)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          bulkClasses.includes(c.classId)
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-200 text-gray-600 hover:border-green-300"
                        }`}
                      >
                        {c.className}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <BookOpen size={14} /> Subjects *
                    <span className="text-gray-400 font-normal text-xs ml-1">(pick the ones you teach)</span>
                  </label>
                  <SelectAllBar
                    onAll={() => setBulkSubjects(subjects.map((s) => s.subjectId))}
                    onClear={() => setBulkSubjects([])}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {subjects.map((sub) => (
                    <button
                      key={sub.subjectId}
                      onClick={() => toggleBulkSubject(sub.subjectId)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                        bulkSubjects.includes(sub.subjectId)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {sub.subjectName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {bulkCombinations.length > 0 && bulkExamType && bulkDate && (
                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-purple-700">
                    Preview — {bulkCombinations.length} exam{bulkCombinations.length !== 1 ? "s" : ""} will be created:
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {bulkCombinations.map((c, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white border border-purple-200 rounded-full text-xs text-purple-700 font-medium whitespace-nowrap"
                      >
                        {c.className} · {c.subjectName}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-purple-500">
                    Type: <strong>{examTypeLabel(bulkExamType)}</strong> · Date: <strong>{bulkDate}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button onClick={resetBulk} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={bulkSaving || bulkCombinations.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
                >
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingExam ? "Edit Exam" : "Add Single Exam"}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-700"><X size={22} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <BookOpen size={13} className="inline mr-1" /> Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users size={13} className="inline mr-1" /> Class *
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText size={13} className="inline mr-1" /> Exam Type *
              </label>
              <select
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                {EXAM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar size={13} className="inline mr-1" /> Exam Date *
              </label>
              <input
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={closeForm} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Save size={16} />
              {saving ? "Saving…" : editingExam ? "Save Changes" : "Create Exam"}
            </button>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search subject, class, type, date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Subject */}
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>
              ))}
            </select>

            {/* Class */}
            <select
              value={filters.class}
              onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>

            {/* Type */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {EXAM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Clear */}
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
            {filteredExams.length} of {exams.length} exams
          </span>
        </div>
      </div>

      {/* ── Grouped exam list ── */}
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
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border text-center py-14">
          <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {exams.length === 0 ? "No exams yet" : "No exams match your filters"}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {exams.length === 0
              ? "Use Bulk Create for exam season or Single Exam for one-off entries"
              : "Try adjusting your search or clearing the filters"}
          </p>
          {exams.length === 0 ? (
            <button
              onClick={() => setMode("bulk")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
            >
              <Zap size={16} /> Bulk Create
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── Marks Comparison Drawer ── */}
      {drawerExam && (
        <div className="fixed inset-0 z-50 flex justify-end">

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-30"
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <div className="relative w-full max-w-2xl bg-white shadow-xl flex flex-col h-full overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {examTypeLabel(drawerExam.examType)} — {
                    subjects.find(s => s.subjectId === drawerExam.subjectId)?.subjectName
                  }
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {classes.find(c => c.classId === drawerExam.classId)?.className}
                  {" · "}{drawerExam.periodYear} Term {drawerExam.periodTerm}
                </p>
              </div>
            <div className="flex items-center gap-2">
  <button
    onClick={exportToExcel}
    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
  >
    Export Excel
  </button>

  <button
    onClick={closeDrawer}
    className="text-gray-400 hover:text-gray-700"
  >
    <X size={22} />
  </button>
</div>
</div>
  

            {/* Summary bar */}
            {!drawerLoading && comparisonData.length > 0 && (() => {
              const mean = (comparisonData.reduce((s, r) => s + r.currentMarks, 0) / comparisonData.length).toFixed(1);
              const top  = comparisonData.reduce((a, b) => a.currentMarks > b.currentMarks ? a : b);
              const mostImproved = comparisonData.filter(r => r.change !== null).reduce((a, b) => (a.change ?? -999) > (b.change ?? -999) ? a : b, {});
              const mostDeclined = comparisonData.filter(r => r.change !== null).reduce((a, b) => (a.change ?? 999)  < (b.change ?? 999)  ? a : b, {});
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 bg-gray-50 border-b">
                  <div>
                    <p className="text-xs text-gray-500">Class mean</p>
                    <p className="text-xl font-bold text-gray-800">{mean}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Top performer</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{top.studentName}</p>
                    <p className="text-xs text-gray-400">{top.currentMarks} marks</p>
                  </div>
                  {mostImproved.studentName && (
                    <div>
                      <p className="text-xs text-gray-500">Most improved</p>
                      <p className="text-sm font-semibold text-green-700 truncate">{mostImproved.studentName}</p>
                      <p className="text-xs text-green-500">+{mostImproved.change}</p>
                    </div>
                  )}
                  {mostDeclined.studentName && (
                    <div>
                      <p className="text-xs text-gray-500">Most declined</p>
                      <p className="text-sm font-semibold text-red-700 truncate">{mostDeclined.studentName}</p>
                      <p className="text-xs text-red-500">{mostDeclined.change}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {drawerLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-400">Loading marks…</p>
                </div>
              ) : comparisonData.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-gray-400">No marks entered for this exam yet.</p>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Student</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase py-2">This term</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase py-2">Last term</th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase py-2">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comparisonData
                      .sort((a, b) => b.currentMarks - a.currentMarks)
                      .map((row, i) => (
                        <tr key={row.studentId} className="hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-5">#{i + 1}</span>
                              <span className="text-sm font-medium text-gray-800">{row.studentName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-sm font-bold text-gray-800">{row.currentMarks}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-sm text-gray-500">
                              {row.previousMarks ?? '—'}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            {row.change === null ? (
                              <span className="text-xs text-gray-400">New</span>
                            ) : row.change > 0 ? (
                              <span className="text-xs font-semibold text-green-600">+{row.change} ↑</span>
                            ) : row.change < 0 ? (
                              <span className="text-xs font-semibold text-red-600">{row.change} ↓</span>
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