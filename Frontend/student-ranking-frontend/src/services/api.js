import { apiFetch } from "../utils/api";

// ─── Base URLs ────────────────────────────────────────────────────────────────
const BASE             = "http://localhost:8080";
const STUDENTS_BASE    = `${BASE}/students`;
const SUBJECTS_BASE    = `${BASE}/subjects`;
const MARKS_BASE       = `${BASE}/marks`;
const EXAMS_BASE       = `${BASE}/exams`;
const CLASSES_BASE     = `${BASE}/classes`;
const RANKING_BASE     = `${BASE}/ranking`;
const AUTH_BASE        = `${BASE}/auth`;
const PERIOD_BASE      = `${BASE}/period`;
const USERS_BASE      =  `${BASE}/users`
const SCHOOL_BASE = `${BASE}/school`;
// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Login — stores token, role, and assignments in localStorage.
 * Replace any existing login fetch call in your app with this.
 */

export const getAllTeachers      = ()                    => get(`${BASE}/teachers/all`)
export const addTeacher          = (teacher)             => post(`${BASE}/teachers/add`, teacher)
export const deleteTeacher       = (id)                  => del(`${BASE}/teachers/delete/${id}`)
export const linkUserToTeacher   = (teacherId, userId)   => put(`${BASE}/teachers/${teacherId}/link-user`, { userId })
export const getTeacherAssignments = (teacherId)         => get(`${BASE}/teachers/${teacherId}/assignments`)
export const addTeacherAssignment  = (teacherId, body)   => post(`${BASE}/teachers/${teacherId}/assignments`, body)
export const deleteTeacherAssignment = (assignmentId)    => del(`${BASE}/teachers/assignments/${assignmentId}`)
export const getAllUsers = () => get(`${AUTH_BASE}/users/all`)
export const updateRole  = (id, role) => put(`${AUTH_BASE}/users/${id}/role`, { role })
export const getCurrentSchool = () => get(`${SCHOOL_BASE}/current`);

export const linkSchool = (schoolCode) =>
  put(`${AUTH_BASE}/users/link-school`, { schoolCode });

export async function login(username, password) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();

  // Always store token (needed for /select-school API calls)
  localStorage.setItem("token",       data.token);
  localStorage.setItem("role",        data.role);
  localStorage.setItem("assignments", JSON.stringify(data.assignments ?? []));
  localStorage.setItem("user", JSON.stringify({
    name:  data.name || data.username || username,
    email: data.email || '',
    role:  data.role,
  }));

  // ✅ Flag for redirect
  if (data.requiresSchool) {
    localStorage.setItem("requiresSchool", "true");
  } else {
    localStorage.removeItem("requiresSchool");
  }

  return data;
}


export const getCurrentPeriod = () => get(`${PERIOD_BASE}/viewPeriod`);
export const getAllPeriods     = () => get(`${PERIOD_BASE}/all`);
export const createPeriod     = (period) => post(`${PERIOD_BASE}/newPeriod`, period);
export const setCurrentPeriod = (id) => put(`${PERIOD_BASE}/${id}/setCurrent`);
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("assignments");
}
export const getExamsBySubjectAndClass = (subjectId, classId) =>
  get(`${EXAMS_BASE}/filterByClass?subjectId=${subjectId}&classId=${classId}`);

export function getRole() {
  return localStorage.getItem("role");
}

export function getAssignments() {
  return JSON.parse(localStorage.getItem("assignments") || "[]");
}

/**
 * Returns true if the logged-in user can edit marks/exams
 * for the given subject + class combination.
 * Use this to show/hide Edit and Delete buttons in the UI.
 *
 * @example
 *   const canEdit = canEditSubject(subjectId, classId);
 */
export function canEditSubject(subjectId, classId) {
 if (getRole() === "ROLE_PRINCIPAL" || getRole() === "ROLE_DEPUTY") return true;
  return getAssignments().some(
    (a) => a.subjectId === subjectId && a.classId === classId
  );
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

/** GET  → returns parsed JSON */
async function get(url) {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

/** POST → returns parsed JSON */
async function post(url, body) {
  const res = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `POST ${url} failed: ${res.status}`);
  }
  return res.json();
}

/** PUT  → returns parsed JSON */
async function put(url, body) {
  const res = await apiFetch(url, {
    method: "PUT",
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `PUT ${url} failed: ${res.status}`);
  }
  return res.json();
}

/** DELETE → returns true on success */
async function del(url) {
  const res = await apiFetch(url, { method: "DELETE" });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `DELETE ${url} failed: ${res.status}`);
  }
  return true;
}

// ─── Students ─────────────────────────────────────────────────────────────────

export const getAllStudents    = ()           => get(`${STUDENTS_BASE}/allstudents?t=${Date.now()}`);
export const addStudent        = (student)    => post(`${STUDENTS_BASE}/add`, student);
export const addStudentsBatch = (students, classId) => 
  post(`${STUDENTS_BASE}/addBatch?classId=${classId}`, students)
export const updateStudent     = (id, student)=> put(`${STUDENTS_BASE}/update/${id}`, student);
export const deleteStudent     = (id)         => del(`${STUDENTS_BASE}/deleteStud/${id}`);

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const getAllSubjects  = ()           => get(`${SUBJECTS_BASE}/allSubjects`);

export const addSubject      = (subject)    => post(`${SUBJECTS_BASE}/addSubjects`, subject);
export const updateSubject   = (id, subject)=> put(`${SUBJECTS_BASE}/update/${id}`, subject);
export const deleteSubject   = (id)         => del(`${SUBJECTS_BASE}/delete/${id}`);

// ─── Classes ──────────────────────────────────────────────────────────────────

export const getAllClasses  = ()            => get(`${CLASSES_BASE}/all`);
export const createClass    = (cls)         => post(`${CLASSES_BASE}/create`, cls);
export const updateClass    = (id, cls)     => put(`${CLASSES_BASE}/update/${id}`, cls);
export const deleteClass    = (id)          => del(`${CLASSES_BASE}/delete/${id}`);

// ─── Exams ────────────────────────────────────────────────────────────────────

export const getAllExams            = ()                   => get(`${EXAMS_BASE}/all`);
export const getExamsByForm        = (form)                => get(`${EXAMS_BASE}/form/${form}`);
export const getExamsBySubjectAndForm = (subjectId, form)  =>
  get(`${EXAMS_BASE}/filter?subjectId=${subjectId}&form=${form}`);
export const deleteExam            = (examId)              => del(`${EXAMS_BASE}/delete/${examId}`);

/**
 * Create an exam.
 * @param {{ examType, examDate, form, subjectId, classId }} exam
 * classId is required — the backend uses it to verify the teacher is assigned
 * to this subject+class before allowing the exam to be created.
 */
export const createExam = (exam) => post(`${EXAMS_BASE}/create`, exam);

// ─── Marks ────────────────────────────────────────────────────────────────────

export const getAllMarks        = ()            => get(`${MARKS_BASE}/allmarks`);
export const getMarksByStudent  = (studentId)   => get(`${MARKS_BASE}/student/${studentId}`);
export const getMarksBySubject  = (subjectId)   => get(`${MARKS_BASE}/subject/${subjectId}`);
export const getMarksByExam     = (examId)      => get(`${MARKS_BASE}/exam/${examId}`);
export const getStudentGrades   = (studentId)   => get(`${MARKS_BASE}/grades/${studentId}`);
export const deleteMarks        = (markId)      => del(`${MARKS_BASE}/delete/${markId}`);

/**
 * Add marks for many students at once.
 * @param {{ subjectId, examId, classId, marks: { studentId, marksValue }[] }} payload
 * classId is required — backend checks teacher is assigned to this subject+class.
 */
export const addMarksBatch = (payload) => post(`${MARKS_BASE}/add`, payload);

/**
 * Update a single mark.
 * subjectId + classId are required so the backend can verify
 * the teacher owns this subject+class before allowing the update.
 *
 * @param {number} markId
 * @param {number} marksValue
 * @param {number} subjectId
 * @param {number} classId
 */
export const updateMarks = (markId, marksValue, subjectId, classId) =>
  put(`${MARKS_BASE}/update/${markId}?marksValue=${marksValue}&subjectId=${subjectId}&classId=${classId}`);

// ─── Ranking ──────────────────────────────────────────────────────────────────

export async function getResults(classIds, examType) {
  const params = new URLSearchParams();
  classIds.forEach((id) => params.append("classIds", id));
  params.append("examType", examType);
  return get(`${RANKING_BASE}/results?${params.toString()}`);
}
export const getStudentsByClass = (classId) => 
  get(`${STUDENTS_BASE}/class/${classId}`);

