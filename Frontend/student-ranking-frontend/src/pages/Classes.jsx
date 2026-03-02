import React, { useState, useEffect } from "react";
import { getAllClasses, createClass, updateClass, deleteClass } from "../services/api";
import {
  Plus, Trash2, Edit, X, Save,
  Search, GraduationCap, Calendar,
  CheckCircle, Zap, BookOpen,
} from "lucide-react";

const STREAM_SUGGESTIONS = ["North", "South", "East", "West", "A", "B", "C", "D", "Red", "Blue", "Green"];

const FORM_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];

const getFormColor = (formNumber) => FORM_COLORS[(formNumber - 1) % FORM_COLORS.length];

// ── Helper to build className string ─────────────────────────────────────────
const buildClassName = (formNumber, stream, year) =>
  `Form ${formNumber} ${stream} - ${year}`;

const emptyForm = { formNumber: "", stream: "", year: new Date().getFullYear() };

const Classes = () => {
  const [loading,  setLoading]  = useState(true);
  const [classes,  setClasses]  = useState([]);
  const [error,    setError]    = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────────
  const [mode,       setMode]       = useState(null); // null | "single" | "bulk"
  const [editingId,  setEditingId]  = useState(null);
  const [formData,   setFormData]   = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);

  // ── Bulk state ────────────────────────────────────────────────────────────────
  const [bulkForms,    setBulkForms]    = useState([]);
  const [bulkStreams,  setBulkStreams]  = useState([]);
  const [bulkYear,     setBulkYear]    = useState(new Date().getFullYear());
  const [customStream, setCustomStream] = useState("");
  const [bulkSaving,   setBulkSaving]  = useState(false);
  const [bulkDone,     setBulkDone]    = useState(null);

  // ── Filters ───────────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [filterForm, setFilterForm] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  // ── Bootstrap ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    getAllClasses()
      .then(setClasses).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const availableForms = [...new Set(classes.map((c) => c.formNumber))].sort((a, b) => a - b);
  const availableYears = [...new Set(classes.map((c) => c.year))].sort((a, b) => b - a);

  const filtered = classes.filter((c) => {
    const matchSearch = c.className.toLowerCase().includes(search.toLowerCase());
    const matchForm   = filterForm === "all" || String(c.formNumber) === filterForm;
    const matchYear   = filterYear === "all" || String(c.year)       === filterYear;
    return matchSearch && matchForm && matchYear;
  });

  // Bulk: all form × stream combinations
  const bulkCombinations = bulkForms.flatMap((f) =>
    bulkStreams.map((s) => ({
      formNumber: f,
      stream: s,
      year: bulkYear,
      className: buildClassName(f, s, bulkYear),
    }))
  );

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const toggleBulkForm   = (f) => setBulkForms((p)  => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);
  const toggleBulkStream = (s) => setBulkStreams((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const addCustomStream = () => {
    const s = customStream.trim();
    if (!s) return;
    if (!bulkStreams.includes(s)) setBulkStreams((p) => [...p, s]);
    setCustomStream("");
  };

  // ── Handlers: single ─────────────────────────────────────────────────────────
  const openAdd = () => { setFormData(emptyForm); setEditingId(null); setMode("single"); setError(null); };

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
    setError(null); setSaving(true);

    const payload = {
      formNumber: Number(formNumber),
      stream:     stream.trim(),
      year:       Number(year),
      className:  buildClassName(formNumber, stream.trim(), year),
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

  // ── Handlers: bulk ────────────────────────────────────────────────────────────
  const handleBulkCreate = async () => {
    if (!bulkForms.length)  { setError("Select at least one form.");   return; }
    if (!bulkStreams.length) { setError("Select at least one stream."); return; }
    setError(null); setBulkSaving(true);
    let created = 0, skipped = 0;
    const newClasses = [];
    for (const combo of bulkCombinations) {
      try {
        const cls = await createClass(combo);
        newClasses.push(cls);
        created++;
      } catch { skipped++; }
    }
    setClasses((p) => [...p, ...newClasses]);
    setBulkDone({ created, skipped });
    setBulkSaving(false);
  };

  const resetBulk = () => {
    setBulkForms([]); setBulkStreams([]); setBulkYear(new Date().getFullYear());
    setBulkDone(null); setMode(null); setError(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading…</p></div>;
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
          <p className="text-gray-600">Manage school classes by form, stream and year</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode("bulk"); setBulkDone(null); setError(null); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700">
            <Zap size={18} /><span>Bulk Create</span>
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700">
            <Plus size={18} /><span>Add Class</span>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Total Classes</p>
            <p className="text-2xl font-bold mt-1">{classes.length}</p></div>
          <GraduationCap className="h-8 w-8 text-blue-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Forms</p>
            <p className="text-2xl font-bold mt-1">{availableForms.length}</p></div>
          <BookOpen className="h-8 w-8 text-green-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Years</p>
            <p className="text-2xl font-bold mt-1">{availableYears.length}</p></div>
          <Calendar className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* ════════════════════════════════════════════════════════
          BULK CREATE
      ════════════════════════════════════════════════════════ */}
      {mode === "bulk" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Zap size={20} className="text-purple-600" />Bulk Create Classes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Create multiple classes at once — every form × stream combination gets its own class
              </p>
            </div>
            <button onClick={resetBulk} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
          </div>

          {bulkDone ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-gray-800">Done!</h3>
              <p className="text-gray-600">
                <span className="text-green-600 font-bold">{bulkDone.created}</span> classes created
                {bulkDone.skipped > 0 && <span className="text-gray-400"> · {bulkDone.skipped} skipped (already exist)</span>}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={resetBulk}
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create More</button>
                <button onClick={() => setMode(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Done</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Forms */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Forms *</label>
                    <div className="flex gap-2">
                      <button onClick={() => setBulkForms([1,2,3,4,5,6])} className="text-xs text-blue-600 hover:underline">1–6</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setBulkForms([])} className="text-xs text-gray-400 hover:underline">Clear</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map((f) => (
                      <button key={`bulk-form-${f}`} onClick={() => toggleBulkForm(f)}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          bulkForms.includes(f)
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-200 text-gray-600 hover:border-blue-300"
                        }`}>
                        Form {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Streams */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Streams *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STREAM_SUGGESTIONS.map((s) => (
                      <button key={`bulk-stream-${s}`} onClick={() => toggleBulkStream(s)}
                        className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                          bulkStreams.includes(s)
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-gray-200 text-gray-600 hover:border-purple-300"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="Custom stream…"
                      value={customStream} onChange={(e) => setCustomStream(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomStream()}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button onClick={addCustomStream}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Year *</label>
                  <input type="number" min="2000" max="2100"
                    value={bulkYear} onChange={(e) => setBulkYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <div className="flex gap-2 flex-wrap">
                    {[new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1].map((y) => (
                      <button key={`bulk-year-${y}`} onClick={() => setBulkYear(y)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                          bulkYear === y
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-gray-200 text-gray-600 hover:border-purple-300"
                        }`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Preview */}
              {bulkCombinations.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-purple-700">
                    Preview — {bulkCombinations.length} class{bulkCombinations.length !== 1 ? "es" : ""} will be created:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bulkCombinations.map((c, i) => (
                      <span key={`preview-${i}`} className="px-3 py-1 bg-white border border-purple-200 rounded-full text-xs text-purple-700 font-medium">
                        {c.className}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={resetBulk}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleBulkCreate}
                  disabled={bulkSaving || bulkCombinations.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60">
                  <Zap size={16} />
                  <span>{bulkSaving ? "Creating…" : `Create ${bulkCombinations.length || ""} Classes`}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SINGLE ADD / EDIT
      ════════════════════════════════════════════════════════ */}
      {mode === "single" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId ? "Edit Class" : "Add Class"}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Number *</label>
              <input type="number" min="1" placeholder="e.g. 3"
                value={formData.formNumber}
                onChange={(e) => setFormData({ ...formData, formNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stream *</label>
              <input type="text" placeholder="e.g. North"
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex flex-wrap gap-1 mt-2">
                {STREAM_SUGGESTIONS.slice(0, 6).map((s) => (
                  <button key={`stream-suggest-${s}`} onClick={() => setFormData({ ...formData, stream: s })}
                    className={`px-2 py-0.5 rounded text-xs border transition-all ${
                      formData.stream === s
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-500 hover:border-blue-300"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
              <input type="number" min="2000" max="2100"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Preview */}
          {formData.formNumber && formData.stream && formData.year && (
            <div className="mt-5 p-4 bg-blue-50 rounded-lg flex items-center gap-4 text-sm">
              <span className="text-blue-600 font-medium">Preview:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFormColor(Number(formData.formNumber))}`}>
                Form {formData.formNumber}
              </span>
              <span className="font-bold text-gray-800">
                {buildClassName(formData.formNumber, formData.stream.trim(), formData.year)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeForm}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <Save size={16} />
              <span>{saving ? "Saving…" : editingId ? "Save Changes" : "Add Class"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search classes…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterForm} onChange={(e) => setFilterForm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Forms</option>
              {availableForms.map((f) => <option key={`filter-form-${f}`} value={f}>Form {f}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Years</option>
              {availableYears.map((y) => <option key={`filter-year-${y}`} value={y}>{y}</option>)}
            </select>
            <span className="text-sm text-gray-500">{filtered.length} of {classes.length}</span>
          </div>
        </div>
      </div>

      {/* ── Classes Table ── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((cls) => (
                <tr key={`class-row-${cls.classId}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getFormColor(cls.formNumber)}`}>
                        {cls.formNumber}
                      </div>
                      <span className="font-semibold text-gray-900">{cls.className}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFormColor(cls.formNumber)}`}>
                      Form {cls.formNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{cls.stream}</td>
                  <td className="px-6 py-4 text-gray-600">{cls.year}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">#{cls.classId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(cls)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                        <Edit size={13} /><span>Edit</span>
                      </button>
                      <button onClick={() => handleDelete(cls.classId, cls.className)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                        <Trash2 size={13} /><span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-14">
            <GraduationCap className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No classes found</p>
            <p className="text-gray-400 text-sm mb-4">Create classes first — students and exams are linked to them</p>
            <button onClick={() => { setMode("bulk"); setBulkDone(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
              <Zap size={16} /><span>Bulk Create</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Classes;