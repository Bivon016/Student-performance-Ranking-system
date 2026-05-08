// services/api.js
import { apiFetch } from "../utils/api";

const BASE_URL = 'http://localhost:8080';

// Core fetch function using apiFetch for security
const request = async (endpoint, options = {}) => {
    const res = await apiFetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
    if (res.status === 204) return null;
    return res.json();
};

// ------------------ STUDENTS ------------------
export const studentService = {
    getAll: () => request(`/students/allstudents?t=${Date.now()}`),
    add: (student) => request('/students/add', { method: 'POST', body: student }),
    update: (id, student) => request(`/students/update/${id}`, { method: 'PUT', body: student }),
    delete: (id) => request(`/students/deleteStud/${id}`, { method: 'DELETE' }),
};

// ------------------ MARKS ------------------
export const marksService = {
    getAll: () => request('/marks/allmarks'),
    addBatch: (payload) => request('/marks/add', { method: 'POST', body: payload }),
    getBySubject: (subjectId) => request(`/marks/subject/${subjectId}`),
    getByStudent: (studentId) => request(`/marks/student/${studentId}`),
    getByExam: (examId) => request(`/marks/exam/${examId}`),
    update: (markId, marksValue) => request(`/marks/update/${markId}?marksValue=${marksValue}`, { method: 'PUT' }),
    delete: (markId) => request(`/marks/delete/${markId}`, { method: 'DELETE' }),
};

// ------------------ EXAMS ------------------
export const examService = {
    getAll: () => request('/exams/all'),
    create: (exam) => request('/exams/create', { method: 'POST', body: exam }),
    getBySubjectAndForm: (subjectId, form) => request(`/exams/filter?subjectId=${subjectId}&form=${form}`),
    getByForm: (form) => request(`/exams/form/${form}`),
    delete: (examId) => request(`/exams/delete/${examId}`, { method: 'DELETE' }),
};

// ------------------ SUBJECTS ------------------
export const subjectService = {
    getAll: () => request('/subjects/allSubjects'),
    add: (subject) => request('/subjects/addSubjects', { method: 'POST', body: subject }),
    update: (id, subject) => request(`/subjects/update/${id}`, { method: 'PUT', body: subject }),
    delete: (id) => request(`/subjects/delete/${id}`, { method: 'DELETE' }),
};

// ------------------ CLASSES ------------------
export const classService = {
    getAll: () => request('/classes/all'),
    create: (cls) => request('/classes/create', { method: 'POST', body: cls }),
    update: (classId, cls) => request(`/classes/update/${classId}`, { method: 'PUT', body: cls }),
    delete: (classId) => request(`/classes/delete/${classId}`, { method: 'DELETE' }),
};