import React, { useState, useEffect } from "react";
import { getAllStudents, addStudent, deleteStudent, updateStudent, getAllClasses, getRole} from "../services/api";
import {
  Users, Plus, Edit, Trash2, X, Save,
  Search, CheckCircle, GraduationCap, UserPlus,
} from "lucide-react";
import BatchAddStudents from "./BatchAddStudents";

const GENDER_OPTIONS = ["Male", "Female"];

const CLASS_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];
const role = getRole();
const isPrincipal = role === "ROLE_PRINCIPAL";
const isDeputy = role === "ROLE_DEPUTY";
const isClassTeacher = role === "ROLE_CLASS_TEACHER";

const getClassColor = (index) =>
  CLASS_COLORS[index % CLASS_COLORS.length] ?? "bg-gray-100 text-gray-700";

const emptyStudent = { firstName: "", secondName: "", classId: "", gender: "Male" };

const Students = () => {
  const [loading,   setLoading]   = useState(true);
  const [students,  setStudents]  = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [error,     setError]     = useState(null);

  const [showForm,  setShowForm]  = useState(false);
  const [showBatch, setShowBatch] = useState(false);   // ✅ moved inside component
  const [editingId, setEditingId] = useState(null);
  const [formData,  setFormData]  = useState(emptyStudent);
  const [saving,    setSaving]    = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  const [search,       setSearch]       = useState("");
  const [filterClass,  setFilterClass]  = useState("all");
  const [filterGender, setFilterGender] = useState("all");

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getAllStudents(), getAllClasses()])
      .then(([s, c]) => { setStudents(s); setClasses(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 3000);
    return () => clearTimeout(t);
  }, [justAdded]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const classMap = classes.reduce((acc, c) => {
    acc[c.classId] = c;
    return acc;
  }, {});

  const classCounts = classes.reduce((acc, c) => {
    acc[c.classId] = students.filter((s) => s.classId === c.classId).length;
    return acc;
  }, {});

  const filtered = students.filter((s) => {
    const name        = `${s.firstName} ${s.secondName}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || String(s.id).includes(search);
    const matchClass  = filterClass  === "all" || String(s.classId) === filterClass;
    const matchGender = filterGender === "all" || s.gender === filterGender;
    return matchSearch && matchClass && matchGender;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const fetchStudents = async () => {        // ✅ named helper for refreshing
    const updated = await getAllStudents();
    setStudents(updated);
  };

  const openAdd = () => {
    setFormData(emptyStudent); setEditingId(null); setShowForm(true); setError(null);
  };

  const openEdit = (student) => {
    setFormData({
      firstName:  student.firstName,
      secondName: student.secondName,
      classId:    String(student.classId),
      gender:     student.gender,
    });
    setEditingId(student.id);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false); setEditingId(null); setFormData(emptyStudent);
  };

  const handleSave = async () => {
    const { firstName, secondName, classId, gender } = formData;
    if (!firstName.trim() || !secondName.trim() || !classId || !gender) {
      setError("Please fill all fields."); return;
    }
    setError(null); setSaving(true);
    try {
      if (editingId) {
        await updateStudent(editingId, { firstName, secondName, classId: Number(classId), gender });
      } else {
        await addStudent({ firstName, secondName, classId: Number(classId), gender });
        setJustAdded(`${firstName} ${secondName}`);
      }
      await fetchStudents();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
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
          <span className="font-medium">{justAdded} added successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-600">Manage student records</p>
        </div>
        {/* ✅ Both buttons properly placed inside the component JSX */}
        {(isPrincipal || isDeputy || isClassTeacher) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatch(true)}
              className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2.5 rounded-lg hover:bg-blue-50 text-sm font-medium">
              <UserPlus size={16} />Add Multiple
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={18} />Admit Student
            </button>
          </div>
        )}
      </div>

      {/* Batch modal */}
      {showBatch && (
        <BatchAddStudents
          onClose={() => setShowBatch(false)}
          onSuccess={async () => { await fetchStudents(); setShowBatch(false); }}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2 bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-3xl font-bold mt-1">{students.length}</p>
          </div>
          <Users className="h-10 w-10 text-blue-500" />
        </div>
        {classes.map((c, index) => (
          <div key={`stat-${c.classId}`} className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-xs text-gray-500 font-medium truncate">{c.className}</p>
            <p className="text-2xl font-bold mt-1">{classCounts[c.classId] ?? 0}</p>
            <span className={`mt-2 text-xs px-2 py-0.5 rounded-full inline-block font-medium ${getClassColor(index)}`}>
              students
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <GraduationCap size={22} className="text-blue-600" />
              {editingId ? "Edit Student" : "Admit New Student"}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input type="text" placeholder="e.g. John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Second Name *</label>
              <input type="text" placeholder="e.g. Doe"
                value={formData.secondName}
                onChange={(e) => setFormData({ ...formData, secondName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admit to Class *
                {classes.length === 0 && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    ⚠ No classes found — create classes first
                  </span>
                )}
              </label>
              {classes.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Go to the Classes page to create classes first</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button key={`class-btn-${c.classId}`} type="button"
                      onClick={() => setFormData({ ...formData, classId: String(c.classId) })}
                      className={`px-4 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                        formData.classId === String(c.classId)
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}>
                      {c.className}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={`gender-${g}`} type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                      formData.gender === g
                        ? g === "Male"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-pink-500 border-pink-500 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Preview */}
          {formData.firstName && formData.secondName && formData.classId && (
            <div className="mt-5 p-4 bg-blue-50 rounded-lg flex items-center gap-4 text-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {formData.firstName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{formData.firstName} {formData.secondName}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {classMap[Number(formData.classId)]?.className} · {formData.gender}
                </p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${getClassColor(classes.findIndex(c => c.classId === Number(formData.classId)))}`}>
                {classMap[Number(formData.classId)]?.className}
              </span>
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
              <span>{saving ? "Saving…" : editingId ? "Save Changes" : "Admit Student"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by name or ID…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={`filter-${c.classId}`} value={c.classId}>{c.className}</option>
              ))}
            </select>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <span className="text-sm text-gray-500">{filtered.length} of {students.length} students</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
               {isPrincipal || isDeputy || isClassTeacher ? (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((student) => {
                const studentClass = classMap[student.classId];
                const classIndex   = classes.findIndex((c) => c.classId === student.classId);
                return (
                  <tr key={`student-row-${student.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          student.gender === "Female"
                            ? "bg-gradient-to-br from-pink-400 to-rose-500"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600"
                        }`}>
                          {student.firstName?.charAt(0)}{student.secondName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{student.firstName} {student.secondName}</div>
                          <div className="text-xs text-gray-400">Student #{student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getClassColor(classIndex)}`}>
                        {studentClass?.className ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">#{student.id}</span>
                    </td>
                  {(isPrincipal || isDeputy || isClassTeacher) && (
    <td className="px-6 py-4">
        <div className="flex items-center gap-2">
            <button onClick={() => openEdit(student)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                <Edit size={13} /><span>Edit</span>
            </button>
            {(isPrincipal || isDeputy) && (
                <button onClick={() => handleDelete(student.id, `${student.firstName} ${student.secondName}`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                    <Trash2 size={13} /><span>Delete</span>
                </button>
            )}
        </div>
    </td>
)}
  
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-14">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {search || filterClass !== "all" || filterGender !== "all"
                ? "No students match your filters"
                : "No students yet"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {search || filterClass !== "all" || filterGender !== "all"
                ? "Try adjusting your search or filters"
                : "Admit the first student to get started"}
            </p>
           {!search && filterClass === "all" && filterGender === "all" 
 && (isPrincipal || isDeputy || isClassTeacher) && (
    <button onClick={openAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
        <Plus size={16} /><span>Admit First Student</span>
    </button>
)}
          </div>
        )}
      </div>

    </div>
  );
};

export default Students;