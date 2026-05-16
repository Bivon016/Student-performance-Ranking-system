// hooks/useReportCard.js
// Matches the EXACT API shape from Results.jsx:
//
// GET /ranking/results?classIds=1,2&examType=FINAL_EXAM  →
// {
//   subjectNames: string[],
//   students: [{
//     studentId, studentName, className,
//     rank, totalMarks, hasIssues,
//     missingSubjects: string[],
//     subjectMarks: { [subjectName]: number | null }
//   }],
//   subjectAverages: { [subjectName]: number },
//   overallAverage: number,
//   hasIssues: boolean
// }

import { useState, useEffect, useCallback } from "react";
import { getResults } from "../services/api";

// ─── Grading helpers ─────────────────────────────────────────────────────────

/** Numeric score → Kenyan KNEC letter grade */
export function scoreToGrade(score) {
  if (score == null) return "—";
  if (score >= 75) return "A";
  if (score >= 70) return "A-";
  if (score >= 65) return "B+";
  if (score >= 60) return "B";
  if (score >= 55) return "B-";
  if (score >= 50) return "C+";
  if (score >= 45) return "C";
  if (score >= 40) return "C-";
  if (score >= 35) return "D+";
  if (score >= 30) return "D";
  if (score >= 25) return "D-";
  return "E";
}

/** Mirror of backend calculateGradePoint */
export function calcGradePoint(marks) {
  if (marks == null) return null;
  if (marks >= 80) return 5;
  if (marks >= 70) return 4;
  if (marks >= 60) return 3;
  if (marks >= 40) return 2;
  return 1;
}

/** Score → CBC performance level (used by ReportCard print layout) */
export function scoreToCBC(score) {
  if (score == null) return "—";
  if (score >= 90) return "EE1";
  if (score >= 75) return "EE2";
  if (score >= 50) return "ME";
  if (score >= 25) return "AE";
  return "BE";
}

/** Grade-point mean → letter grade */
function pointsToMeanGrade(totalPoints, subjectCount) {
  if (!subjectCount) return "—";
  const avg = totalPoints / subjectCount;
  if (avg >= 4.5) return "A";
  if (avg >= 3.5) return "A-";
  if (avg >= 3.0) return "B+";
  if (avg >= 2.5) return "B";
  if (avg >= 2.0) return "B-";
  if (avg >= 1.5) return "C+";
  return "C";
}

/** Ordinal suffix: 1→"1st", 12→"12th" */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Exam type enum → human label */
export const EXAM_LABEL_MAP = {
  FINAL_EXAM: "Final Exam",
  MIDTERM:    "Midterm Exam",
  QUIZ:       "Quiz",
  ASSIGNMENT: "Assignment",
  LAB_WORK:   "Lab Work",
  PROJECT:    "Project",
};

// ─── Primary hook ─────────────────────────────────────────────────────────────

/**
 * Fetches /ranking/results, finds the student, and returns a fully-shaped
 * report object consumed by both ReportCard.jsx and the dark-theme dashboard.
 *
 * Every field referenced in ReportCard.jsx is guaranteed to be present.
 */
export function useReportCard(studentId, classIds = [], examType = "FINAL_EXAM") {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const doFetch = useCallback(async () => {
    if (!studentId || !classIds.length || !examType) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await getResults(classIds, examType);

      const subjectNames  = data.subjectNames ?? data.subjects ?? [];
      const studentList   = data.students ?? [];
      const totalStudents = studentList.length;

      const entry = studentList.find(
        (s) => String(s.studentId) === String(studentId)
      );
      if (!entry) throw new Error(`Student ID ${studentId} not found in ranking results.`);

      // Build per-subject rows
      // Each row exposes BOTH .total (numeric) and .score (alias) so both
      // ReportCard layouts can reference whichever field they prefer.
      const subjects = subjectNames.map((name) => {
        const marks = entry.subjectMarks?.[name] ?? null;
        const level = scoreToCBC(marks);
        return {
          name,
          total:   marks,          // used by dark-theme dashboard
          score:   marks,          // used by ReportCard print layout (s.score)
          grade:   scoreToGrade(marks),
          gp:      calcGradePoint(marks),
          level,                   // CBC level string e.g. "EE2"
          missing: marks == null,
        };
      });

      const completed    = subjects.filter((s) => !s.missing);
      const totalPoints  = completed.reduce((a, s) => a + (s.gp ?? 0), 0);
      const meanGrade    = pointsToMeanGrade(totalPoints, completed.length);
      const meanScore    = completed.length
        ? parseFloat(
            (completed.reduce((a, s) => a + (s.total ?? 0), 0) / completed.length).toFixed(1)
          )
        : 0;

      // CBC mean level — derived from the mean score
      const meanLevel = scoreToCBC(meanScore);

      const maxPossible        = subjectNames.length * 100;
      const performancePercent = maxPossible
        ? Math.min(100, Math.round(((entry.totalMarks ?? 0) / maxPossible) * 100))
        : 0;

      const rank     = entry.rank ?? 1;
      const initials = (entry.studentName ?? "??")
        .split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();

      const examLabel         = EXAM_LABEL_MAP[examType] ?? examType.replace(/_/g, " ");
      // currentTermLabel is the same value — kept as an alias so any
      // old reference to report.currentTermLabel also works
      const currentTermLabel  = examLabel;

      setReport({
        // ── Identity ──────────────────────────────────────────────────────
        studentId:       entry.studentId,
        name:            entry.studentName ?? "—",
        className:       entry.className   ?? "—",
        form:            entry.className   ?? "—",   // alias
        profileInitials: initials,
        admissionNo:     `ID #${entry.studentId}`,   // API doesn't return adm. no.
        academicYear:
          new Date().getFullYear() + " / " + (new Date().getFullYear() + 1),

        // ── Grades ────────────────────────────────────────────────────────
        meanGrade,
        meanScore,
        meanLevel,                  // CBC level for the overall result
        totalMarks:  entry.totalMarks ?? 0,
        totalPoints,
        overallMean: meanScore,     // alias

        // ── Ranking ───────────────────────────────────────────────────────
        rank,
        position:     ordinal(rank),
        totalStudents,

        // ── Progress ──────────────────────────────────────────────────────
        performancePercent,

        // ── Subject data ──────────────────────────────────────────────────
        subjects,
        subjectNames,
        hasIssues:       entry.hasIssues      ?? false,
        missingSubjects: entry.missingSubjects ?? [],

        // ── Class-wide context ────────────────────────────────────────────
        subjectAverages: data.subjectAverages ?? {},
        overallAverage:  data.overallAverage  ?? 0,
        classHasIssues:  data.hasIssues       ?? false,

        // ── Exam / term metadata ──────────────────────────────────────────
        examType,
        examLabel,
        currentTermLabel,           // used in ReportCard footer

        // ── Teacher remarks (not in API — shown as defaults) ──────────────
        teacherRemark: null,
        teacherName:   null,
        teacherTitle:  null,

        // ── Date ──────────────────────────────────────────────────────────
        dateIssued: new Date().toLocaleDateString("en-KE", {
          day: "numeric", month: "long", year: "numeric",
        }),
      });
    } catch (err) {
      setError(err.message ?? "Unknown error fetching report.");
    } finally {
      setLoading(false);
    }
  }, [studentId, classIds.join(","), examType]);

  useEffect(() => { doFetch(); }, [doFetch]);

  return { report, loading, error, refetch: doFetch };
}

// ─── Term trend hook ──────────────────────────────────────────────────────────

/**
 * Fires getResults for each examType in parallel and returns a bar-chart
 * array for the given student.
 */
export function useTermTrend(studentId, classIds = [], examTypes = []) {
  const [termScores, setTermScores] = useState([]);
  const [loading,    setLoading]    = useState(false);

  const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#f472b6"];

  useEffect(() => {
    if (!studentId || !classIds.length || !examTypes.length) return;
    setLoading(true);

    Promise.allSettled(examTypes.map((et) => getResults(classIds, et))).then((results) => {
      const scores = results.map((r, i) => {
        const label  = EXAM_LABEL_MAP[examTypes[i]] ?? examTypes[i].replace(/_/g, " ");
        const isLast = i === examTypes.length - 1;

        if (r.status !== "fulfilled") {
          return { term: label, score: 0, color: COLORS[i % COLORS.length], current: isLast };
        }

        const studentList  = r.value.students ?? [];
        const subjectNames = r.value.subjectNames ?? r.value.subjects ?? [];
        const entry        = studentList.find((s) => String(s.studentId) === String(studentId));
        const completed    = subjectNames.filter((n) => entry?.subjectMarks?.[n] != null);
        const meanScore    = completed.length
          ? parseFloat(
              (completed.reduce((a, n) => a + (entry.subjectMarks[n] ?? 0), 0) / completed.length).toFixed(1)
            )
          : 0;

        return { term: label, score: meanScore, color: COLORS[i % COLORS.length], current: isLast };
      });

      setTermScores(scores);
      setLoading(false);
    });
  }, [studentId, classIds.join(","), examTypes.join(",")]);

  return { termScores, loading };
}