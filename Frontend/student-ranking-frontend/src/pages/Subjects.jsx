// src/components/Subjects.jsx
import React, { useEffect, useState } from "react";
import {
  getAllSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
} from "../services/api";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);

  const [addingSubject, setAddingSubject] = useState({
    subjectName: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    subjectName: "",
  });

  // ---------- LOAD SUBJECTS ----------
  const loadSubjects = async () => {
    try {
      const data = await getAllSubjects();
      setSubjects(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  // ---------- ADD SUBJECT ----------
  const handleAddChange = (e) => {
    setAddingSubject({
      ...addingSubject,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await addSubject(addingSubject);
      setAddingSubject({ subjectName: "" });
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- DELETE SUBJECT ----------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await deleteSubject(id);
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- EDIT SUBJECT ----------
  const startEdit = (subject) => {
    setEditingId(subject.subjectId);
    setEditData({
      subjectName: subject.subjectName,
    });
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const saveEdit = async (id) => {
    try {
      await updateSubject(id, editData);
      setEditingId(null);
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subjects Management</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* ---------- ADD SUBJECT FORM ---------- */}
      <form
        onSubmit={handleAddSubject}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        <input
          name="subjectName"
          placeholder="Subject Name"
          value={addingSubject.subjectName}
          onChange={handleAddChange}
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2"
        >
          Add Subject
        </button>
      </form>

      {/* ---------- SUBJECTS TABLE ---------- */}
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Subject Name</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.subjectId}>
              <td className="border p-2">{subject.subjectId}</td>

              {editingId === subject.subjectId ? (
                <>
                  <td className="border p-2">
                    <input
                      name="subjectName"
                      value={editData.subjectName}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-full"
                    />
                  </td>
                  <td className="border p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => saveEdit(subject.subjectId)}
                      className="text-green-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border p-2">{subject.subjectName}</td>
                  <td className="border p-2 flex justify-center gap-2">
                    <button
                      onClick={() => startEdit(subject)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subject.subjectId)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}

          {subjects.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center p-4 text-gray-500">
                No subjects found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Subjects;