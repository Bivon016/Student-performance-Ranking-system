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
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [editName, setEditName] = useState("");

  // Fetch subjects on mount
  const fetchSubjects = async () => {
    try {
      const data = await getAllSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Add a new subject
  const handleAdd = async () => {
    if (!newSubjectName.trim()) return;
    try {
      await addSubject({ subjectName: newSubjectName });
      setNewSubjectName("");
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  // Start editing
  const startEdit = (subject) => {
    setEditingSubject(subject);
    setEditName(subject.subjectName);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingSubject(null);
    setEditName("");
  };

  // Save edit
  const handleUpdate = async () => {
    if (!editName.trim()) return;
    try {
      await updateSubject(editingSubject.subjectId, { subjectName: editName });
      cancelEdit();
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete subject
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(id);
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Subjects</h1>

      {/* Add Subject */}
      <div className="flex mb-6 space-x-2">
        <input
          type="text"
          placeholder="Enter new subject name"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          className="border rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Subject
        </button>
      </div>

      {/* Subjects Table */}
      <table className="min-w-full bg-white border rounded shadow">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.subjectId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{subject.subjectId}</td>
              <td className="px-4 py-2 border">
                {editingSubject?.subjectId === subject.subjectId ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  subject.subjectName
                )}
              </td>
              <td className="px-4 py-2 border space-x-2">
                {editingSubject?.subjectId === subject.subjectId ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(subject)}
                      className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subject.subjectId)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {subjects.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center px-4 py-4 text-gray-500">
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
