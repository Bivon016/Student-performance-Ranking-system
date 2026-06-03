import { useState, useEffect } from "react";
import {
  getAllTeachers,
  getAllUsers,
  getTeacherAssignments,
  addTeacher,
  deleteTeacher,
  linkUserToTeacher,
  addTeacherAssignment,
  deleteTeacherAssignment,
  getAllSubjects,
  getAllClasses,
} from "../services/api";
import {
  Users, Plus, Trash2, Link, BookOpen,
  ChevronDown, ChevronUp, CheckCircle,
  UserCheck, X, ShieldCheck,
} from "lucide-react";

const TeacherManager = () => {
  const [teachers,     setTeachers]     = useState([]);
  const [teacherUsers, setTeacherUsers] = useState([]);
  const [subjects,     setSubjects]     = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState(null);

  const [expanded,           setExpanded]           = useState({});
  const [assignments,        setAssignments]        = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState({});

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher,     setNewTeacher]     = useState({ firstName: "", secondName: "", email: "" });
  const [addingTeacher,  setAddingTeacher]  = useState(false);

  const [linkModal,  setLinkModal]  = useState(null);
  const [linkUserId, setLinkUserId] = useState("");
  const [linking,    setLinking]    = useState(false);

  const [assignPanel,  setAssignPanel]  = useState(null);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newClassId,   setNewClassId]   = useState("");
  const [addingAssign, setAddingAssign] = useState(false);

  useEffect(() => {
    Promise.all([
      getAllTeachers(),
      getAllUsers(),       // returns ALL users; we filter to ROLE_TEACHER below
      getAllSubjects(),
      getAllClasses(),
    ])
      .then(([t, u, s, c]) => {
        setTeachers(Array.isArray(t) ? t : []);
        // getAllUsers returns every user — keep only those with the teacher role
        const allUsers = Array.isArray(u) ? u : [];
        setTeacherUsers(
          allUsers.filter(
            (user) =>
              user.role === "ROLE_TEACHER" ||
              user.role === "TEACHER" ||
              // fallback: include everyone if no role field exists
              (!user.role)
          )
        );
        setSubjects(Array.isArray(s) ? s : []);
        setClasses(Array.isArray(c) ? c : []);
      })
      .catch((err) => {
        console.error("Failed to load TeacherManager data:", err);
        setLoadError(err.message || "Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (teacherId) => {
    if (expanded[teacherId]) {
      setExpanded((prev) => ({ ...prev, [teacherId]: false }));
      return;
    }
    setExpanded((prev) => ({ ...prev, [teacherId]: true }));
    if (!assignments[teacherId]) {
      setLoadingAssignments((prev) => ({ ...prev, [teacherId]: true }));
      try {
        const data = await getTeacherAssignments(teacherId);
        setAssignments((prev) => ({ ...prev, [teacherId]: Array.isArray(data) ? data : [] }));
      } catch (err) {
        console.error("Failed to load assignments:", err);
        setAssignments((prev) => ({ ...prev, [teacherId]: [] }));
      } finally {
        setLoadingAssignments((prev) => ({ ...prev, [teacherId]: false }));
      }
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.firstName || !newTeacher.secondName || !newTeacher.email) {
      alert("All fields are required.");
      return;
    }
    setAddingTeacher(true);
    try {
      const created = await addTeacher(newTeacher);
      setTeachers((prev) => [...prev, created]);
      setNewTeacher({ firstName: "", secondName: "", email: "" });
      setShowAddTeacher(false);
    } catch {
      alert("Failed to add teacher.");
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Delete this teacher? This will also remove all their assignments.")) return;
    try {
      await deleteTeacher(teacherId);
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    } catch {
      alert("Failed to delete teacher.");
    }
  };

  const handleLinkUser = async () => {
    if (!linkUserId) { alert("Select a user account."); return; }
    setLinking(true);
    try {
      const updated = await linkUserToTeacher(linkModal, Number(linkUserId));
      setTeachers((prev) => prev.map((t) => (t.id === linkModal ? updated : t)));
      setLinkModal(null);
      setLinkUserId("");
    } catch {
      alert("Failed to link user. The account may already be linked to another teacher.");
    } finally {
      setLinking(false);
    }
  };

  const handleAddAssignment = async (teacherId) => {
    if (!newSubjectId || !newClassId) { alert("Select both a subject and a class."); return; }
    setAddingAssign(true);
    try {
      const created = await addTeacherAssignment(teacherId, {
        subjectId: Number(newSubjectId),
        classId:   Number(newClassId),
      });
      setAssignments((prev) => ({
        ...prev,
        [teacherId]: [...(prev[teacherId] ?? []), created],
      }));
      setNewSubjectId("");
      setNewClassId("");
      setAssignPanel(null);
    } catch (err) {
      alert(
        err.message?.includes("already exists")
          ? "This teacher is already assigned to that subject and class."
          : "Failed to add assignment."
      );
    } finally {
      setAddingAssign(false);
    }
  };

  const handleRemoveAssignment = async (teacherId, assignmentId) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await deleteTeacherAssignment(assignmentId);
      setAssignments((prev) => ({
        ...prev,
        [teacherId]: prev[teacherId].filter((a) => a.id !== assignmentId),
      }));
    } catch {
      alert("Failed to remove assignment.");
    }
  };

  const linkedUserIds = new Set(
    teachers.filter((t) => t.user).map((t) => t.user.id)
  );

  const availableUsers = teacherUsers.filter(
    (u) =>
      !linkedUserIds.has(u.id) ||
      (linkModal && teachers.find((t) => t.id === linkModal)?.user?.id === u.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Management</h1>
          <p className="text-gray-600">Link teacher accounts to users and assign subjects &amp; classes</p>
        </div>
        <button
          onClick={() => setShowAddTeacher((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} />{showAddTeacher ? "Cancel" : "Add Teacher"}
        </button>
      </div>

      {/* Add teacher form */}
      {showAddTeacher && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">New Teacher</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input type="text" value={newTeacher.firstName}
                onChange={(e) => setNewTeacher((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="e.g. Sarah"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input type="text" value={newTeacher.secondName}
                onChange={(e) => setNewTeacher((p) => ({ ...p, secondName: e.target.value }))}
                placeholder="e.g. Dlamini"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={newTeacher.email}
                onChange={(e) => setNewTeacher((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g. sarah@school.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleAddTeacher} disabled={addingTeacher}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60">
              <CheckCircle size={15} />
              {addingTeacher ? "Saving…" : "Save Teacher"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Teachers</p>
            <p className="text-2xl font-bold mt-1">{teachers.length}</p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Linked to Account</p>
            <p className="text-2xl font-bold mt-1">{teachers.filter((t) => t.user).length}</p>
          </div>
          <UserCheck className="h-8 w-8 text-green-500" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Unlinked Accounts</p>
            <p className="text-2xl font-bold mt-1">
              {teacherUsers.filter((u) => !linkedUserIds.has(u.id)).length}
            </p>
          </div>
          <ShieldCheck className="h-8 w-8 text-amber-500" />
        </div>
      </div>

      {/* Teacher list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">All Teachers</p>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-14">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No teachers yet</p>
            <p className="text-gray-400 text-sm">Click "Add Teacher" to create one</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {teachers.map((teacher) => {
              const isExpanded         = expanded[teacher.id];
              const teacherAssignments = assignments[teacher.id] ?? [];
              const isLoadingA         = loadingAssignments[teacher.id];
              const isAssignOpen       = assignPanel === teacher.id;

              return (
                <li key={teacher.id}>
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {teacher.firstName?.charAt(0)}{teacher.secondName?.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {teacher.firstName} {teacher.secondName}
                      </p>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>

                    <div className="shrink-0">
                      {teacher.user ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <UserCheck size={12} />{teacher.user.username}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          No account linked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setLinkModal(teacher.id); setLinkUserId(teacher.user?.id ?? ""); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100">
                        <Link size={12} />Link
                      </button>
                      <button
                        onClick={() => toggleExpand(teacher.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100">
                        <BookOpen size={12} />
                        Subjects
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded assignments panel */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mt-4 mb-3">
                        <p className="text-sm font-semibold text-gray-600">
                          Subject &amp; Class Assignments
                        </p>
                        <button
                          onClick={() => {
                            setAssignPanel(isAssignOpen ? null : teacher.id);
                            setNewSubjectId("");
                            setNewClassId("");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <Plus size={12} />Add Assignment
                        </button>
                      </div>

                      {isAssignOpen && (
                        <div className="flex items-end gap-3 mb-4 p-3 bg-white rounded-lg border border-blue-200">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                            <select value={newSubjectId} onChange={(e) => setNewSubjectId(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select Subject</option>
                              {subjects.map((s) => (
                                <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                            <select value={newClassId} onChange={(e) => setNewClassId(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select Class</option>
                              {classes.map((c) => (
                                <option key={c.classId} value={c.classId}>{c.className}</option>
                              ))}
                            </select>
                          </div>
                          <button onClick={() => handleAddAssignment(teacher.id)} disabled={addingAssign}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap">
                            <CheckCircle size={14} />
                            {addingAssign ? "Saving…" : "Assign"}
                          </button>
                          <button onClick={() => setAssignPanel(null)}
                            className="p-2 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      {isLoadingA ? (
                        <p className="text-sm text-gray-400 py-2">Loading assignments…</p>
                      ) : teacherAssignments.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          No assignments yet — click "Add Assignment" to assign this teacher to a subject and class.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {teacherAssignments.map((a) => (
                            <div key={`${a.subjectId}-${a.classId}`}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm">
                              <BookOpen size={12} className="text-blue-500" />
                              <span className="font-medium">{a.subjectName}</span>
                              <span className="text-gray-400">·</span>
                              <span>{a.className}</span>
                              <button
                                onClick={() => handleRemoveAssignment(teacher.id, a.id)}
                                className="ml-1 text-gray-300 hover:text-red-500 transition-colors">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Link User Modal */}
      {linkModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Link User Account</h2>
              <button onClick={() => { setLinkModal(null); setLinkUserId(""); }}
                className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {(() => {
              const teacher = teachers.find((t) => t.id === linkModal);
              return (
                <p className="text-sm text-gray-600 mb-4">
                  Linking a user account to <strong>{teacher?.firstName} {teacher?.secondName}</strong> allows
                  them to log in and enter marks for their assigned subjects.
                </p>
              );
            })()}

            {availableUsers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
                No unlinked teacher accounts available. Ask the teacher to sign up first.
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teacher Account
                </label>
                <select value={linkUserId} onChange={(e) => setLinkUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose username…</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setLinkModal(null); setLinkUserId(""); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleLinkUser} disabled={linking || !linkUserId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                <Link size={14} />{linking ? "Linking…" : "Link Account"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherManager;