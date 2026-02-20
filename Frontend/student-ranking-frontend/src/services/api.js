// services/api.js
import { apiFetch } from "../utils/api";

const STUDENTS_BASE = "http://localhost:8080/students";
const SUBJECTS_BASE = "http://localhost:8080/subjects";

// ------------------ STUDENTS ------------------

export async function getAllStudents() {
  const res = await apiFetch(`${STUDENTS_BASE}/allstudents`);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function addStudent(student) {
  const res = await apiFetch(`${STUDENTS_BASE}/add`, {
    method: "POST",
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error("Failed to add student");
  return res.json();
}

export async function deleteStudent(id) {
  const res = await apiFetch(`${STUDENTS_BASE}/deleteStud/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete student");
}

export async function updateStudent(id, student) {
  const res = await apiFetch(`${STUDENTS_BASE}/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error("Failed to update student");
  return res.json();
}

// ------------------ MARKS ------------------

export async function addMarksBatch(payload) {
  const res = await apiFetch("http://localhost:8080/marks/add", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add marks");
  return res.json();
}

// ------------------ SUBJECTS ------------------

// Get all subjects
export async function getAllSubjects() {
  const res = await apiFetch(`${SUBJECTS_BASE}/allsub`);
  if (!res.ok) throw new Error("Failed to fetch subjects");
  return res.json();
}

// Add a new subject
export async function addSubject(subject) {
  const res = await apiFetch(`${SUBJECTS_BASE}/addSubjects`, {
    method: "POST",
    body: JSON.stringify(subject),
  });
  if (!res.ok) throw new Error("Failed to add subject");
  return res.json();
}

// Update a subject
export async function updateSubject(id, subject) {
  const res = await apiFetch(`${SUBJECTS_BASE}/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(subject),
  });
  if (!res.ok) throw new Error("Failed to update subject");
  return res.json();
}

// Delete a subject
export async function deleteSubject(id) {
  const res = await apiFetch(`${SUBJECTS_BASE}/delete/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete subject");
}
