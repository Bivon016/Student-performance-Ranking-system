import React, { useState, useEffect } from "react";
import { getAllClasses, createClass, updateClass, deleteClass } from "../services/api";
import {
  Plus, Trash2, Edit, X, Save,
  Search, GraduationCap, Calendar,
  CheckCircle, Zap, BookOpen, Filter,
} from "lucide-react";

const STREAM_SUGGESTIONS = ["North", "South", "East", "West", "A", "B", "C", "D", "Red", "Blue", "Green"];

const GRADE_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-700",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-pink-500 to-fuchsia-600",
  "from-cyan-500 to-sky-600",
];

const GRADE_BADGES = [
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-cyan-100 text-cyan-800",
];

// Grades 7–12 → index 0–5
const getGradeGradient = (g) => GRADE_GRADIENTS[(g - 7) % GRADE_GRADIENTS.length];
const getGradeBadge    = (g) => GRADE_BADGES[(g - 7) % GRADE_BADGES.length];

const buildClassName = (gradeNumber, stream, year) => `Grade ${gradeNumber} ${stream} - ${year}`;
const emptyForm = { formNumber: "", stream: "", year: new Date().getFullYear() };

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />
);

const Classes = () => {
  const [loading,  setLoading]  = useState(true);
  const [classes,  setClasses]  = useState([]);
  const [error,    setError]    = useState(null);

  const [mode,      setMode]      = useState(null); // "single" | "bulk" | null
  const [editingId, setEditingId] = useState(null);
  const [formData,  setFormData]  = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);

  const [bulkForms,    setBulkForms]    = useState([]);
  const [bulkStreams,  setBulkStreams]  = useState([]);
  const [bulkYear,     setBulkYear]    = useState(new Date().getFullYear());
  const [customStream, setCustomStream] = useState("");
  const [bulkSaving,   setBulkSaving]  = useState(false);
  const [bulkDone,     setBulkDone]    = useState(null);

  const [search,     setSearch]     = useState("");
  const [filterForm, setFilterForm] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  useEffect(() => {
    getAllClasses()
      .then(setClasses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const availableGrades = [...new Set(classes.map((c) => c.formNumber))].sort((a, b) => a - b);
  const availableYears  = [...new Set(classes.map((c) => c.year))].sort((a, b) => b - a);

  const filtered = classes.filter((c) => {
    const matchSearch = c.className.toLowerCase().includes(search.toLowerCase());
    const matchGrade  = filterForm === "all" || String(c.formNumber) === filterForm;
    const matchYear   = filterYear === "all" || String(c.year) === filterYear;
    return matchSearch && matchGrade && matchYear;
  });

  const byGrade = filtered.reduce((acc, cls) => {
    const key = cls.formNumber;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cls);
    return acc;
  }, {});

  // ── Bulk helpers ──────────────────────────────────────────────────────────
  const bulkCombinations = bulkForms.flatMap((f) =>
    bulkStreams.map((s) => ({
      formNumber: f,
      stream: s,
      year: bulkYear,
      className: buildClassName(f, s, bulkYear),
    }))
  );

  const toggleBulkForm   = (f) => setBulkForms((p)  => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);
  const toggleBulkStream = (s) => setBulkStreams((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const addCustomStream = () => {
    const s = customStream.trim();
    if (!s) return;
    if (!bulkStreams.includes(s)) setBulkStreams((p) => [...p, s]);
    setCustomStream("");
  };

  // ── Single form handlers ──────────────────────────────────────────────────
  const openAdd  = () => { setFormData(emptyForm); setEditingId(null); setMode("single"); setError(null); };
  const openEdit = (cls) => {
    setFormData({ formNumber: String(cls.formNumber), stream: cls.stream, year: cls.year });
    setEditingId(cls.classId);
    setMode("single");
    setError(null);
  };
  const closeForm = () => { setMode(null); setEditingId(null); setFormData(emptyForm); };

  const handleSave = async () => {
    const { formNumber, stream, year } = formData;
    if (!formNumber || !stream.trim() || !year) { setError("Please fill all fields."); return; }
    setError(null);
    setSaving(true);
    const payload = {
      formNumber: Number(formNumber),
      stream: stream.trim(),
      year: Number(year),
      className: buildClassName(formNumber, stream.trim(), year),
    };
    try {
      if (editingId) {
        const updated = await updateClass(editingId, payload);
        setClasses((p) => p.map((c) => c.classId === editingId ? updated : c));
      } else {
        const created = await createClass(payload);
        setClasses((p) => [...p, created]);
      }
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (classId, name) => {
    if (!window.confirm(`Delete "${name}"? Students assigned to this class may be affected.`)) return;
    try {
      await deleteClass(classId);
      setClasses((p) => p.filter((c) => c.classId !== classId));
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Bulk create ───────────────────────────────────────────────────────────
  const handleBulkCreate = async () => {
    if (!bulkForms.length)  { setError("Select at least one grade.");  return; }
    if (!bulkStreams.length) { setError("Select at least one stream."); return; }
    setError(null);
    setBulkSaving(true);
    let created = 0, skipped = 0;
    const newClasses = [];
    for (const combo of bulkCombinations) {
      try {
        const cls = await createClass(combo);
        newClasses.push(cls);
        created++;
      } catch {
        skipped++;
      }
    }
    setClasses((p) => [...p, ...newClasses]);
    setBulkDone({ created, skipped });
    setBulkSaving(false);
  };

  const resetBulk = () => {
    setBulkForms([]);
    setBulkStreams([]);
    setBulkYear(new Date().getFullYear());
    setBulkDone(null);
    setMode(null);
    setError(null);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6">
      <Sk className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <Sk className="h-32" /><Sk className="h-32" /><Sk className="h-32" />
      </div>
      <Sk className="h-16" />
      <Sk className="h-96" />
    </div>
  );

  return (
    <div className="space-y-7">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Classes</h1>
          <p className="text-gray-500 mt-0.5">Manage school classes by grade, stream and year</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setMode("bulk"); setBulkDone(null); setError(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm
              hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Zap size={16} /> Bulk Create
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm
              hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Plus size={16} /> Add Class
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Classes", value: classes.length,
            icon: <GraduationCap size={20} className="text-white" />,
            gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
          },
          {
            label: "Grades", value: availableGrades.length,
            icon: <BookOpen size={20} className="text-white" />,
            gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
          },
          {
            label: "Academic Years", value: availableYears.length,
            icon: <Calendar size={20} className="text-white" />,
            gradient: "bg-gradient-to-br from-orange-400 to-rose-500",
          },
        ].map(({ label, value, icon, gradient }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradient}`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold opacity-80">{label}</p>
                <p className="text-4xl font-extrabold tracking-tight mt-1">{value}</p>
              </div>
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700
          rounded-xl px-4 py-3 text-sm">
          <X size={15} className="shrink-0" /> {error}
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* ══ BULK CREATE PANEL ══ */}
      {mode === "bulk" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-violet-600" />
                </span>
                Bulk Create Classes
              </h2>
              <p className="text-sm text-gray-400 mt-1">Every grade × stream combination gets its own class</p>
            </div>
            <button onClick={resetBulk} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          {bulkDone ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-emerald-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Done!</h3>
              <p className="text-gray-500">
                <span className="text-emerald-600 font-bold">{bulkDone.created}</span> classes created
                {bulkDone.skipped > 0 && (
                  <span className="text-gray-400"> · {bulkDone.skipped} skipped (already exist)</span>
                )}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={resetBulk}
                  className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700">
                  Create More
                </button>
                <button onClick={() => setMode(null)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Grades 7–12 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Grades *</label>
                    <div className="flex gap-3">
                      <button onClick={() => setBulkForms([7,8,9,10,11,12])}
                        className="text-xs text-blue-600 hover:underline font-medium">Select all</button>
                      <button onClick={() => setBulkForms([])}
                        className="text-xs text-gray-400 hover:underline">Clear</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[7,8,9,10,11,12].map((g) => (
                      <button key={g} onClick={() => toggleBulkForm(g)}
                        className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                          bulkForms.includes(g)
                            ? `bg-gradient-to-br ${getGradeGradient(g)} border-transparent text-white shadow-sm`
                            : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                        }`}>
                        G{g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Streams */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Streams *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STREAM_SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => toggleBulkStream(s)}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          bulkStreams.includes(s)
                            ? "bg-gradient-to-br from-violet-500 to-purple-600 border-transparent text-white shadow-sm"
                            : "border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Custom stream…"
                      value={customStream}
                      onChange={(e) => setCustomStream(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomStream()}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    <button onClick={addCustomStream}
                      className="px-3 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700">
                      <Plus size={16} />
                    </button>
                  </div>
                  {/* Custom streams tags */}
                  {bulkStreams.filter(s => !STREAM_SUGGESTIONS.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {bulkStreams.filter(s => !STREAM_SUGGESTIONS.includes(s)).map(s => (
                        <span key={s}
                          className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold">
                          {s}
                          <button onClick={() => toggleBulkStream(s)}><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Year *</label>
                  <input type="number" min="2000" max="2100"
                    value={bulkYear}
                    onChange={(e) => setBulkYear(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <div className="flex gap-2">
                    {[new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1].map((y) => (
                      <button key={y} onClick={() => setBulkYear(y)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          bulkYear === y
                            ? "bg-gradient-to-br from-violet-500 to-purple-600 border-transparent text-white"
                            : "border-gray-200 text-gray-500 hover:border-violet-300"
                        }`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {bulkCombinations.length > 0 && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-violet-700">
                    Preview — {bulkCombinations.length} class{bulkCombinations.length !== 1 ? "es" : ""} will be created
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bulkCombinations.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-violet-200
                        rounded-full text-xs text-violet-700 font-medium shadow-sm">
                        {c.className}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={resetBulk}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={bulkSaving || bulkCombinations.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500
                    to-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
                  <Zap size={15} />
                  {bulkSaving ? "Creating…" : `Create ${bulkCombinations.length || ""} Classes`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ SINGLE ADD / EDIT PANEL ══ */}
      {mode === "single" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {editingId
                  ? <Edit size={15} className="text-blue-600" />
                  : <Plus size={15} className="text-blue-600" />}
              </span>
              {editingId ? "Edit Class" : "Add Class"}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Grade Number *</label>
              <input type="number" min="7" max="12" placeholder="e.g. 7"
                value={formData.formNumber}
                onChange={(e) => setFormData({ ...formData, formNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {/* Quick grade picker */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[7,8,9,10,11,12].map((g) => (
                  <button key={g} onClick={() => setFormData({ ...formData, formNumber: String(g) })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      formData.formNumber === String(g)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                    }`}>
                    G{g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stream *</label>
              <input type="text" placeholder="e.g. North"
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STREAM_SUGGESTIONS.slice(0, 6).map((s) => (
                  <button key={s} onClick={() => setFormData({ ...formData, stream: s })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      formData.stream === s
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
              <input type="number" min="2000" max="2100"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {formData.formNumber && formData.stream && formData.year && (
            <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-sm">
              <span className="text-blue-500 font-medium">Preview:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeBadge(Number(formData.formNumber))}`}>
                Grade {formData.formNumber}
              </span>
              <span className="font-bold text-gray-800">
                {buildClassName(formData.formNumber, formData.stream.trim(), formData.year)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeForm}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500
                to-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
              <Save size={15} />
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Class"}
            </button>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search classes…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <select value={filterForm} onChange={(e) => setFilterForm(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="all">All Grades</option>
              {availableGrades.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="all">All Years</option>
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
              {filtered.length} of {classes.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Classes Grid (grouped by grade) ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-gray-300" size={28} />
          </div>
          <p className="text-gray-600 font-semibold">No classes found</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Create classes — students and exams are linked to them
          </p>
          <button
            onClick={() => { setMode("bulk"); setBulkDone(null); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500
              to-purple-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md
              hover:-translate-y-0.5 transition-all">
            <Zap size={15} /> Bulk Create
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(byGrade).sort((a, b) => a - b).map((grade) => (
            <div key={grade}>
              {/* Grade header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradeGradient(Number(grade))}
                  flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  G{grade}
                </div>
                <h3 className="font-bold text-gray-800">Grade {grade}</h3>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {byGrade[grade].length} class{byGrade[grade].length !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Class cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {byGrade[grade].map((cls) => (
                  <div key={cls.classId}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    {/* Accent bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${getGradeGradient(cls.formNumber)}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradeGradient(cls.formNumber)}
                          flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {cls.formNumber}
                        </div>
                        <span className="text-xs font-mono bg-gray-100 text-gray-400 px-2 py-1 rounded-lg">
                          #{cls.classId}
                        </span>
                      </div>

                      <p className="font-bold text-gray-800 text-sm leading-tight">{cls.className}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getGradeBadge(cls.formNumber)}`}>
                          {cls.stream}
                        </span>
                        <span className="text-xs text-gray-400">{cls.year}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                        <button onClick={() => openEdit(cls)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                            bg-blue-50 text-blue-600 text-xs font-semibold
                            hover:bg-blue-600 hover:text-white transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button onClick={() => handleDelete(cls.classId, cls.className)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                            bg-red-50 text-red-500 text-xs font-semibold
                            hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Classes;