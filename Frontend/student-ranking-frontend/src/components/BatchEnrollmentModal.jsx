import React, { useState, useEffect } from "react";
import {
  X, BookOpen, CheckCircle, AlertTriangle, Loader2, Users, Layers,
} from "lucide-react";
import { getAllSubjects, batchEnrollSubjects } from "../services/api";
import { UserMessage } from "./UserMessage";

/**
 * Enroll many already-selected students into one or more subjects at once.
 * Additive only — never removes existing enrollments (see EnrollmentModal
 * for the per-student "replace all" flow used at initial admission).
 */
export default function BatchEnrollmentModal({ students, onClose, onSaved }) {
  const [subjects,        setSubjects]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
  const [result,          setResult]          = useState(null); // { enrolledCount, skipped }

  useEffect(() => {
    getAllSubjects()
      .then(setSubjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      next.has(subjectId) ? next.delete(subjectId) : next.add(subjectId);
      return next;
    });
  };

  const compulsory = subjects.filter((s) => s.subjectType === "COMPULSORY");
  const optionalByGroup = subjects
    .filter((s) => s.subjectType === "OPTIONAL")
    .reduce((acc, s) => {
      const group = s.optionalGroup || "Ungrouped";
      (acc[group] ||= []).push(s);
      return acc;
    }, {});

  const handleEnroll = async () => {
    if (selectedSubjectIds.size === 0) {
      setError("Select at least one subject.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await batchEnrollSubjects({
        studentIds: students.map((s) => s.id),
        subjectIds: Array.from(selectedSubjectIds),
      });
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">Batch Enroll into Subject(s)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 bg-blue-50
            border border-blue-100 rounded-xl px-3 py-2">
            <Users size={14} className="text-blue-500 shrink-0" />
            <span>
              Enrolling <strong>{students.length}</strong> student{students.length === 1 ? "" : "s"}:{" "}
              {students.slice(0, 3).map((s) => `${s.firstName} ${s.secondName}`).join(", ")}
              {students.length > 3 && ` +${students.length - 3} more`}
            </span>
          </div>

          {error && (
            <div className="mb-3">
              <UserMessage type="error" message={error} />
            </div>
          )}

          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50
                border border-emerald-100 rounded-xl px-3 py-2 text-sm font-semibold">
                <CheckCircle size={16} />
                {result.enrolledCount} new enrollment{result.enrolledCount === 1 ? "" : "s"} created
              </div>
              {result.skipped?.length > 0 && (
                <div className="text-sm">
                  <div className="flex items-center gap-1.5 text-amber-600 font-semibold mb-1">
                    <AlertTriangle size={14} /> Skipped ({result.skipped.length})
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1 max-h-40 overflow-y-auto
                    bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {result.skipped.map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : (
            <div className="space-y-5">
              {compulsory.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Compulsory
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {compulsory.map((s) => (
                      <label key={s.subjectId}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border
                          border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
                        <input type="checkbox"
                          checked={selectedSubjectIds.has(s.subjectId)}
                          onChange={() => toggleSubject(s.subjectId)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                        {s.subjectName}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(optionalByGroup).map(([group, subs]) => (
                <div key={group}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400
                    uppercase tracking-wider mb-2">
                    <Layers size={12} /> {group}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {subs.map((s) => (
                      <label key={s.subjectId}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border
                          border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
                        <input type="checkbox"
                          checked={selectedSubjectIds.has(s.subjectId)}
                          onChange={() => toggleSubject(s.subjectId)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                        {s.subjectName}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {subjects.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No subjects found.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {result ? (
            <button onClick={onSaved}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white
                hover:bg-blue-700 transition-colors">
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500
                  hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleEnroll} disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  bg-amber-500 text-white hover:bg-amber-600 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed">
                {saving && <Loader2 className="animate-spin" size={14} />}
                Enroll {students.length} Student{students.length === 1 ? "" : "s"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
