import React, { useEffect, useState } from "react";
import {
  getAllSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
  getRole,
} from "../services/api";
import {
  BookOpen, Plus, Edit, Trash2, X, Save,
  Search, CheckCircle,
} from "lucide-react";

const emptySubject = { subjectName: "" };

const Subjects = () => {
  const [loading,   setLoading]   = useState(true);
  const [subjects,  setSubjects]  = useState([]);
  const [error,     setError]     = useState(null);

  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData,  setFormData]  = useState(emptySubject);
  const [saving,    setSaving]    = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  const [search, setSearch] = useState("");
  const role = getRole();
  const isPrincipal = role === "ROLE_PRINCIPAL";

  // ── Load ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    getAllSubjects()
      .then(setSubjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 3000);
    return () => clearTimeout(t);
  }, [justAdded]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filtered = subjects.filter((s) =>
    s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    String(s.subjectId).includes(search)
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openAdd = () => { 
    setFormData(emptySubject); 
    setEditingId(null); setShowForm(true); 
    setError(null); };

  const openEdit = (subject) => {
    setFormData({ subjectName: subject.subjectName });
    setEditingId(subject.subjectId);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(emptySubject); };

  const handleSave = async () => {
    if (!formData.subjectName.trim()) { setError("Please enter a subject name."); return; }
    setError(null); setSaving(true);
    try {
      if (editingId) {
        const updated = await updateSubject(editingId, formData);
        setSubjects((prev) => prev.map((s) => s.subjectId === editingId ? updated : s));
      } else {
        const created = await addSubject(formData);
        setSubjects((prev) => [...prev, created]);
        setJustAdded(formData.subjectName);
      }
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.subjectId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast */}
      {justAdded && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">
          <CheckCircle size={18} />
          <span className="font-medium">"{justAdded}" added successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <p className="text-gray-600">Manage school subjects</p>
        </div>
        {isPrincipal && (
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700">
            <Plus size={18} /><span>Add Subject</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Subjects</p>
            <p className="text-3xl font-bold mt-1">{subjects.length}</p>
          </div>
          <BookOpen className="h-10 w-10 text-blue-500" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={22} className="text-blue-600" />
              {editingId ? "Edit Subject" : "Add New Subject"}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              value={formData.subjectName}
              onChange={(e) => setFormData({ subjectName: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          {formData.subjectName.trim() && (
            <div className="mt-5 p-4 bg-blue-50 rounded-lg flex items-center gap-4 text-sm max-w-md">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {formData.subjectName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800">{formData.subjectName}</p>
                <p className="text-gray-500 text-xs mt-0.5">Subject</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeForm}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <Save size={16} />
              <span>{saving ? "Saving…" : editingId ? "Save Changes" : "Add Subject"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search subjects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} of {subjects.length} subjects</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                {isPrincipal && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((subject) => (
                <tr key={`subject-row-${subject.subjectId}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {subject.subjectName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-gray-900">{subject.subjectName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      #{subject.subjectId}
                    </span>
                  </td>
                  {isPrincipal && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(subject)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                          <Edit size={13} /><span>Edit</span>
                        </button>
                        <button onClick={() => handleDelete(subject.subjectId, subject.subjectName)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-14">
            <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {search ? "No subjects match your search" : "No subjects yet"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {search ? "Try adjusting your search" : "Add the first subject to get started"}
            </p>
            {!search && isPrincipal && (
              <button onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                {isPrincipal && <Plus size={16} />}
                <span>Add First Subject</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Subjects;