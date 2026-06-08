import React, { useEffect, useState } from "react";
import {
  getAllSubjects, addSubject, updateSubject, deleteSubject, getRole,
  getAllSubjectGroups, createSubjectGroup, updateSubjectGroup, deleteSubjectGroup,
} from "../services/api";
import {
  BookOpen, Plus, Edit, Trash2, X, Save,
  Search, CheckCircle, Layers, Lock, Unlock,
} from "lucide-react";
import { UserMessage } from "../components/UserMessage";

// ── Constants ──────────────────────────────────────────────────────────────────
const emptySubject = { subjectName: "", subjectType: "COMPULSORY", optionalGroup: "" };
const emptyGroup   = { groupName: "", minChoices: 1, maxChoices: 1 };

const GROUP_GRADIENTS = [
  "from-amber-400 to-orange-500",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
  "from-indigo-500 to-blue-600",
];

const GROUP_BADGES = [
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
  "bg-indigo-100 text-indigo-800",
];

const getGroupGradient = (i) => GROUP_GRADIENTS[i % GROUP_GRADIENTS.length];
const getGroupBadge    = (i) => GROUP_BADGES[i % GROUP_BADGES.length];

// ── Skeleton ───────────────────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />
);

// ── Type Badge ─────────────────────────────────────────────────────────────────
const TypeBadge = ({ type, group }) => {
  if (type === "COMPULSORY") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        <Lock size={10} /> Compulsory
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Unlock size={10} /> Optional{group ? ` · ${group}` : ""}
    </span>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────
const Subjects = () => {
  const [loading,   setLoading]   = useState(true);
  const [subjects,  setSubjects]  = useState([]);
  const [groups,    setGroups]    = useState([]);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState("subjects");

  // Subject form
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData,  setFormData]  = useState(emptySubject);
  const [saving,    setSaving]    = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const [search,    setSearch]    = useState("");

  // Group form
  const [showGroupForm,  setShowGroupForm]  = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupForm,      setGroupForm]      = useState(emptyGroup);
  const [savingGroup,    setSavingGroup]    = useState(false);

  const role        = getRole();
  const isPrincipal = role === "ROLE_PRINCIPAL";

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getAllSubjects(), getAllSubjectGroups()])
      .then(([s, g]) => { setSubjects(s); setGroups(g); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 3000);
    return () => clearTimeout(t);
  }, [justAdded]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const groupIndexMap = groups.reduce((acc, g, i) => { acc[g.groupName] = i; return acc; }, {});

  const filtered = subjects.filter((s) =>
    s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    String(s.subjectId).includes(search)
  );

  const compulsoryCount = subjects.filter(s => s.subjectType === "COMPULSORY").length;
  const optionalCount   = subjects.filter(s => s.subjectType === "OPTIONAL").length;

  // ── Subject handlers ──────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptySubject); setEditingId(null); setShowForm(true); setError(null);
  };

  const openEdit = (subject) => {
    setFormData({
      subjectName:   subject.subjectName,
      subjectType:   subject.subjectType   ?? "COMPULSORY",
      optionalGroup: subject.optionalGroup ?? "",
    });
    setEditingId(subject.subjectId); setShowForm(true); setError(null);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(emptySubject); };

  const handleSave = async () => {
    if (!formData.subjectName.trim()) { setError("Please enter a subject name."); return; }
    if (formData.subjectType === "OPTIONAL" && !formData.optionalGroup) {
      setError("Please select a group for the optional subject."); return;
    }
    setError(null); setSaving(true);
    try {
      const payload = {
        subjectName: formData.subjectName.trim(),
        subjectType: formData.subjectType,
        subjectGroup: formData.subjectType === "OPTIONAL" && formData.optionalGroup
          ? { groupName: formData.optionalGroup }
          : null,
      };
      if (editingId) {
        const updated = await updateSubject(editingId, payload);
        setSubjects(prev => prev.map(s => s.subjectId === editingId ? updated : s));
      } else {
        const created = await addSubject(payload);
        setSubjects(prev => [...prev, created]);
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
      setSubjects(prev => prev.filter(s => s.subjectId !== id));
    } catch (err) { setError(err.message); }
  };

  // ── Group handlers ────────────────────────────────────────────────────────
  const openAddGroup = () => {
    setGroupForm(emptyGroup); setEditingGroupId(null); setShowGroupForm(true); setError(null);
  };

  const openEditGroup = (group) => {
    setGroupForm({ groupName: group.groupName, minChoices: group.minChoices ?? 1, maxChoices: group.maxChoices ?? 1 });
    setEditingGroupId(group.id); setShowGroupForm(true); setError(null);
  };

  const closeGroupForm = () => {
    setShowGroupForm(false); setEditingGroupId(null); setGroupForm(emptyGroup);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.groupName.trim()) { setError("Please enter a group name."); return; }
    if (groupForm.minChoices < 1 || groupForm.maxChoices < 1) { setError("Min and max choices must be at least 1."); return; }
    if (groupForm.minChoices > groupForm.maxChoices) { setError("Min choices cannot exceed max choices."); return; }
    setError(null); setSavingGroup(true);
    try {
      if (editingGroupId) {
        const updated = await updateSubjectGroup(editingGroupId, groupForm);
        setGroups(prev => prev.map(g => g.id === editingGroupId ? updated : g));
      } else {
        const created = await createSubjectGroup(groupForm);
        setGroups(prev => [...prev, created]);
      }
      closeGroupForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (id, name) => {
    const inUse = subjects.some(s => s.optionalGroup === name);
    if (inUse) { setError(`Cannot delete "${name}" — some subjects are still assigned to this group.`); return; }
    if (!window.confirm(`Delete group "${name}"?`)) return;
    try {
      await deleteSubjectGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) { setError(err.message); }
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
          text-white px-5 py-3 rounded-2xl shadow-xl animate-bounce-once">
          <CheckCircle size={18} />
          <span className="font-semibold">"{justAdded}" added successfully!</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Subjects</h1>
          <p className="text-gray-500 mt-0.5">Manage school subjects and optional subject groups</p>
        </div>
        {isPrincipal && (
          <div className="flex items-center gap-3">
            {activeTab === "groups" && (
              <button onClick={openAddGroup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <Plus size={16} /> Add Group
              </button>
            )}
            {activeTab === "subjects" && (
              <button onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <Plus size={16} /> Add Subject
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="col-span-2 relative overflow-hidden rounded-2xl p-6 text-white shadow-lg
          bg-gradient-to-br from-blue-500 to-blue-700">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold opacity-80">Total Subjects</p>
              <p className="text-4xl font-extrabold tracking-tight mt-1">{subjects.length}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
          </div>
        </div>

        {/* Compulsory */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg
          bg-gradient-to-br from-indigo-500 to-blue-600">
          <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative z-10">
            <p className="text-xs font-semibold opacity-80">Compulsory</p>
            <p className="text-3xl font-extrabold tracking-tight mt-1">{compulsoryCount}</p>
            <div className="flex items-center gap-1 mt-1">
              <Lock size={10} className="opacity-70" />
              <span className="text-xs opacity-70 font-medium">required</span>
            </div>
          </div>
        </div>

        {/* Optional */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg
          bg-gradient-to-br from-amber-400 to-orange-500">
          <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative z-10">
            <p className="text-xs font-semibold opacity-80">Optional</p>
            <p className="text-3xl font-extrabold tracking-tight mt-1">{optionalCount}</p>
            <div className="flex items-center gap-1 mt-1">
              <Unlock size={10} className="opacity-70" />
              <span className="text-xs opacity-70 font-medium">elective</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <UserMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
        {[
          { id: "subjects", label: "Subjects",        icon: <BookOpen size={15} />, count: subjects.length },
          { id: "groups",   label: "Optional Groups", icon: <Layers size={15} />,   count: groups.length   },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          SUBJECTS TAB
      ══════════════════════════════════════ */}
      {activeTab === "subjects" && (
        <>
          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {editingId
                      ? <Edit size={15} className="text-blue-600" />
                      : <BookOpen size={15} className="text-blue-600" />}
                  </span>
                  {editingId ? "Edit Subject" : "Add New Subject"}
                </h2>
                <button onClick={closeForm}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 max-w-lg">
                {/* Subject Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name *</label>
                  <input type="text" placeholder="e.g. Mathematics"
                    value={formData.subjectName}
                    onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Subject Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button"
                      onClick={() => setFormData({ ...formData, subjectType: "COMPULSORY", optionalGroup: "" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        formData.subjectType === "COMPULSORY"
                          ? "bg-gradient-to-br from-blue-500 to-blue-700 border-transparent text-white shadow-sm"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}>
                      <Lock size={15} /> Compulsory
                    </button>
                    <button type="button"
                      onClick={() => setFormData({ ...formData, subjectType: "OPTIONAL" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        formData.subjectType === "OPTIONAL"
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 border-transparent text-white shadow-sm"
                          : "border-gray-200 text-gray-600 hover:border-amber-300"
                      }`}>
                      <Unlock size={15} /> Optional
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formData.subjectType === "COMPULSORY"
                      ? "Every student is expected to sit this subject. Missing marks will be flagged."
                      : "Students choose this subject from a group. Missing marks are not flagged unless enrolled."}
                  </p>
                </div>

                {/* Optional Group picker */}
                {formData.subjectType === "OPTIONAL" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Optional Group *
                      {groups.length === 0 && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">
                          No groups yet — create groups in the Optional Groups tab first
                        </span>
                      )}
                    </label>
                    {groups.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">
                        Go to the Optional Groups tab to create groups first.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {groups.map((g, idx) => (
                          <button key={g.id} type="button"
                            onClick={() => setFormData({ ...formData, optionalGroup: g.groupName })}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                              formData.optionalGroup === g.groupName
                                ? `bg-gradient-to-br ${getGroupGradient(idx)} border-transparent text-white shadow-sm`
                                : "border-gray-200 text-gray-600 hover:border-amber-300"
                            }`}>
                            {g.groupName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview */}
              {formData.subjectName.trim() && (
                <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50
                  border border-blue-100 rounded-xl flex items-center gap-4 text-sm max-w-lg">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center
                    text-white font-bold text-lg shadow-sm bg-gradient-to-br ${
                      formData.subjectType === "COMPULSORY"
                        ? "from-blue-500 to-indigo-600"
                        : "from-amber-400 to-orange-500"
                    }`}>
                    {formData.subjectName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{formData.subjectName}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formData.subjectType === "COMPULSORY"
                        ? "Compulsory subject"
                        : `Optional · ${formData.optionalGroup || "no group selected"}`}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <TypeBadge type={formData.subjectType} group={formData.optionalGroup} />
                  </div>
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
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Add Subject"}
                </button>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search subjects…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                {filtered.length} of {subjects.length} subjects
              </span>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Group</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    {isPrincipal && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((subject) => {
                    const gIdx = groupIndexMap[subject.optionalGroup] ?? 0;
                    return (
                      <tr key={`subject-row-${subject.subjectId}`}
                        className="hover:bg-gray-50/80 transition-colors duration-150">

                        {/* Subject name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                              text-white font-bold text-sm shadow-sm bg-gradient-to-br ${
                                subject.subjectType === "OPTIONAL"
                                  ? getGroupGradient(gIdx)
                                  : "from-blue-500 to-indigo-600"
                              }`}>
                              {subject.subjectName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-semibold text-gray-900 text-sm">{subject.subjectName}</div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <TypeBadge type={subject.subjectType ?? "COMPULSORY"} />
                        </td>

                        {/* Group */}
                        <td className="px-6 py-4">
                          {subject.optionalGroup ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold
                              ${getGroupBadge(groupIndexMap[subject.optionalGroup] ?? 0)}`}>
                              {subject.optionalGroup}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* ID */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
                            #{subject.subjectId}
                          </span>
                        </td>

                        {/* Actions */}
                        {isPrincipal && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(subject)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                  bg-blue-50 text-blue-600 text-xs font-semibold
                                  hover:bg-blue-600 hover:text-white transition-colors">
                                <Edit size={12} /> Edit
                              </button>
                              <button onClick={() => handleDelete(subject.subjectId, subject.subjectName)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                  bg-red-50 text-red-500 text-xs font-semibold
                                  hover:bg-red-500 hover:text-white transition-colors">
                                <Trash2 size={12} /> Delete
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
                  <BookOpen className="text-gray-300" size={28} />
                </div>
                <p className="text-gray-600 font-semibold">
                  {search ? "No subjects match your search" : "No subjects yet"}
                </p>
                <p className="text-gray-400 text-sm mt-1 mb-5">
                  {search ? "Try adjusting your search" : "Add the first subject to get started"}
                </p>
                {!search && isPrincipal && (
                  <button onClick={openAdd}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r
                      from-blue-500 to-blue-700 text-white text-sm font-semibold rounded-xl
                      shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <Plus size={16} /> Add First Subject
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          GROUPS TAB
      ══════════════════════════════════════ */}
      {activeTab === "groups" && (
        <>
          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Layers size={16} className="text-amber-600" />
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">How optional groups work</p>
              <p className="text-amber-700 text-xs leading-relaxed">
                Create groups (e.g. "Group A", "Group B") and set how many subjects a student must
                choose from each. Then assign optional subjects to their group in the Subjects tab.
              </p>
            </div>
          </div>

          {/* Add / Edit Group Form */}
          {showGroupForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    {editingGroupId
                      ? <Edit size={15} className="text-amber-600" />
                      : <Layers size={15} className="text-amber-600" />}
                  </span>
                  {editingGroupId ? "Edit Group" : "Add Optional Group"}
                </h2>
                <button onClick={closeGroupForm}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="max-w-lg space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name *</label>
                  <input type="text" placeholder="e.g. Group A"
                    value={groupForm.groupName}
                    onChange={e => setGroupForm({ ...groupForm, groupName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Min Choices *</label>
                    <input type="number" min={1}
                      value={groupForm.minChoices}
                      onChange={e => setGroupForm({ ...groupForm, minChoices: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                        focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Choices *</label>
                    <input type="number" min={1}
                      value={groupForm.maxChoices}
                      onChange={e => setGroupForm({ ...groupForm, maxChoices: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                        focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>

                {/* Preview pill */}
                {groupForm.groupName.trim() && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50
                    border border-amber-100 rounded-xl flex items-center gap-4 text-sm">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                      flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {groupForm.groupName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{groupForm.groupName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Students pick {groupForm.minChoices}–{groupForm.maxChoices} subject(s)
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Students must pick at least <strong>{groupForm.minChoices}</strong> and
                  at most <strong>{groupForm.maxChoices}</strong> subject(s) from this group.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeGroupForm}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl
                    text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSaveGroup} disabled={savingGroup}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r
                    from-amber-400 to-orange-500 text-white rounded-xl text-sm font-semibold
                    shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all
                    disabled:opacity-50 disabled:translate-y-0">
                  <Save size={15} />
                  {savingGroup ? "Saving…" : editingGroupId ? "Save Changes" : "Create Group"}
                </button>
              </div>
            </div>
          )}

          {/* Groups grid */}
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers className="text-gray-300" size={28} />
              </div>
              <p className="text-gray-600 font-semibold">No optional groups yet</p>
              <p className="text-gray-400 text-sm mt-1 mb-5">
                Create a group to start assigning optional subjects
              </p>
              {isPrincipal && (
                <button onClick={openAddGroup}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r
                    from-amber-400 to-orange-500 text-white text-sm font-semibold rounded-xl
                    shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <Plus size={16} /> Create First Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group, index) => {
                const groupSubjects = subjects.filter(s => s.optionalGroup === group.groupName);
                return (
                  <div key={group.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                      hover:shadow-md transition-shadow duration-200">

                    {/* Coloured top stripe */}
                    <div className={`h-1.5 bg-gradient-to-r ${getGroupGradient(index)}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                            text-white font-bold text-sm shadow-sm bg-gradient-to-br
                            ${getGroupGradient(index)}`}>
                            {group.groupName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{group.groupName}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Pick {group.minChoices}–{group.maxChoices} subject(s)
                            </p>
                          </div>
                        </div>
                        {isPrincipal && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditGroup(group)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50
                                rounded-lg transition-colors">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteGroup(group.id, group.groupName)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50
                                rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Min/max badges */}
                      <div className="flex gap-2 mt-3 mb-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                          ${getGroupBadge(index)}`}>
                          Min: {group.minChoices}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                          ${getGroupBadge(index)}`}>
                          Max: {group.maxChoices}
                        </span>
                      </div>

                      <div className="border-t border-gray-50 pt-3">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                          Subjects ({groupSubjects.length})
                        </p>
                        {groupSubjects.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No subjects assigned yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {groupSubjects.map(s => (
                              <span key={s.subjectId}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium
                                  ${getGroupBadge(index)}`}>
                                {s.subjectName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Subjects;