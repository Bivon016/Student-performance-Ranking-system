import React, { useState, useEffect } from "react";
import {
  X, BookOpen, Lock, Unlock, CheckCircle, AlertTriangle,
  Layers, Save, Loader2, Trash2,
} from "lucide-react";
import { useEnrollment } from "../hooks/useEnrollment";
import { UserMessage } from "./UserMessage";

export default function EnrollmentModal({ student, onClose, onSaved }) {
  const {
    compulsorySubjects, subjectsByGroup,
    enrollment, loading, saving, error, setError,
    enroll, removeSubject,
  } = useEnrollment(student?.id);

  // optionalChoices: groupName → Set of selected subjectIds
  const [optionalChoices, setOptionalChoices] = useState({});
  const [warnings,        setWarnings]        = useState([]);
  const [saved,           setSaved]           = useState(false);

  // Pre-fill choices from existing enrollment
  useEffect(() => {
    if (!enrollment) return;
    const preselected = {};
    enrollment.enrolledSubjects.forEach((s) => {
      if (s.subjectType === "OPTIONAL" && s.optionalGroup) {
        if (!preselected[s.optionalGroup]) preselected[s.optionalGroup] = new Set();
        preselected[s.optionalGroup].add(s.subjectId);
      }
    });
    setOptionalChoices(preselected);
  }, [enrollment]);

const toggleSubject = (groupId, subjectId, maxChoices) => {
  setOptionalChoices((prev) => {
    const current = new Set(prev[groupId] ?? []);

    const exists = current.has(subjectId);

    if (exists) {
      current.delete(subjectId);
    } else {
      if (current.size >= maxChoices) {
        const first = current.values().next().value;
        current.delete(first);
      }
      current.add(subjectId);
    }

    return {
      ...prev,
      [groupId]: current,
    };
  });
};
const handleSave = async () => {
  setError(null);

  const payload = {};
  for (const [group, ids] of Object.entries(optionalChoices)) {
    payload[group] = [...ids];
  }

  try {
    const result = await enroll(student.id, payload);

    setWarnings(result.warnings ?? []);
    setSaved(true);

    // 🔥 CRITICAL FIX: sync frontend immediately
    const synced = {};

    (result.enrolledSubjects || []).forEach((s) => {
      if (s.subjectType === "OPTIONAL" && s.optionalGroup) {
        if (!synced[s.optionalGroup]) synced[s.optionalGroup] = new Set();
        synced[s.optionalGroup].add(s.subjectId);
      }
    });

    setOptionalChoices(synced);

    onSaved?.(result);
  } catch {
    // error already handled in hook
  }
};
  const handleRemove = async (subjectId) => {
    await removeSubject(student.id, subjectId);
  };

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Subject Enrollment</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.firstName} {student.secondName}
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                ID #{student.id}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
              <span>Loading subjects…</span>
            </div>
          )}

          {!loading && (
            <>
              {error && (
                <UserMessage message={error} onDismiss={() => setError(null)} />
              )}

              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700 flex items-start gap-2">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Compulsory subjects — read only */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={15} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Compulsory Subjects
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    Auto-enrolled
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {compulsorySubjects.map((s) => (
                    <div
                      key={s.subjectId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-800"
                    >
                      <BookOpen size={12} />
                      {s.subjectName}
                    </div>
                  ))}
                  {compulsorySubjects.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No compulsory subjects defined</p>
                  )}
                </div>
              </div>

              {/* Optional subject groups */}
              {subjectsByGroup.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Unlock size={15} className="text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Optional Subjects
                    </h3>
                  </div>

                  {subjectsByGroup.map((group) => {
                    const chosen   = optionalChoices[group.groupName] ?? new Set();
                    const max      = group.maxChoices ?? 1;
                    const min      = group.minChoices ?? 1;
                    const metMin   = chosen.size >= min;

                    return (
                      <div key={group.id} className="border rounded-xl p-4">
                        {/* Group header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Layers size={15} className="text-amber-500" />
                            <span className="font-semibold text-gray-800">{group.groupName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              metMin
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {chosen.size}/{max} selected
                            </span>
                            <span className="text-xs text-gray-400">
                              (min {min}, max {max})
                            </span>
                          </div>
                        </div>

                        {/* Subject buttons */}
                        {group.subjects.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No subjects in this group yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {group.subjects.map((s) => {
                              const isSelected = chosen.has(s.subjectId);
                              return (
                                <button
                                  key={s.subjectId}
                                  onClick={() => toggleSubject(group.groupName, s.subjectId, max)}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                    isSelected
                                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                                      : "border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50"
                                  }`}
                                >
                                  {isSelected && <CheckCircle size={13} />}
                                  {s.subjectName}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Current enrollment — quick view + remove optional */}
              {enrollment && enrollment.enrolledSubjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={15} className="text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Currently Enrolled ({enrollment.enrolledSubjects.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {enrollment.enrolledSubjects.map((s) => (
                      <div
                        key={s.subjectId}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          s.subjectType === "COMPULSORY"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        {s.subjectName}
                        {s.subjectType === "OPTIONAL" && (
                          <button
                            onClick={() => handleRemove(s.subjectId)}
                            className="ml-1 text-amber-500 hover:text-red-600 transition-colors"
                            title="Remove subject"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50 rounded-b-2xl">
            {saved ? (
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                <CheckCircle size={16} /> Enrollment saved successfully
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Compulsory subjects are auto-enrolled. Choose optional subjects above.
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
              >
                {saved ? "Close" : "Cancel"}
              </button>
              {!saved && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-semibold"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Saving…" : "Save Enrollment"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}