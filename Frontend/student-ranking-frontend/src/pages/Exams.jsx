import React, { useState, useEffect } from "react";
import { getAllSubjects, getAllExams, createExam, deleteExam, getAllClasses } from "../services/api";
import {
  Plus, Trash2, Edit, X, Save,
  Calendar, BookOpen, Users, FileText,
  Search, CheckCircle, Zap,
} from "lucide-react";

const EXAM_TYPE_OPTIONS = [
  { value: "FINAL_EXAM",  label: "Final Exam"  },
  { value: "MIDTERM",     label: "Midterm"     },
  { value: "QUIZ",        label: "Quiz"        },
  { value: "ASSIGNMENT",  label: "Assignment"  },
  { value: "LAB_WORK",    label: "Lab Work"    },
  { value: "PROJECT",     label: "Project"     },
];

const EXAM_TYPE_COLORS = {
  FINAL_EXAM:  "bg-red-100 text-red-800",
  MIDTERM:     "bg-orange-100 text-orange-800",
  QUIZ:        "bg-yellow-100 text-yellow-800",
  ASSIGNMENT:  "bg-blue-100 text-blue-800",
  LAB_WORK:    "bg-purple-100 text-purple-800",
  PROJECT:     "bg-green-100 text-green-800",
};

const emptyForm = { subjectId: "", form: "", classId: "", examType: "", examDate: "" };

const Exams = () => {
  const [loading,  setLoading]  = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [classes,  setClasses]  = useState([]);

  const [mode, setMode] = useState(null);

  const [editingExam, setEditingExam] = useState(null);
  const [formData,    setFormData]    = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);

  const [bulkForms,    setBulkForms]    = useState([]);
  const [bulkClasses,  setBulkClasses]  = useState([]);  // ✅ added
  const [bulkSubjects, setBulkSubjects] = useState([]);
  const [bulkExamType, setBulkExamType] = useState("");
  const [bulkDate,     setBulkDate]     = useState("");
  const [bulkSaving,   setBulkSaving]   = useState(false);
  const [bulkDone,     setBulkDone]     = useState(null);

  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState({ subject: "all", form: "all", type: "all" });

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

  const availableForms = [...new Set(classes.map((c) => c.formNumber))].sort((a, b) => a - b);

  const filteredExams = exams.filter((ex) => {
    const subjectName = subjects.find((s) => s.subjectId === ex.subjectId)?.subjectName ?? "";
    const matchSearch =
      subjectName.toLowerCase().includes(search.toLowerCase()) ||
      EXAM_TYPE_OPTIONS.find((o) => o.value === ex.examType)?.label.toLowerCase().includes(search.toLowerCase()) ||
      String(ex.examDate).includes(search);
    const matchSubject = filters.subject === "all" || String(ex.subjectId) === filters.subject;
    const matchForm    = filters.form    === "all" || String(ex.form)      === filters.form;
    const matchType    = filters.type    === "all" || ex.examType          === filters.type;
    return matchSearch && matchSubject && matchForm && matchType;
  });

  const toggleBulkForm    = (f)  => setBulkForms((p)    => p.includes(f)  ? p.filter((x) => x !== f)  : [...p, f]);
  const toggleBulkSubject = (id) => setBulkSubjects((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleBulkClass   = (id) => setBulkClasses((p)  => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ✅ Each combo now includes classId
  const bulkCombinations = bulkForms.flatMap((f) =>
    bulkSubjects.flatMap((sId) =>
      bulkClasses.map((cId) => ({
        form: f,
        subjectId: sId,
        classId: cId,
        subjectName: subjects.find((s) => s.subjectId === sId)?.subjectName ?? "?",
        className: classes.find((c) => c.classId === cId)?.className ?? "?",
      }))
    )
  );

  const handleBulkCreate = async () => {
    if (!bulkForms.length)    { alert("Select at least one form.");    return; }
    if (!bulkSubjects.length) { alert("Select at least one subject."); return; }
    if (!bulkClasses.length)  { alert("Select at least one class.");   return; }  // ✅
    if (!bulkExamType)        { alert("Select an exam type.");         return; }
    if (!bulkDate)            { alert("Select a date.");               return; }
    setBulkSaving(true);
    let created = 0, skipped = 0;
    const newExams = [];
    for (const combo of bulkCombinations) {
      try {
        const exam = await createExam({
          subjectId: combo.subjectId,
          classId:   combo.classId,   // ✅ added
          form:      combo.form,
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
    setBulkForms([]); setBulkSubjects([]); setBulkClasses([]);
    setBulkExamType(""); setBulkDate("");
    setBulkDone(null); setMode(null);
  };

  const openAdd  = () => { setFormData(emptyForm); setEditingExam(null); setMode("single"); };
  const openEdit = (exam) => {
    setFormData({
      subjectId: String(exam.subjectId),
      form:      String(exam.form),
      classId:   String(exam.classId ?? ""),
      examType:  exam.examType,
      examDate:  exam.examDate,
    });
    setEditingExam(exam); setMode("single");
  };
  const closeForm = () => { setMode(null); setEditingExam(null); setFormData(emptyForm); };

  const handleSave = async () => {
    const { subjectId, form, classId, examType, examDate } = formData;
    if (!subjectId || !form || !classId || !examType || !examDate) {
      alert("Please fill all fields.");
      return;
    }
    setSaving(true);
    try {
      if (editingExam) {
        await deleteExam(editingExam.examId);
        const created = await createExam({
          subjectId: Number(subjectId),
          classId:   Number(classId),   // ✅ added
          form:      Number(form),
          examType,
          examDate,
        });
        setExams((p) => p.map((ex) => ex.examId === editingExam.examId ? created : ex));
      } else {
        const created = await createExam({
          subjectId: Number(subjectId),
          classId:   Number(classId),   // ✅ added
          form:      Number(form),
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

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500 text-lg">Loading…</p></div>;

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
          <p className="text-gray-600">Create and manage exams before entering marks</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode("bulk"); setBulkDone(null); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700">
            <Zap size={18} /><span>Bulk Create</span>
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700">
            <Plus size={18} /><span>Single Exam</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Total Exams</p><p className="text-2xl font-bold mt-1">{exams.length}</p></div>
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Subjects</p><p className="text-2xl font-bold mt-1">{new Set(exams.map((e) => e.subjectId)).size}</p></div>
          <BookOpen className="h-8 w-8 text-green-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Forms Covered</p><p className="text-2xl font-bold mt-1">{new Set(exams.map((e) => e.form)).size}</p></div>
          <Users className="h-8 w-8 text-purple-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold mt-1">
              {exams.filter((e) => { const d = new Date(e.examDate); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      {availableForms.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ No classes found. Go to the <strong>Classes</strong> page to create forms first.
        </div>
      )}

      {/* ════ BULK CREATE ════ */}
      {mode === "bulk" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Zap size={20} className="text-purple-600" />Bulk Create Exams
              </h2>
              <p className="text-sm text-gray-500 mt-1">Select forms, classes, subjects, exam type and date</p>
            </div>
            <button onClick={resetBulk} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
          </div>

          {bulkDone ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-800">Done!</h3>
              <p className="text-gray-600">
                <span className="text-green-600 font-bold">{bulkDone.created}</span> exams created
                {bulkDone.skipped > 0 && <span className="text-gray-400"> · {bulkDone.skipped} skipped</span>}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={resetBulk} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create More</button>
                <button onClick={() => setMode(null)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Done</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Forms */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Users size={14} />Forms *</label>
                    <div className="flex gap-2">
                      <button onClick={() => setBulkForms([...availableForms])} className="text-xs text-blue-600 hover:underline">Select All</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setBulkForms([])} className="text-xs text-gray-400 hover:underline">Clear</button>
                    </div>
                  </div>
                  {availableForms.length === 0 ? (
                    <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">No forms yet — create classes first</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableForms.map((f) => (
                        <button key={f} onClick={() => toggleBulkForm(f)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            bulkForms.includes(f)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-200 text-gray-600 hover:border-blue-300"
                          }`}>
                          Form {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exam type + date */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><FileText size={14} />Exam Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EXAM_TYPE_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setBulkExamType(opt.value)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all text-left ${
                            bulkExamType === opt.value
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 text-gray-600 hover:border-purple-300"
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Calendar size={14} />Exam Date *</label>
                    <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>

              {/* Classes ✅ NEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Users size={14} />Classes * <span className="text-gray-400 font-normal">(pick your assigned classes)</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setBulkClasses(classes.map((c) => c.classId))} className="text-xs text-blue-600 hover:underline">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setBulkClasses([])} className="text-xs text-gray-400 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button key={c.classId} onClick={() => toggleBulkClass(c.classId)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        bulkClasses.includes(c.classId)
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-green-300"
                      }`}>
                      {c.className}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <BookOpen size={14} />Subjects * <span className="text-gray-400 font-normal">(pick the ones you teach)</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setBulkSubjects(subjects.map((s) => s.subjectId))} className="text-xs text-blue-600 hover:underline">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setBulkSubjects([])} className="text-xs text-gray-400 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {subjects.map((sub) => (
                    <button key={sub.subjectId} onClick={() => toggleBulkSubject(sub.subjectId)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all text-left ${
                        bulkSubjects.includes(sub.subjectId)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}>
                      {sub.subjectName}
                    </button>
                  ))}
                </div>
              </div>

              {bulkCombinations.length > 0 && bulkExamType && bulkDate && (
                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-purple-700">
                    Preview — {bulkCombinations.length} exam{bulkCombinations.length > 1 ? "s" : ""} will be created:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bulkCombinations.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-purple-200 rounded-full text-xs text-purple-700 font-medium">
                        Form {c.form} — {c.subjectName} — {c.className}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-purple-500">
                    Type: <strong>{EXAM_TYPE_OPTIONS.find((o) => o.value === bulkExamType)?.label}</strong> · Date: <strong>{bulkDate}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={resetBulk} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleBulkCreate} disabled={bulkSaving || bulkCombinations.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60">
                  <Zap size={16} />
                  <span>{bulkSaving ? "Creating…" : `Create ${bulkCombinations.length || ""} Exam${bulkCombinations.length !== 1 ? "s" : ""}`}</span>
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
            <h2 className="text-xl font-bold text-gray-800">{editingExam ? "Edit Exam" : "Add Single Exam"}</h2>
            <button onClick={closeForm} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><BookOpen size={14} className="inline mr-1" />Subject *</label>
              <select value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Subject</option>
                {subjects.map((sub) => <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>)}
              </select>
            </div>
            {/* ✅ Class dropdown added */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><Users size={14} className="inline mr-1" />Class *</label>
              <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><Users size={14} className="inline mr-1" />Form *</label>
              {availableForms.length === 0 ? (
                <p className="text-sm text-amber-600 mt-2">No forms — create classes first</p>
              ) : (
                <select value={formData.form} onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Form</option>
                  {availableForms.map((f) => <option key={f} value={f}>Form {f}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><FileText size={14} className="inline mr-1" />Exam Type *</label>
              <select value={formData.examType} onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Type</option>
                {EXAM_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar size={14} className="inline mr-1" />Exam Date *</label>
              <input type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={closeForm} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <Save size={18} /><span>{saving ? "Saving…" : editingExam ? "Save Changes" : "Create Exam"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by subject, type or date…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Subjects</option>
              {subjects.map((sub) => <option key={sub.subjectId} value={sub.subjectId}>{sub.subjectName}</option>)}
            </select>
            <select value={filters.form} onChange={(e) => setFilters({ ...filters, form: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Forms</option>
              {availableForms.map((f) => <option key={f} value={f}>Form {f}</option>)}
            </select>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Types</option>
              {EXAM_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExams.map((exam) => {
                const subjectName = subjects.find((s) => s.subjectId === exam.subjectId)?.subjectName ?? "—";
                const typeLabel   = EXAM_TYPE_OPTIONS.find((o) => o.value === exam.examType)?.label ?? exam.examType;
                const typeColor   = EXAM_TYPE_COLORS[exam.examType] ?? "bg-gray-100 text-gray-700";
                return (
                  <tr key={exam.examId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {subjectName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{subjectName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">Form {exam.form}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor}`}>{typeLabel}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Calendar size={14} className="text-gray-400" />{exam.examDate}
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">#{exam.examId}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(exam)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                          <Edit size={13} /><span>Edit</span>
                        </button>
                        <button onClick={() => handleDelete(exam.examId)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                          <Trash2 size={13} /><span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredExams.length === 0 && (
          <div className="text-center py-14">
            <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No exams found</p>
            <p className="text-gray-400 text-sm mb-4">Use Bulk Create for exam season or Single Exam for one-off entries</p>
            <button onClick={() => setMode("bulk")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
              <Zap size={16} /><span>Bulk Create</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;