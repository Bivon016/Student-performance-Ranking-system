import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAllStudents,
  getAllSubjects,
  addMarksBatch,
  getMarksBySubject,
  updateMarks,
  deleteMarks,
} from "../services/api";

const Marks = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname.includes("/marks/add")) return "add";
    if (location.pathname.includes("/marks/view")) return "view";
    if (location.pathname.includes("/marks/edit")) return "edit";
    return "add";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [marks, setMarks] = useState({});
  const [existingMarks, setExistingMarks] = useState([]); // marks already in DB for selected subject+form
  const [viewMarks, setViewMarks] = useState([]);
  const [editingMarkId, setEditingMarkId] = useState(null);
  const [editedValue, setEditedValue] = useState("");

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  useEffect(() => {
    Promise.all([getAllStudents(), getAllSubjects()])
      .then(([studentData, subjectData]) => {
        setStudents(studentData);
        setSubjects(subjectData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Whenever subject or form changes on the Add tab, fetch existing marks to highlight them
  useEffect(() => {
    if (activeTab !== "add" || !selectedSubjectId || !selectedForm) {
      setExistingMarks([]);
      return;
    }

    getMarksBySubject(selectedSubjectId)
      .then((data) => {
        // Cross-reference with students to filter by form
        const forThisForm = data.filter((m) => {
          const student = students.find((s) => s.id === m.studentId);
          return student?.form === Number(selectedForm);
        });
        setExistingMarks(forThisForm);
      })
      .catch(console.error);
  }, [selectedSubjectId, selectedForm, activeTab]);

  // Derived from students array — no hardcoding
  const availableForms = [...new Set(students.map((s) => s.form).filter(Boolean))].sort();

  // Filter students by selected form
  const filteredStudents = selectedForm
    ? students.filter((s) => s.form === Number(selectedForm))
    : [];

  // Helper — check if a student already has a mark for the selected subject
  const getExistingMark = (studentId) =>
    existingMarks.find((m) => m.studentId === studentId);

  // ================= ADD LOGIC =================
  const handleMarksChange = (studentId, value) => {
    setMarks((prev) => ({ ...prev, [studentId]: Number(value) }));
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId) return alert("Please select a subject.");
    if (!selectedForm) return alert("Please select a form.");

    // Only submit students who do NOT already have marks
    const studentsWithoutMarks = filteredStudents.filter((s) => !getExistingMark(s.id));
    if (studentsWithoutMarks.length === 0) return alert("All students in this form already have marks for this subject.");

    const payload = {
      subjectId: Number(selectedSubjectId),
      marks: studentsWithoutMarks.map((s) => ({
        studentId: s.id,
        marksValue: marks[s.id] || 0,
      })),
    };

    try {
      await addMarksBatch(payload);
      alert("Marks added successfully!");
      setMarks({});
      // Refresh existing marks after submission
      const updated = await getMarksBySubject(selectedSubjectId);
      const forThisForm = updated.filter((m) => {
        const student = students.find((s) => s.id === m.studentId);
        return student?.form === Number(selectedForm);
      });
      setExistingMarks(forThisForm);
    } catch (err) {
      console.error(err);
      alert("Failed to add marks. Please try again.");
    }
  };

  // ================= VIEW / EDIT LOGIC =================
  const handleViewMarks = async () => {
    if (!selectedSubjectId) return alert("Please select a subject.");
    if (!selectedForm) return alert("Please select a form.");

    try {
      const data = await getMarksBySubject(selectedSubjectId);

      const marksWithForm = data.map((m) => {
        const student = students.find((s) => s.id === m.studentId);
        return { ...m, form: student?.form ?? null };
      });

      const filtered = marksWithForm.filter((m) => m.form === Number(selectedForm));

      setViewMarks(filtered);
      setActiveTab("view");
      navigate("/marks/view");
    } catch (err) {
      console.error(err);
      alert("Failed to load marks. Please try again.");
    }
  };

  const startEditing = (mark) => {
    setEditingMarkId(mark.marksId);
    setEditedValue(mark.marksValue);
    setActiveTab("edit");
    navigate("/marks/edit");
  };

  const handleUpdate = async () => {
    try {
      await updateMarks(editingMarkId, editedValue);
      alert("Marks updated successfully!");
      setEditingMarkId(null);
      setEditedValue("");
      handleViewMarks();
    } catch (err) {
      console.error(err);
      alert("Failed to update marks. Please try again.");
    }
  };

  const handleDelete = async (markId) => {
    if (!window.confirm("Are you sure you want to delete this mark?")) return;
    try {
      await deleteMarks(markId);
      handleViewMarks();
    } catch (err) {
      console.error(err);
      alert("Failed to delete mark. Please try again.");
    }
  };

  // ================= UI =================
  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">

      {/* FILTERS ROW */}
      <div className="mb-6 flex flex-wrap gap-6 items-end">

        <div>
          <label className="block font-semibold mb-1">Select Subject:</label>
          <select
            className="border rounded px-2 py-1 min-w-[160px]"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((sub) => (
              <option key={sub.subjectId} value={sub.subjectId}>
                {sub.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Select Form:</label>
          <select
            className="border rounded px-2 py-1 min-w-[160px]"
            value={selectedForm}
            onChange={(e) => {
              setSelectedForm(e.target.value);
              setMarks({});
            }}
          >
            <option value="">-- Select Form --</option>
            {availableForms.map((form) => (
              <option key={form} value={form}>
                Form {form}
              </option>
            ))}
          </select>
        </div>

        {(activeTab === "view" || activeTab === "edit") && (
          <button
            onClick={handleViewMarks}
            className="bg-gray-800 text-white px-3 py-1 rounded self-end hover:bg-gray-900"
          >
            Load Marks
          </button>
        )}
      </div>

      {/* ===== ADD TAB ===== */}
      {activeTab === "add" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Add Marks</h2>

          {!selectedSubjectId || !selectedForm ? (
            <p className="text-gray-500">
              Please select both a subject and a form above to load students.
            </p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500">No students found for the selected form.</p>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-3 text-sm">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded bg-green-100 border border-green-300"></span>
                  Marks already added
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded bg-white border border-gray-300"></span>
                  Pending
                </span>
              </div>

              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1 text-left">Student</th>
                    <th className="border px-2 py-1 text-left">Form</th>
                    <th className="border px-2 py-1 text-left">Marks</th>
                    <th className="border px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const existing = getExistingMark(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={existing ? "bg-green-50" : "bg-white"}
                      >
                        <td className="border px-2 py-1">{s.firstName} {s.secondName}</td>
                        <td className="border px-2 py-1">Form {s.form}</td>
                        <td className="border px-2 py-1">
                          {existing ? (
                            <span className="font-semibold text-green-700">
                              {existing.marksValue}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              className="border rounded px-1 py-1 w-24"
                              value={marks[s.id] ?? ""}
                              onChange={(e) => handleMarksChange(s.id, e.target.value)}
                            />
                          )}
                        </td>
                        <td className="border px-2 py-1 text-sm">
                          {existing ? (
                            <span className="text-green-600 font-medium">✓ Added</span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Only show submit if there are students without marks */}
              {filteredStudents.some((s) => !getExistingMark(s.id)) && (
                <button
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={handleSubmit}
                >
                  Submit Marks
                </button>
              )}

              {/* All done message */}
              {filteredStudents.every((s) => getExistingMark(s.id)) && (
                <p className="mt-4 text-green-600 font-medium">
                  ✓ All students in this form have marks for the selected subject.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== VIEW TAB ===== */}
      {activeTab === "view" && (
        <div>
          <h2 className="text-xl font-bold mb-4">View Marks</h2>

          {viewMarks.length === 0 ? (
            <p className="text-gray-500">
              No marks found. Select a subject and form, then click Load Marks.
            </p>
          ) : (
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">Student</th>
                  <th className="border px-2 py-1 text-left">Form</th>
                  <th className="border px-2 py-1 text-left">Marks</th>
                  <th className="border px-2 py-1 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {viewMarks.map((m) => (
                  <tr key={m.marksId}>
                    <td className="border px-2 py-1">{m.studentName}</td>
                    <td className="border px-2 py-1">Form {m.form}</td>
                    <td className="border px-2 py-1">{m.marksValue}</td>
                    <td className="border px-2 py-1">
                      <button
                        onClick={() => startEditing(m)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.marksId)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== EDIT TAB ===== */}
      {activeTab === "edit" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Edit Marks</h2>
          <input
            type="number"
            min="0"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className="border rounded px-2 py-1 mr-3 w-24"
          />
          <button
            onClick={handleUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Update
          </button>
        </div>
      )}
    </div>
  );
};

export default Marks;