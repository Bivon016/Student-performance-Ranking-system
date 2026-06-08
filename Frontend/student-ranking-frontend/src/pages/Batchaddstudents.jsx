import React, { useState, useEffect } from "react";
import { addStudentsBatch, getAllClasses } from "../services/api";
import { Plus, Trash2, CheckCircle, X, UserPlus } from "lucide-react";
import { UserMessage } from "../components/UserMessage";
import { getFriendlyError } from "../utils/errorMessages";

const GENDERS = ["Male", "Female"];

const emptyRow = () => ({
  id:         Math.random().toString(36).slice(2),
  firstName:  "",
  secondName: "",
  gender:     "Male",
});

const BatchAddStudents = ({ onClose, onSuccess }) => {
  const [rows,       setRows]       = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [classes,    setClasses]    = useState([]);
  const [classId,    setClassId]    = useState("");          // ← single class for all
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [errors,     setErrors]     = useState({});          // rowId → field → msg
  const [classError, setClassError] = useState("");
  const [apiError,   setApiError]   = useState("");

  useEffect(() => {
    getAllClasses()
      .then(setClasses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedClass = classes.find((c) => String(c.classId) === classId);

  // ── Row helpers ───────────────────────────────────────────────────────────
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (id) =>
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    setErrors((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id][field];
      return copy;
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    let valid = true;

    if (!classId) {
      setClassError("Please select a class before adding students.");
      valid = false;
    } else {
      setClassError("");
    }

    const newErrors = {};
    rows.forEach((r) => {
      const rowErr = {};
      if (!r.firstName.trim())  rowErr.firstName  = "Required";
      if (!r.secondName.trim()) rowErr.secondName = "Required";
      if (Object.keys(rowErr).length) newErrors[r.id] = rowErr;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length) valid = false;

    return valid;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");
    try {
      const payload = rows.map(({ firstName, secondName, gender }) => ({
        firstName,
        secondName,
        gender,
        classId: Number(classId),
      }));
      await addStudentsBatch(payload);
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setApiError(getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cellClass = (rowId, field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[rowId]?.[field] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
    }`;

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">
            {rows.length} Student{rows.length > 1 ? "s" : ""} Added!
          </h2>
          <p className="text-gray-500 text-sm">
            All students were added to <strong>{selectedClass?.className}</strong>.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              Done
            </button>
            <button onClick={() => { setRows([emptyRow(), emptyRow(), emptyRow()]); setClassId(""); setSubmitted(false); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              Add More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main modal ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Add Multiple Students</h2>
              <p className="text-xs text-gray-500">
                {rows.length} student{rows.length > 1 ? "s" : ""} · {selectedClass ? selectedClass.className : "no class selected"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Class selector — top, applies to all students */}
        <div className="px-6 pt-5 pb-4 border-b bg-gray-50 shrink-0">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Class <span className="text-red-500">*</span>
            <span className="ml-2 text-xs font-normal text-gray-400">
              — all students below will be added to this class
            </span>
          </label>
          {loading ? (
            <p className="text-sm text-gray-400">Loading classes…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.classId}
                  onClick={() => { setClassId(String(c.classId)); setClassError(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    classId === String(c.classId)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}>
                  {c.className}
                </button>
              ))}
            </div>
          )}
          {classError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />{classError}
            </p>
          )}
        </div>

        {/* Student rows */}
        <div className="overflow-auto flex-1 px-6 py-4">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-3 w-6">#</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-3">First Name *</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-3">Second Name *</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-3">Gender</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <tr key={row.id} className="group">

                  {/* Row number */}
                  <td className="py-2 pr-3 text-xs text-gray-400 font-medium align-top pt-3">
                    {idx + 1}
                  </td>

                  {/* First name */}
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="First name"
                      value={row.firstName}
                      onChange={(e) => updateRow(row.id, "firstName", e.target.value)}
                      className={cellClass(row.id, "firstName")}
                    />
                    {errors[row.id]?.firstName && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[row.id].firstName}</p>
                    )}
                  </td>

                  {/* Second name */}
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      placeholder="Second name"
                      value={row.secondName}
                      onChange={(e) => updateRow(row.id, "secondName", e.target.value)}
                      className={cellClass(row.id, "secondName")}
                    />
                    {errors[row.id]?.secondName && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[row.id].secondName}</p>
                    )}
                  </td>

                  {/* Gender */}
                  <td className="py-2 pr-3">
                    <select
                      value={row.gender}
                      onChange={(e) => updateRow(row.id, "gender", e.target.value)}
                      className={cellClass(row.id, "gender")}>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </td>

                  {/* Delete row */}
                  <td className="py-2 align-top pt-2.5">
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-0 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 space-y-3">

          {apiError && (
            <UserMessage message={apiError} onDismiss={() => setApiError("")} />
          )}

          <div className="flex items-center justify-between">
            <button onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-colors">
              <Plus size={16} />Add Row
            </button>

            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium">
                <CheckCircle size={16} />
                {submitting
                  ? "Saving…"
                  : `Add ${rows.length} Student${rows.length > 1 ? "s" : ""}${selectedClass ? ` to ${selectedClass.className}` : ""}`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BatchAddStudents;