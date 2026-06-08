import { API_BASE } from "../config";

const AUTH_BASE = `${API_BASE}/auth`;

// ✅ Define and export apiFetch so services/api.js can import it
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export async function login(username, password) {
  const res = await apiFetch(`${AUTH_BASE}/login`, {  // ✅ fixed typo: apifetch → apiFetch
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");

  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("assignments", JSON.stringify(data.assignments));
  return data;
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getAssignments() {
  return JSON.parse(localStorage.getItem("assignments") || "[]");
}

export function canEditSubject(subjectId, classId) {
  if (getRole() === "ADMIN") return true;
  return getAssignments().some(
    (a) => a.subjectId === subjectId && a.classId === classId
  );
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("assignments");
}