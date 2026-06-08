import React, { useState, useEffect } from 'react'
import {
    getAllUsers, updateRole,
    getAllTeachers, addTeacher, deleteTeacher, linkUserToTeacher,
    getTeacherAssignments, addTeacherAssignment, deleteTeacherAssignment,
    getAllPeriods, createPeriod, setCurrentPeriod,
    getAllSubjects, getAllClasses,
} from '../services/api'
import { Shield, Users, UserCog, BookOpen, Calendar, X, Save, Plus, Trash2, Link, CheckCircle } from 'lucide-react'
import { UserMessage } from '../components/UserMessage'

const ROLES = [
    { value: 'ROLE_SUBJECT_TEACHER', label: 'Subject Teacher' },
    { value: 'ROLE_CLASS_TEACHER',   label: 'Class Teacher'   },
    { value: 'ROLE_DEPUTY',          label: 'Deputy'          },
    { value: 'ROLE_PRINCIPAL',       label: 'Principal'       },
]

const TABS = [
    { id: 'users',       label: 'Users & Roles',  icon: <Users size={16} />     },
    { id: 'teachers',    label: 'Teachers',        icon: <UserCog size={16} />   },
    { id: 'assignments', label: 'Assignments',     icon: <BookOpen size={16} />  },
    { id: 'periods',     label: 'Periods',         icon: <Calendar size={16} />  },
]

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('users')

    // ── Data ──────────────────────────────────────────────────────────────────
    const [users,     setUsers]     = useState([])
    const [teachers,  setTeachers]  = useState([])
    const [subjects,  setSubjects]  = useState([])
    const [classes,   setClasses]   = useState([])
    const [periods,   setPeriods]   = useState([])
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState(null)
    const [success,   setSuccess]   = useState(null)

    // ── Users tab state ───────────────────────────────────────────────────────
    const [roleChanges, setRoleChanges] = useState({}) // { userId: newRole }

    // ── Teachers tab state ────────────────────────────────────────────────────
    const [newTeacher,   setNewTeacher]   = useState({ firstName: '', secondName: '', email: '' })
    const [linkingId,    setLinkingId]    = useState(null)   // teacherId being linked
    const [linkUserId,   setLinkUserId]   = useState('')

    // ── Assignments tab state ─────────────────────────────────────────────────
    const [selectedTeacher,  setSelectedTeacher]  = useState('')
    const [assignments,      setAssignments]      = useState([])
    const [newAssignment,    setNewAssignment]     = useState({ subjectId: '', classId: '' })

    // ── Periods tab state ─────────────────────────────────────────────────────
    const [newPeriod, setNewPeriod] = useState({
        year: new Date().getFullYear(), term: 1,
        startDate: '', endDate: '', current: false
    })

    // ── Load all data on mount ────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            getAllUsers(), getAllTeachers(), getAllSubjects(),
            getAllClasses(), getAllPeriods()
        ])
        .then(([u, t, s, c, p]) => {
            setUsers(u); setTeachers(t); setSubjects(s)
            setClasses(c); setPeriods(p)
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }, [])

    // ── Load assignments when teacher selected ────────────────────────────────
    useEffect(() => {
        if (!selectedTeacher) { setAssignments([]); return }
        getTeacherAssignments(selectedTeacher)
            .then(setAssignments)
            .catch(() => setAssignments([]))
    }, [selectedTeacher])

    // ── Flash success message ─────────────────────────────────────────────────
    const flash = (msg) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(null), 3000)
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleSaveRole = async (userId) => {
        const role = roleChanges[userId]
        if (!role) return
        try {
            await updateRole(userId, role)
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
            setRoleChanges(prev => { const n = { ...prev }; delete n[userId]; return n })
            flash('Role updated successfully')
        } catch (e) { setError(e.message) }
    }

    const handleAddTeacher = async () => {
        if (!newTeacher.firstName || !newTeacher.secondName || !newTeacher.email) {
            setError('Please fill all teacher fields'); return
        }
        try {
            const created = await addTeacher(newTeacher)
            setTeachers(prev => [...prev, created])
            setNewTeacher({ firstName: '', secondName: '', email: '' })
            flash('Teacher added successfully')
        } catch (e) { setError(e.message) }
    }

    const handleDeleteTeacher = async (id) => {
        if (!window.confirm('Delete this teacher?')) return
        try {
            await deleteTeacher(id)
            setTeachers(prev => prev.filter(t => t.id !== id))
            flash('Teacher deleted')
        } catch (e) { setError(e.message) }
    }

    const handleLinkUser = async () => {
        if (!linkUserId) return
        try {
            const updated = await linkUserToTeacher(linkingId, Number(linkUserId))
            setTeachers(prev => prev.map(t => t.id === linkingId ? updated : t))
            setLinkingId(null); setLinkUserId('')
            flash('User linked to teacher')
        } catch (e) { setError(e.message) }
    }

    const handleAddAssignment = async () => {
        if (!newAssignment.subjectId || !newAssignment.classId) {
            setError('Select both subject and class'); return
        }
        try {
            await addTeacherAssignment(selectedTeacher, {
                subjectId: Number(newAssignment.subjectId),
                classId:   Number(newAssignment.classId)
            })
            const updated = await getTeacherAssignments(selectedTeacher)
            setAssignments(updated)
            setNewAssignment({ subjectId: '', classId: '' })
            flash('Assignment added')
        } catch (e) { setError(e.message) }
    }

    const handleDeleteAssignment = async (assignmentId) => {
        try {
            await deleteTeacherAssignment(assignmentId)
            setAssignments(prev => prev.filter(a => a.id !== assignmentId))
            flash('Assignment removed')
        } catch (e) { setError(e.message) }
    }

    const handleCreatePeriod = async () => {
        if (!newPeriod.startDate || !newPeriod.endDate) {
            setError('Please fill all period fields'); return
        }
        try {
            await createPeriod(newPeriod)
            const updated = await getAllPeriods()
            setPeriods(updated)
            setNewPeriod({ year: new Date().getFullYear(), term: 1, startDate: '', endDate: '', current: false })
            flash('Period created')
        } catch (e) { setError(e.message) }
    }

    const handleSetCurrent = async (id) => {
        try {
            await setCurrentPeriod(id)
            const updated = await getAllPeriods()
            setPeriods(updated)
            flash('Active period updated')
        } catch (e) { setError(e.message) }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading…</p>
        </div>
    )

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Shield size={24} className="text-blue-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                    <p className="text-gray-500 text-sm">Manage users, teachers, assignments and academic periods</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <UserMessage message={error} onDismiss={() => setError(null)} />
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> {success}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ TAB: USERS & ROLES ══ */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['ID', 'Username', 'Current Role', 'Change Role', 'Save'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 text-xs text-gray-400">#{u.id}</td>
                                    <td className="px-5 py-3 font-medium text-gray-800">{u.username}</td>
                                    <td className="px-5 py-3">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <select
                                            value={roleChanges[u.id] ?? u.role}
                                            onChange={e => setRoleChanges(prev => ({ ...prev, [u.id]: e.target.value }))}
                                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-5 py-3">
                                        {roleChanges[u.id] && roleChanges[u.id] !== u.role && (
                                            <button
                                                onClick={() => handleSaveRole(u.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                                            >
                                                <Save size={12} /> Save
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ══ TAB: TEACHERS ══ */}
            {activeTab === 'teachers' && (
                <div className="space-y-6">

                    {/* Add Teacher form */}
                    <div className="bg-white rounded-xl border p-5">
                        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-blue-600" /> Add New Teacher
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                placeholder="First name"
                                value={newTeacher.firstName}
                                onChange={e => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                placeholder="Second name"
                                value={newTeacher.secondName}
                                onChange={e => setNewTeacher({ ...newTeacher, secondName: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                placeholder="Email"
                                value={newTeacher.email}
                                onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleAddTeacher}
                            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={15} /> Add Teacher
                        </button>
                    </div>

                    {/* Teachers list */}
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Name', 'Email', 'Linked User', 'Link User', 'Delete'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {teachers.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 font-medium text-gray-800">
                                            {t.firstName} {t.secondName}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{t.email}</td>
                                        <td className="px-5 py-3">
                                            {t.user
                                                ? <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{t.user.username}</span>
                                                : <span className="text-xs text-gray-400">Not linked</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3">
                                            {linkingId === t.id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={linkUserId}
                                                        onChange={e => setLinkUserId(e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="">Select user</option>
                                                        {users.filter(u => !teachers.some(t2 => t2.user?.id === u.id)).map(u => (
                                                            <option key={u.id} value={u.id}>{u.username}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={handleLinkUser} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Link</button>
                                                    <button onClick={() => { setLinkingId(null); setLinkUserId('') }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setLinkingId(t.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    <Link size={12} /> Link User
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => handleDeleteTeacher(t.id)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && (
                                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No teachers yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══ TAB: ASSIGNMENTS ══ */}
            {activeTab === 'assignments' && (
                <div className="space-y-6">

                    {/* Teacher selector */}
                    <div className="bg-white rounded-xl border p-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                        <select
                            value={selectedTeacher}
                            onChange={e => setSelectedTeacher(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm"
                        >
                            <option value="">— Choose a teacher —</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.firstName} {t.secondName}</option>
                            ))}
                        </select>
                    </div>

                    {selectedTeacher && (
                        <>
                            {/* Add assignment */}
                            <div className="bg-white rounded-xl border p-5">
                                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Plus size={16} className="text-blue-600" /> Add Assignment
                                </h2>
                                <div className="flex gap-4 flex-wrap">
                                    <select
                                        value={newAssignment.subjectId}
                                        onChange={e => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={newAssignment.classId}
                                        onChange={e => setNewAssignment({ ...newAssignment, classId: e.target.value })}
                                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.classId} value={c.classId}>{c.className}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAddAssignment}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus size={15} /> Assign
                                    </button>
                                </div>
                            </div>

                            {/* Assignments list */}
                            <div className="bg-white rounded-xl border overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {['Subject', 'Class', 'Remove'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignments.map(a => (
                                            <tr key={a.id} className="hover:bg-gray-50">
                                                <td className="px-5 py-3 text-sm font-medium text-gray-800">{a.subjectName}</td>
                                                <td className="px-5 py-3 text-sm text-gray-600">{a.className}</td>
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => handleDeleteAssignment(a.id)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                                                    >
                                                        <Trash2 size={12} /> Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {assignments.length === 0 && (
                                            <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">No assignments yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══ TAB: PERIODS ══ */}
            {activeTab === 'periods' && (
                <div className="space-y-6">

                    {/* Create period form */}
                    <div className="bg-white rounded-xl border p-5">
                        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-blue-600" /> Create Academic Period
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Year</label>
                                <input
                                    type="number"
                                    value={newPeriod.year}
                                    onChange={e => setNewPeriod({ ...newPeriod, year: Number(e.target.value) })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Term</label>
                                <select
                                    value={newPeriod.term}
                                    onChange={e => setNewPeriod({ ...newPeriod, term: Number(e.target.value) })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>Term 1</option>
                                    <option value={2}>Term 2</option>
                                    <option value={3}>Term 3</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={newPeriod.startDate}
                                    onChange={e => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={newPeriod.endDate}
                                    onChange={e => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newPeriod.current}
                                    onChange={e => setNewPeriod({ ...newPeriod, current: e.target.checked })}
                                />
                                Set as current period
                            </label>
                            <button
                                onClick={handleCreatePeriod}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={15} /> Create Period
                            </button>
                        </div>
                    </div>

                    {/* Periods list */}
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Period', 'Dates', 'Status', 'Action'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {periods.map(p => (
                                    <tr key={p.id} className={p.current ? 'bg-green-50' : 'hover:bg-gray-50'}>
                                        <td className="px-5 py-3 font-medium text-gray-800">
                                            {p.year} · Term {p.term}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-500">
                                            {p.startDate} → {p.endDate}
                                        </td>
                                        <td className="px-5 py-3">
                                            {p.status === 'CLOSED'
                                                ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">Closed</span>
                                                : p.current
                                                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Active (current)</span>
                                                    : <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">Active</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3">
                                            {!p.current && p.status !== 'CLOSED' && (
                                                <button
                                                    onClick={() => handleSetCurrent(p.id)}
                                                    className="px-3 py-1.5 text-xs border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                                                >
                                                    Set as Current
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {periods.length === 0 && (
                                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No periods yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    )
}