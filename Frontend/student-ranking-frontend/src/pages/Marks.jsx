import React, { useState, useEffect } from "react";
import { getAllStudents, getAllSubjects, addMarksBatch } from "../services/api";

const Marks = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [marks, setMarks] = useState({}); // { studentId: marksValue }

  // Fetch students and subjects on mount
  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch((err) => console.error("Failed to fetch students:", err));

    getAllSubjects()
      .then(setSubjects)
      .catch((err) => console.error("Failed to fetch subjects:", err));
  }, []);

  // Handle marks input change
  const handleMarksChange = (studentId, value) => {
    setMarks((prev) => ({ ...prev, [studentId]: Number(value) }));
  };

  // Submit batch marks
  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      alert("Please select a subject");
      return;
    }

    const payload = {
      subjectId: Number(selectedSubjectId),
      marks: students.map((s) => ({
        studentId: s.id,
        marksValue: marks[s.id] || 0,
      })),
    };

    try {
      const res = await addMarksBatch(payload);
      console.log("Marks added successfully:", res);
      alert("Marks added successfully!");
      setMarks({}); // reset input fields
    } catch (err) {
      console.error("Failed to add marks:", err);
      alert("Failed to add marks. See console for details.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Marks</h1>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Subject:</label>
        <select
          className="border rounded px-2 py-1"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {subjects.map((sub) => (
            <option key={sub.subjectId} value={sub.subjectId}>
              {sub.subjectName}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Student</th>
            <th className="border px-2 py-1">Form</th>
            <th className="border px-2 py-1">Marks</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td className="border px-2 py-1">{s.firstName} {s.secondName}</td>
              <td className="border px-2 py-1">{s.form}</td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="border rounded px-1 py-1 w-20"
                  value={marks[s.id] || ""}
                  onChange={(e) => handleMarksChange(s.id, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleSubmit}
      >
        Submit Marks
      </button>
    </div>
  );
};

export default Marks;
