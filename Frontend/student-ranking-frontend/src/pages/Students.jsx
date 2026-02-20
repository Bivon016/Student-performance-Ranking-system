import React, { useEffect, useState } from "react";
import { getAllStudents, addStudent, deleteStudent, updateStudent } from "../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  const [addingStudent, setAddingStudent] = useState({
    firstName: "",
    secondName: "",
    form: "",
    gender: "Male",
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    firstName: "",
    secondName: "",
    form: "",
    gender: "Male",
  });

  // ---------- LOAD STUDENTS ----------
  const loadStudents = async () => {
    try {
      const data = await getAllStudents(); // uses apiFetch, so JWT is included
      setStudents(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // ---------- ADD STUDENT ----------
  const handleAddChange = (e) => {
    setAddingStudent({ ...addingStudent, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await addStudent({ ...addingStudent, form: Number(addingStudent.form) });
      setAddingStudent({ firstName: "", secondName: "", form: "", gender: "Male" });
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- DELETE STUDENT ----------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteStudent(id);
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- EDIT STUDENT ----------
  const startEdit = (student) => {
    setEditingId(student.id);
    setEditData({
      firstName: student.firstName,
      secondName: student.secondName,
      form: student.form,
      gender: student.gender,
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    try {
      await updateStudent(id, { ...editData, form: Number(editData.form) });
      setEditingId(null);
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Students Management</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* ---------- ADD STUDENT FORM ---------- */}
      <form
        onSubmit={handleAddStudent}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <input
          name="firstName"
          placeholder="First Name"
          value={addingStudent.firstName}
          onChange={handleAddChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="secondName"
          placeholder="Second Name"
          value={addingStudent.secondName}
          onChange={handleAddChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="form"
          type="number"
          placeholder="Form"
          value={addingStudent.form}
          onChange={handleAddChange}
          className="border p-2 rounded"
          required
        />
        <select
          name="gender"
          value={addingStudent.gender}
          onChange={handleAddChange}
          className="border p-2 rounded"
        >
          <option>Male</option>
          <option>Female</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-4"
        >
          Add Student
        </button>
      </form>

      {/* ---------- STUDENTS TABLE ---------- */}
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Form</th>
            <th className="border p-2">Gender</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td className="border p-2">{student.id}</td>

              {editingId === student.id ? (
                <>
                  <td className="border p-2 flex gap-2">
                    <input
                      name="firstName"
                      value={editData.firstName}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-24"
                    />
                    <input
                      name="secondName"
                      value={editData.secondName}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-24"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      name="form"
                      type="number"
                      value={editData.form}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-16"
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      name="gender"
                      value={editData.gender}
                      onChange={handleEditChange}
                      className="border p-1 rounded"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </td>
                  <td className="border p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => saveEdit(student.id)}
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
                  <td className="border p-2">
                    {student.firstName} {student.secondName}
                  </td>
                  <td className="border p-2">{student.form}</td>
                  <td className="border p-2">{student.gender}</td>
                  <td className="border p-2 flex justify-center gap-2">
                    <button
                      onClick={() => startEdit(student)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Students;
