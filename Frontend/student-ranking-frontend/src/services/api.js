// services/api.js
import { apiFetch } from "../utils/api";

const STUDENTS_BASE = "http://localhost:8080/students";
const SUBJECTS_BASE = "http://localhost:8080/subjects";
const MARKS_BASE    = "http://localhost:8080/marks";
const EXAMS_BASE    = "http://localhost:8080/exams";
const CLASSES_BASE  = "http://localhost:8080/classes";

// ------------------ STUDENTS ------------------

export async function getAllStudents() {
  const res = await apiFetch(`${STUDENTS_BASE}/allstudents?t=${Date.now()}`);
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

export async function getAllMarks() {
  const res = await apiFetch(`${MARKS_BASE}/allmarks`);
  if (!res.ok) throw new Error("Failed to fetch all marks");
  return res.json();
}

export async function addMarksBatch(payload) {
  const res = await apiFetch(`${MARKS_BASE}/add`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add marks");
  return res.json();
}

export async function getMarksBySubject(subjectId) {
  const res = await apiFetch(`${MARKS_BASE}/subject/${subjectId}`);
  if (!res.ok) throw new Error("Failed to fetch marks by subject");
  return res.json();
}

export async function getMarksByStudent(studentId) {
  const res = await apiFetch(`${MARKS_BASE}/student/${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch marks by student");
  return res.json();
}

export async function getMarksByExam(examId) {
  const res = await apiFetch(`${MARKS_BASE}/exam/${examId}`);
  if (!res.ok) throw new Error("Failed to fetch marks by exam");
  return res.json();
}

export async function updateMarks(markId, marksValue) {
  const res = await apiFetch(`${MARKS_BASE}/update/${markId}?marksValue=${marksValue}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to update marks");
  return res.json();
}

export async function deleteMarks(markId) {
  const res = await apiFetch(`${MARKS_BASE}/delete/${markId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete marks");
  return true;
}

// ------------------ EXAMS ------------------

export async function getAllExams() {
  const res = await apiFetch(`${EXAMS_BASE}/all`);
  if (!res.ok) throw new Error("Failed to fetch exams");
  return res.json();
}

export async function createExam(exam) {
  const res = await apiFetch(`${EXAMS_BASE}/create`, {
    method: "POST",
    body: JSON.stringify(exam),
  });
  if (!res.ok) throw new Error("Failed to create exam");
  return res.json();
}

export async function getExamsBySubjectAndForm(subjectId, form) {
  const res = await apiFetch(`${EXAMS_BASE}/filter?subjectId=${subjectId}&form=${form}`);
  if (!res.ok) throw new Error("Failed to fetch exams by subject and form");
  return res.json();
}

export async function getExamsByForm(form) {
  const res = await apiFetch(`${EXAMS_BASE}/form/${form}`);
  if (!res.ok) throw new Error("Failed to fetch exams by form");
  return res.json();
}

export async function deleteExam(examId) {
  const res = await apiFetch(`${EXAMS_BASE}/delete/${examId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete exam");
}

// ------------------ SUBJECTS ------------------

export async function getAllSubjects() {
  const res = await apiFetch(`${SUBJECTS_BASE}/allSubjects`);
  if (!res.ok) throw new Error("Failed to fetch subjects");
  return res.json();
}

export async function addSubject(subject) {
  const res = await apiFetch(`${SUBJECTS_BASE}/addSubjects`, {
    method: "POST",
    body: JSON.stringify(subject),
  });
  if (!res.ok) throw new Error("Failed to add subject");
  return res.json();
}

export async function updateSubject(id, subject) {
  const res = await apiFetch(`${SUBJECTS_BASE}/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(subject),
  });
  if (!res.ok) throw new Error("Failed to update subject");
  return res.json();
}

export async function deleteSubject(id) {
  const res = await apiFetch(`${SUBJECTS_BASE}/delete/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete subject");
}

// ------------------ CLASSES ------------------

export async function getAllClasses() {
  const res = await apiFetch(`${CLASSES_BASE}/all`);
  if (!res.ok) throw new Error("Failed to fetch classes");
  return res.json();
}

export async function createClass(cls) {
  const res = await apiFetch(`${CLASSES_BASE}/create`, {
    method: "POST",
    body: JSON.stringify(cls),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to create class");
  }
  return res.json();
}

export async function updateClass(classId, cls) {
  const res = await apiFetch(`${CLASSES_BASE}/update/${classId}`, {
    method: "PUT",
    body: JSON.stringify(cls),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to update class");
  }
  return res.json();
}

export async function deleteClass(classId) {
  const res = await apiFetch(`${CLASSES_BASE}/delete/${classId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete class");
}