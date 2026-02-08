const BASE_URL = "http://localhost:8080/students";

export async function getAllStudents() {
  const res = await fetch(`${BASE_URL}/allstudents`);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function addStudent(student) {
  const res = await fetch(`${BASE_URL}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student)
  });

  if (!res.ok) throw new Error("Failed to add student");
  return res.json();
}

export async function deleteStudent(id) {
  const res = await fetch(`${BASE_URL}/deleteStud/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) throw new Error("Failed to delete student");
}

export async function updateStudent(id, student) {
  const res = await fetch(`${BASE_URL}/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });

  if (!res.ok) throw new Error("Failed to update student");
  return res.json();
}
