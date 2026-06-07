import React, { useEffect, useState } from "react";
import {
  getAllSubjects, addSubject, updateSubject, deleteSubject, getRole,
  getAllSubjectGroups, createSubjectGroup, updateSubjectGroup, deleteSubjectGroup,
} from "../services/api";
import {
  BookOpen, Plus, Edit, Trash2, X, Save,
  Search, CheckCircle, Layers, Lock, Unlock,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const emptySubject = { subjectName: "", subjectType: "COMPULSORY", optionalGroup: "" };
const emptyGroup   = { groupName: "", minChoices: 1, maxChoices: 1 };

// ── Badge helpers ──────────────────────────────────────────────────────────────
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
      <Unlock size={10} /> Optional {group ? `· ${group}` : ""}
    </span>
  );
};

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
  const filtered = subjects.filter((s) =>
    s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    String(s.subjectId).includes(search)
  );

  const compulsoryCount = subjects.filter(s => s.subjectType === "COMPULSORY").length;
  const optionalCount   = subjects.filter(s => s.subjectType === "OPTIONAL").length;

  // ── Subject handlers ──────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData(emptySubject);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (subject) => {
    setFormData({
      subjectName:   subject.subjectName,
      subjectType:   subject.subjectType   ?? "COMPULSORY",
      optionalGroup: subject.optionalGroup ?? "",
    });
    setEditingId(subject.subjectId);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptySubject);
  };

  const handleSave = async () => {
    if (!formData.subjectName.trim()) {
      setError("Please enter a subject name.");
      return;
    }
    if (formData.subjectType === "OPTIONAL" && !formData.optionalGroup) {
      setError("Please select a group for the optional subject.");
      return;
    }
    setError(null);
    setSaving(true);
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
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Group handlers ────────────────────────────────────────────────────────
  const openAddGroup = () => {
    setGroupForm(emptyGroup);
    setEditingGroupId(null);
    setShowGroupForm(true);
    setError(null);
  };

  const openEditGroup = (group) => {
    setGroupForm({
      groupName:  group.groupName,
      minChoices: group.minChoices ?? 1,  // ← pre-fill from existing group
      maxChoices: group.maxChoices ?? 1,
    });
    setEditingGroupId(group.id);
    setShowGroupForm(true);
    setError(null);
  };

  const closeGroupForm = () => {
    setShowGroupForm(false);
    setEditingGroupId(null);
    setGroupForm(emptyGroup);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.groupName.trim()) {
      setError("Please enter a group name.");
      return;
    }
    if (groupForm.minChoices < 1 || groupForm.maxChoices < 1) {
      setError("Min and max choices must be at least 1.");
      return;
    }
    if (groupForm.minChoices > groupForm.maxChoices) {
      setError("Min choices cannot exceed max choices.");
      return;
    }
    setError(null);
    setSavingGroup(true);
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
    // ← fixed: use s.optionalGroup (flat string from SubjectDTO)
    const inUse = subjects.some(s => s.optionalGroup === name);
    if (inUse) {
      setError(`Cannot delete "${name}" — some subjects are still assigned to this group.`);
      return;
    }
    if (!window.confirm(`Delete group "${name}"?`)) return;
    try {
      await deleteSubjectGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
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
          <p className="text-gray-600">Manage school subjects and optional groups</p>
        </div>
        {isPrincipal && (
          <div className="flex items-center gap-2">
            {activeTab === "groups" && (
              <button onClick={openAddGroup}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 text-sm font-medium">
                <Plus size={18} /> Add Group
              </button>
            )}
            {activeTab === "subjects" && (
              <button onClick={openAdd}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
                <Plus size={18} /> Add Subject
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Total Subjects</p><p className="text-3xl font-bold mt-1">{subjects.length}</p></div>
          <BookOpen className="h-10 w-10 text-blue-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Compulsory</p><p className="text-3xl font-bold mt-1 text-blue-700">{compulsoryCount}</p></div>
          <Lock className="h-10 w-10 text-blue-400" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Optional</p><p className="text-3xl font-bold mt-1 text-amber-600">{optionalCount}</p></div>
          <Unlock className="h-10 w-10 text-amber-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {[
            { id: "subjects", label: "Subjects",        icon: <BookOpen size={15} /> },
            { id: "groups",   label: "Optional Groups", icon: <Layers size={15} />   },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab.icon} {tab.label}
              {tab.id === "groups" && (
                <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {groups.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ SUBJECTS TAB ══ */}
      {activeTab === "subjects" && (
        <>
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen size={22} className="text-blue-600" />
                  {editingId ? "Edit Subject" : "Add New Subject"}
                </h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <div className="space-y-5 max-w-lg">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
                  <input
                    type="text" placeholder="e.g. Mathematics"
                    value={formData.subjectName}
                    onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button"
                      onClick={() => setFormData({ ...formData, subjectType: "COMPULSORY", optionalGroup: "" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        formData.subjectType === "COMPULSORY"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}>
                      <Lock size={15} /> Compulsory
                    </button>
                    <button type="button"
                      onClick={() => setFormData({ ...formData, subjectType: "OPTIONAL" })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        formData.subjectType === "OPTIONAL"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-amber-300"
                      }`}>
                      <Unlock size={15} /> Optional
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formData.subjectType === "COMPULSORY"
                      ? "Every student is expected to sit this subject. Missing marks will be flagged."
                      : "Students choose this subject from a group. Missing marks are not flagged."}
                  </p>
                </div>

                {/* Optional Group */}
                {formData.subjectType === "OPTIONAL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Optional Group *
                      {groups.length === 0 && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">
                          ⚠ No groups yet — create groups in the Optional Groups tab first
                        </span>
                      )}
                    </label>
                    {groups.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Go to the Optional Groups tab to create groups first.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {groups.map(g => (
                          <button key={g.id} type="button"
                            onClick={() => setFormData({ ...formData, optionalGroup: g.groupName })}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                              formData.optionalGroup === g.groupName
                                ? "bg-amber-500 border-amber-500 text-white"
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
                <div className="mt-5 p-4 bg-gray-50 rounded-lg flex items-center gap-4 text-sm max-w-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    formData.subjectType === "COMPULSORY"
                      ? "bg-gradient-to-br from-blue-500 to-blue-700"
                      : "bg-gradient-to-br from-amber-400 to-orange-500"
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
                  <TypeBadge type={formData.subjectType} group={formData.optionalGroup} />
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
                <input type="text" placeholder="Search subjects…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <span className="text-sm text-gray-500">{filtered.length} of {subjects.length} subjects</span>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    {isPrincipal && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((subject) => (
                    <tr key={`subject-row-${subject.subjectId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            subject.subjectType === "OPTIONAL"
                              ? "bg-gradient-to-br from-amber-400 to-orange-500"
                              : "bg-gradient-to-br from-blue-500 to-purple-500"
                          }`}>
                            {subject.subjectName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-semibold text-gray-900">{subject.subjectName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TypeBadge type={subject.subjectType ?? "COMPULSORY"} />
                      </td>
                      <td className="px-6 py-4">
                        {/* ← subject.optionalGroup is a flat string from SubjectDTO — correct */}
                        {subject.optionalGroup
                          ? <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-medium">{subject.optionalGroup}</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">#{subject.subjectId}</span>
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
                              <Trash2 size={13} /><span>Delete</span>
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
                {!search && isPrincipal && (
                  <button onClick={openAdd}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    <Plus size={16} /> Add First Subject
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ GROUPS TAB ══ */}
      {activeTab === "groups" && (
        <>
          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Layers size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">How optional groups work</p>
              <p>Create groups (e.g. "Group A", "Group B") and set how many subjects a student must choose from each. Then assign optional subjects to their group in the Subjects tab.</p>
            </div>
          </div>

          {/* Add / Edit Group Form */}
          {showGroupForm && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Layers size={22} className="text-amber-500" />
                  {editingGroupId ? "Edit Group" : "Add Optional Group"}
                </h2>
                <button onClick={closeGroupForm} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <div className="max-w-lg space-y-4">
                {/* Group name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                  <input type="text" placeholder="e.g. Group A"
                    value={groupForm.groupName}
                    onChange={e => setGroupForm({ ...groupForm, groupName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>

                {/* Min / Max choices — fixes the 400 error */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Choices *</label>
                    <input
                      type="number" min={1}
                      value={groupForm.minChoices}
                      onChange={e => setGroupForm({ ...groupForm, minChoices: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Choices *</label>
                    <input
                      type="number" min={1}
                      value={groupForm.maxChoices}
                      onChange={e => setGroupForm({ ...groupForm, maxChoices: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Students must pick at least <strong>{groupForm.minChoices}</strong> and
                  at most <strong>{groupForm.maxChoices}</strong> subject(s) from this group.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeGroupForm}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSaveGroup} disabled={savingGroup}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-60">
                  <Save size={16} />
                  <span>{savingGroup ? "Saving…" : editingGroupId ? "Save Changes" : "Create Group"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Groups list */}
          {groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border text-center py-14">
              <Layers className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No optional groups yet</p>
              <p className="text-gray-400 text-sm mb-4">Create a group to start assigning optional subjects</p>
              {isPrincipal && (
                <button onClick={openAddGroup}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">
                  <Plus size={16} /> Create First Group
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(group => {
                // ← flat string from SubjectDTO — correct
                const groupSubjects = subjects.filter(s => s.optionalGroup === group.groupName);
                return (
                  <div key={group.id} className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{group.groupName}</h3>
                        {/* ← show min/max on the card */}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Pick {group.minChoices}–{group.maxChoices} subject(s)
                        </p>
                      </div>
                      {isPrincipal && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditGroup(group)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteGroup(group.id, group.groupName)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                        Subjects in this group ({groupSubjects.length})
                      </p>
                      {groupSubjects.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No subjects assigned yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {groupSubjects.map(s => (
                            <span key={s.subjectId}
                              className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-full font-medium">
                              {s.subjectName}
                            </span>
                          ))}
                        </div>
                      )}
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