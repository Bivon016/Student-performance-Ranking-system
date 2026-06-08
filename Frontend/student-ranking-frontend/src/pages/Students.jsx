import React, { useState, useEffect, useCallback } from "react";
import {
  getAllStudents,
  getStudentsByClass,
  addStudent,
  deleteStudent,
  updateStudent,
  getAllClasses,
  getRole,
} from "../services/api";
import EnrollmentModal from "../components/EnrollmentModal";
import {
  Users, Plus, Edit, Trash2, X, Save,
  Search, CheckCircle, GraduationCap, UserPlus,
  BookOpen, Filter,
} from "lucide-react";
import { UserMessage } from "../components/UserMessage";
import BatchAddStudents from "./BatchAddStudents";

// ── Constants ──────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = ["Male", "Female"];

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

const getGradeGradient = (index) => GRADE_GRADIENTS[index % GRADE_GRADIENTS.length];
const getGradeBadge    = (index) => GRADE_BADGES[index % GRADE_BADGES.length];

const emptyStudent = { firstName: "", secondName: "", classId: "", gender: "Male" };

// ── Skeleton ───────────────────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />
);

const Students = () => {
  const role           = getRole();
  const isPrincipal    = role === "ROLE_PRINCIPAL";
  const isDeputy       = role === "ROLE_DEPUTY";
  const isClassTeacher = role === "ROLE_CLASS_TEACHER";
  const canManage      = isPrincipal || isDeputy || isClassTeacher;

  const [loading,          setLoading]          = useState(true);
  const [students,         setStudents]         = useState([]);
  const [classes,          setClasses]          = useState([]);
  const [error,            setError]            = useState(null);

  const [showForm,         setShowForm]         = useState(false);
  const [showBatch,        setShowBatch]        = useState(false);
  const [editingId,        setEditingId]        = useState(null);
  const [formData,         setFormData]         = useState(emptyStudent);
  const [saving,           setSaving]           = useState(false);
  const [justAdded,        setJustAdded]        = useState(null);
  const [enrollingStudent, setEnrollingStudent] = useState(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [activeClass,  setActiveClass]  = useState("all");
  const [filterGender, setFilterGender] = useState("all");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    const data =
      activeClass === "all"
        ? await getAllStudents()
        : await getStudentsByClass(activeClass);
    setStudents(data);
  }, [activeClass]);

  useEffect(() => {
    Promise.all([getAllStudents(), getAllClasses()])
      .then(([s, c]) => { setStudents(s); setClasses(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleClassChange = async (classId) => {
    if (classId === activeClass) return;
    setActiveClass(classId);
    setSearch("");
    setLoading(true);
    try {
      const data =
        classId === "all"
          ? await getAllStudents()
          : await getStudentsByClass(classId);
      setStudents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 3000);
    return () => clearTimeout(t);
  }, [justAdded]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const classMap = classes.reduce((acc, c) => { acc[c.classId] = c; return acc; }, {});
  const classIndexMap = classes.reduce((acc, c, i) => { acc[c.classId] = i; return acc; }, {});

  const classCounts = classes.reduce((acc, c) => {
    acc[c.classId] = students.filter((s) => s.classId === c.classId).length;
    return acc;
  }, {});

  const filtered = students.filter((s) => {
    const name        = `${s.firstName} ${s.secondName}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || String(s.id).includes(search);
    const matchGender = filterGender === "all" || s.gender === filterGender;
    return matchSearch && matchGender;
  });

  const activeClassName =
    activeClass === "all"
      ? null
      : classMap[Number(activeClass)]?.className ?? "this class";

  // ── Form handlers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData({ ...emptyStudent, classId: activeClass !== "all" ? activeClass : "" });
    setEditingId(null); setShowForm(true); setError(null);
  };

  const openEdit = (student) => {
    setFormData({
      firstName:  student.firstName,
      secondName: student.secondName,
      classId:    String(student.classId),
      gender:     student.gender,
    });
    setEditingId(student.id); setShowForm(true); setError(null);
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6">
      <Sk className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <Sk className="h-32" /><Sk className="h-32" /><Sk className="h-32" />
      </div>
      <Sk className="h-16" /><Sk className="h-96" />
    </div>
  );

  return (
    <div className="space-y-7">

      {/* Toast */}
      {justAdded && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600
          text-white px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={18} />
          <span className="font-semibold">{justAdded} admitted successfully!</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Students</h1>
          <p className="text-gray-500 mt-0.5">Manage student records and subject enrollment</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBatch(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                border-2 border-blue-600 text-blue-600
                hover:bg-blue-50 transition-all duration-200">
              <UserPlus size={16} /> Add Multiple
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <Plus size={16} /> Admit Student
            </button>
          </div>
        )}
      </div>

      {/* ── Batch modal ── */}
      {showBatch && (
        <BatchAddStudents
          onClose={() => setShowBatch(false)}
          onSuccess={async () => { await fetchStudents(); setShowBatch(false); }}
        />
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="col-span-2 relative overflow-hidden rounded-2xl p-6 text-white shadow-lg
          bg-gradient-to-br from-blue-500 to-blue-700">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold opacity-80">Total Students</p>
              <p className="text-4xl font-extrabold tracking-tight mt-1">{students.length}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
          </div>
        </div>

        {/* Per-class */}
        {classes.map((c, index) => (
          <div key={`stat-${c.classId}`}
            className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-lg
              bg-gradient-to-br ${getGradeGradient(index)}`}>
            <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
            <div className="relative z-10">
              <p className="text-xs font-semibold opacity-80 truncate">{c.className}</p>
              <p className="text-3xl font-extrabold tracking-tight mt-1">{classCounts[c.classId] ?? 0}</p>
              <span className="text-xs opacity-70 font-medium">students</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <UserMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* ══ ADD / EDIT FORM PANEL ══ */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {editingId
                  ? <Edit size={15} className="text-blue-600" />
                  : <GraduationCap size={15} className="text-blue-600" />}
              </span>
              {editingId ? "Edit Student" : "Admit New Student"}
            </h2>
            <button onClick={closeForm}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
              <input type="text" placeholder="e.g. John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* Second Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Second Name *</label>
              <input type="text" placeholder="e.g. Doe"
                value={formData.secondName}
                onChange={(e) => setFormData({ ...formData, secondName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* Class picker */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admit to Class *
                {classes.length === 0 && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    No classes found — create classes first
                  </span>
                )}
              </label>
              {classes.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Go to the Classes page to create classes first
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {classes.map((c, idx) => (
                    <button key={`class-btn-${c.classId}`} type="button"
                      onClick={() => setFormData({ ...formData, classId: String(c.classId) })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        formData.classId === String(c.classId)
                          ? `bg-gradient-to-br ${getGradeGradient(idx)} border-transparent text-white shadow-sm`
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}>
                      {c.className}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={`gender-${g}`} type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      formData.gender === g
                        ? g === "Male"
                          ? "bg-gradient-to-br from-blue-500 to-blue-700 border-transparent text-white shadow-sm"
                          : "bg-gradient-to-br from-pink-400 to-rose-500 border-transparent text-white shadow-sm"
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
            <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50
              border border-blue-100 rounded-xl flex items-center gap-4 text-sm">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center
                text-white font-bold text-lg shadow-sm bg-gradient-to-br ${
                  formData.gender === "Female"
                    ? "from-pink-400 to-rose-500"
                    : "from-blue-500 to-indigo-600"
                }`}>
                {formData.firstName.charAt(0)}{formData.secondName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">
                  {formData.firstName} {formData.secondName}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {classMap[Number(formData.classId)]?.className} · {formData.gender}
                </p>
              </div>
              <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold
                ${getGradeBadge(classIndexMap[Number(formData.classId)] ?? 0)}`}>
                {classMap[Number(formData.classId)]?.className}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeForm}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl
                text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500
                to-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all
                disabled:opacity-50 disabled:translate-y-0">
              <Save size={15} />
              {saving ? "Saving…" : editingId ? "Save Changes" : "Admit Student"}
            </button>
          </div>
        </div>
      )}

      {/* ── Class Tabs + Search/Gender Filter ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

        {/* Class tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleClassChange("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
              activeClass === "all"
                ? "bg-gradient-to-r from-blue-500 to-blue-700 border-transparent text-white shadow-sm"
                : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            }`}>
            All Classes
          </button>
          {classes.map((c, index) => (
            <button key={`tab-${c.classId}`}
              onClick={() => handleClassChange(String(c.classId))}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                activeClass === String(c.classId)
                  ? `bg-gradient-to-br ${getGradeGradient(index)} border-transparent text-white shadow-sm`
                  : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}>
              {c.className}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeClass === String(c.classId)
                  ? "bg-white/20 text-white"
                  : getGradeBadge(index)
              }`}>
                {classCounts[c.classId] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search + gender */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center
          justify-between border-t border-gray-50 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search by name or ID…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
              {filtered.length} of {students.length}
              {activeClassName && (
                <span className="ml-1 font-semibold text-blue-600">in {activeClassName}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Students Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                {canManage && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((student) => {
                const studentClass = classMap[student.classId];
                const classIndex   = classIndexMap[student.classId] ?? 0;
                return (
                  <tr key={`student-row-${student.id}`}
                    className="hover:bg-gray-50/80 transition-colors duration-150">

                    {/* Student */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          text-white font-bold text-sm shadow-sm bg-gradient-to-br ${
                            student.gender === "Female"
                              ? "from-pink-400 to-rose-500"
                              : "from-blue-500 to-indigo-600"
                          }`}>
                          {student.firstName?.charAt(0)}{student.secondName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {student.firstName} {student.secondName}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">Student #{student.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${getGradeBadge(classIndex)}`}>
                        {studentClass?.className ?? "—"}
                      </span>
                    </td>

                    {/* Gender */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.gender === "Female"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {student.gender}
                      </span>
                    </td>

                    {/* ID */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
                        #{student.id}
                      </span>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                              bg-blue-50 text-blue-600 text-xs font-semibold
                              hover:bg-blue-600 hover:text-white transition-colors">
                            <Edit size={12} /> Edit
                          </button>
                          {(isPrincipal || isDeputy) && (
                            <button
                              onClick={() => handleDelete(
                                student.id,
                                `${student.firstName} ${student.secondName}`
                              )}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-red-50 text-red-500 text-xs font-semibold
                                hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                          <button onClick={() => setEnrollingStudent(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                              bg-amber-50 text-amber-600 text-xs font-semibold
                              hover:bg-amber-500 hover:text-white transition-colors">
                            <BookOpen size={12} /> Enroll
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-300" size={28} />
            </div>
            <p className="text-gray-600 font-semibold">
              {search || filterGender !== "all"
                ? "No students match your filters"
                : activeClassName
                  ? `No students in ${activeClassName} yet`
                  : "No students yet"}
            </p>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              {search || filterGender !== "all"
                ? "Try adjusting your search or filters"
                : "Admit the first student to get started"}
            </p>
            {!search && filterGender === "all" && canManage && (
              <button onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r
                  from-blue-500 to-blue-700 text-white text-sm font-semibold rounded-xl
                  shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <Plus size={16} />
                {activeClassName
                  ? `Admit First Student to ${activeClassName}`
                  : "Admit First Student"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Enrollment Modal ── */}
      {enrollingStudent && (
        <EnrollmentModal
          student={enrollingStudent}
          onClose={() => setEnrollingStudent(null)}
          onSaved={() => setEnrollingStudent(null)}
        />
      )}

    </div>
  );
};

export default Students;