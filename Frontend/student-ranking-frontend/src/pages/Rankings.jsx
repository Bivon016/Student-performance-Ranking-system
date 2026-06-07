import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllClasses, getResults } from "../services/api";
import * as XLSX from "xlsx";
import {
  Trophy, AlertTriangle, CheckCircle, ChevronDown,
  ChevronUp, Search, BarChart, Users, BookOpen,
  Zap, RefreshCw, Download, FileText, Package,
} from "lucide-react";

const EXAM_TYPES = [
  { value: "FINAL_EXAM",  label: "Final Exam"  },
  { value: "MIDTERM",     label: "Midterm"     },
  { value: "QUIZ",        label: "Quiz"        },
  { value: "ASSIGNMENT",  label: "Assignment"  },
  { value: "LAB_WORK",    label: "Lab Work"    },
  { value: "PROJECT",     label: "Project"     },
];

const RANK_COLORS = [
  "bg-yellow-100 text-yellow-800 border-yellow-300",
  "bg-gray-100   text-gray-700   border-gray-300",
  "bg-orange-100 text-orange-700 border-orange-300",
];
const getRankColor = (rank) => RANK_COLORS[rank - 1] ?? "bg-white text-gray-700 border-gray-200";
const getRankIcon  = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

const getGradeColor = (val) => {
  if (val == null) return "bg-red-100 text-red-600";
  if (val >= 90)   return "bg-green-100 text-green-800";
  if (val >= 80)   return "bg-blue-100 text-blue-800";
  if (val >= 70)   return "bg-yellow-100 text-yellow-800";
  if (val >= 60)   return "bg-orange-100 text-orange-800";
  return                  "bg-red-100 text-red-800";
};

const calcGradePoint = (marks) => {
  if (marks == null) return null;
  if (marks >= 80) return 5;
  if (marks >= 70) return 4;
  if (marks >= 60) return 3;
  if (marks >= 40) return 2;
  return 1;
};

const getGradePointColor = (pt) => {
  if (pt === 5) return "bg-green-100 text-green-700";
  if (pt === 4) return "bg-blue-100 text-blue-700";
  if (pt === 3) return "bg-yellow-100 text-yellow-700";
  if (pt === 2) return "bg-orange-100 text-orange-700";
  if (pt === 1) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-400";
};

// Only sum subjects the student is actually enrolled in (key exists in subjectMarks)
const calcTotalPoints = (student) =>
  Object.values(student.subjectMarks ?? {})
    .reduce((sum, val) => sum + (calcGradePoint(val) ?? 0), 0);

// ─── Bulk download progress modal ─────────────────────────────────────────────
function BulkProgressModal({ total, current, currentName, done, onClose }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 40px", width: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
        {!done ? (
          <>
            <Package size={36} style={{ color: "#2563eb", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Generating Report Cards</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              {current} of {total} — <strong>{currentName}</strong>
            </p>
            <div style={{ background: "#e2e8f0", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)", borderRadius: 99, transition: "width 0.3s ease" }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{pct}%</p>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Please keep this window open…</p>
          </>
        ) : (
          <>
            <CheckCircle size={36} style={{ color: "#16a34a", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>All Done!</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
              {total} report card{total !== 1 ? "s" : ""} downloaded as a ZIP file.
            </p>
            <button
              onClick={onClose}
              style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const Results = () => {
  const navigate = useNavigate();

  const [loading,          setLoading]          = useState(true);
  const [classes,          setClasses]          = useState([]);
  const [error,            setError]            = useState(null);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [examType,         setExamType]         = useState("");
  const [results,          setResults]          = useState(null);
  const [generating,       setGenerating]       = useState(false);
  const [genError,         setGenError]         = useState(null);
  const [search,           setSearch]           = useState("");
  const [showIssues,       setShowIssues]       = useState(false);

  // Bulk download state
  const [bulkProgress, setBulkProgress] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    getAllClasses()
      .then(setClasses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formGroups  = classes.reduce((acc, c) => { const f = c.formNumber; if (!acc[f]) acc[f] = []; acc[f].push(c); return acc; }, {});
  const sortedForms = Object.keys(formGroups).map(Number).sort((a, b) => a - b);

  const studentList = results?.students ?? [];

  // ── Build the union of all subjects any enrolled student has, sorted ──────
  // A subject appears in a student's subjectMarks map ONLY if they are enrolled.
  // null value = enrolled but mark missing. absent key = not enrolled (skip).
  const subjectNames = useMemo(() => {
    if (!results) return [];
    const allKeys = new Set();
    studentList.forEach((s) => {
      Object.keys(s.subjectMarks ?? {}).forEach((k) => allKeys.add(k));
    });
    return [...allKeys].sort();
  }, [results, studentList]);

  const subjectAvgs = results?.subjectAverages ?? {};

  const filteredStudents = studentList.filter((s) =>
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    String(s.studentId).includes(search)
  );
  const issueStudents = studentList.filter((s) => s.hasIssues);

  const toggleClass = (classId) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
    setResults(null);
  };

  const selectAllStreams = (formNumber) => {
    const ids = formGroups[formNumber].map((c) => c.classId);
    setSelectedClassIds((prev) => {
      const without     = prev.filter((id) => !ids.includes(id));
      const allSelected = ids.every((id) => prev.includes(id));
      return allSelected ? without : [...without, ...ids];
    });
    setResults(null);
  };

  const allStreamsSelected = (formNumber) =>
    formGroups[formNumber].map((c) => c.classId).every((id) => selectedClassIds.includes(id));

  const canGenerate = selectedClassIds.length > 0 && examType;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true); setGenError(null); setResults(null);
    try {
      const data = await getResults(selectedClassIds, examType);
      setResults(data);
      if (data.hasIssues) setShowIssues(true);
    } catch (err) {
      setGenError(err?.response?.data || err.message || "Failed to generate results.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setResults(null); setSelectedClassIds([]); setExamType("");
    setGenError(null); setSearch(""); setShowIssues(false);
  };

  const handleViewReportCard = (student) => {
    const params = new URLSearchParams({
      studentId: student.studentId,
      classIds:  selectedClassIds.join(","),
      examType,
    });
    navigate(`/report-card?${params.toString()}`);
  };

  // ── Excel export — enrollment-aware ────────────────────────────────────────
  const handleExportExcel = () => {
    if (!results) return;
    const examLabel = EXAM_TYPES.find((e) => e.value === examType)?.label ?? examType;

    const rows = filteredStudents.map((student) => {
      const row = { Rank: student.rank, Student: student.studentName, Class: student.className };
      let totalPoints = 0;

      subjectNames.forEach((subj) => {
        const isEnrolled = subj in (student.subjectMarks ?? {});
        const val        = isEnrolled ? student.subjectMarks[subj] : undefined;
        const gp         = isEnrolled ? calcGradePoint(val) : undefined;

        row[subj]            = !isEnrolled ? "N/A" : val ?? "Missing";
        row[`${subj} (GP)`]  = !isEnrolled ? "N/A" : gp ?? "—";

        if (isEnrolled) totalPoints += gp ?? 0;
      });

      row["Total Marks"]  = student.totalMarks;
      row["Total Points"] = totalPoints;
      return row;
    });

    // Averages footer row
    const avgRow = { Rank: "", Student: "Class Average", Class: "" };
    subjectNames.forEach((subj) => {
      avgRow[subj]            = subjectAvgs[subj] ?? "—";
      avgRow[`${subj} (GP)`] = calcGradePoint(subjectAvgs[subj]) ?? "—";
    });
    avgRow["Total Marks"]  = results.overallAverage;
    avgRow["Total Points"] = "";
    rows.push(avgRow);

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `Results_${examLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  // ── Bulk PDF download ──────────────────────────────────────────────────────
  const handleBulkDownload = async () => {
    if (!results || studentList.length === 0) return;

    const [html2pdfMod, JSZipMod, { saveAs }] = await Promise.all([
      import("html2pdf.js"),
      import("jszip"),
      import("file-saver"),
    ]);
    const html2pdf = html2pdfMod.default;
    const JSZip    = JSZipMod.default;

    const zip         = new JSZip();
    const examLabel   = EXAM_TYPES.find((e) => e.value === examType)?.label ?? examType;
    const classIdsStr = selectedClassIds.join(",");

    abortRef.current = false;
    setBulkProgress({ total: studentList.length, current: 0, currentName: "", done: false });

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden";
    document.body.appendChild(iframe);

    try {
      for (let i = 0; i < studentList.length; i++) {
        if (abortRef.current) break;

        const student = studentList[i];
        setBulkProgress({
          total: studentList.length,
          current: i + 1,
          currentName: student.studentName,
          done: false,
        });

        const params = new URLSearchParams({
          studentId: student.studentId,
          classIds:  classIdsStr,
          examType,
        });

        await new Promise((resolve) => {
          iframe.onload = resolve;
          iframe.src = `/report-card?${params.toString()}`;
        });

        await new Promise((r) => setTimeout(r, 2000));

        const rcRoot = iframe.contentDocument?.getElementById("rc-root");
        if (!rcRoot) continue;

        const cleanName = student.studentName?.replace(/\s+/g, "_") ?? "Student";
        const filename  = `${cleanName}_ID${student.studentId}_${examLabel.replace(/\s+/g, "_")}.pdf`;

        const pdfBlob = await html2pdf()
          .set({
            margin:      0,
            filename,
            image:       { type: "jpeg", quality: 0.97 },
            html2canvas: { scale: 2, useCORS: true, width: 794, height: 1123, logging: false },
            jsPDF:       { unit: "px", format: [794, 1123], orientation: "portrait" },
          })
          .from(rcRoot)
          .outputPdf("blob");

        zip.file(filename, pdfBlob);
      }
    } finally {
      document.body.removeChild(iframe);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipName = `ReportCards_${examLabel.replace(/\s+/g, "_")}_${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;
    saveAs(zipBlob, zipName);

    setBulkProgress((prev) => ({ ...prev, done: true }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Bulk progress modal */}
      {bulkProgress && (
        <BulkProgressModal
          total={bulkProgress.total}
          current={bulkProgress.current}
          currentName={bulkProgress.currentName}
          done={bulkProgress.done}
          onClose={() => setBulkProgress(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Generate Results</h1>
          <p className="text-gray-600">Select classes and exam type to generate ranked results</p>
        </div>
        <div className="flex items-center gap-2">
          {results && (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Download size={16} /> Export Excel
              </button>

              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                <Package size={16} /> Download All PDFs
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                <RefreshCw size={16} /> New Results
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── Selection Panel ── */}
      {!results && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Step 1 — Select Class(es)
            </p>
            <div className="space-y-4">
              {sortedForms.map((formNumber) => {
                const streamClasses = formGroups[formNumber];
                const allSelected   = allStreamsSelected(formNumber);
                return (
                  <div key={`form-group-${formNumber}`} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-700">Form {formNumber}</span>
                      <button
                        onClick={() => selectAllStreams(formNumber)}
                        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                          allSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 text-gray-500 hover:border-blue-400"
                        }`}
                      >
                        {allSelected ? "✓ All Streams" : "Select All Streams"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {streamClasses.map((c) => (
                        <button
                          key={`cls-${c.classId}`}
                          onClick={() => toggleClass(c.classId)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                            selectedClassIds.includes(c.classId)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-200 text-gray-600 hover:border-blue-300"
                          }`}
                        >
                          {c.className}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Step 2 — Select Exam Type
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map((et) => (
                <button
                  key={et.value}
                  onClick={() => { setExamType(et.value); setResults(null); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                    examType === et.value
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-purple-300"
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm space-y-1">
              {selectedClassIds.length > 0
                ? <p className="text-blue-700 font-medium">✓ {selectedClassIds.length} class{selectedClassIds.length > 1 ? "es" : ""} selected</p>
                : <p className="text-gray-400">No classes selected</p>
              }
              {examType
                ? <p className="text-purple-700 font-medium">✓ {EXAM_TYPES.find((e) => e.value === examType)?.label} selected</p>
                : <p className="text-gray-400">No exam type selected</p>
              }
            </div>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={18} />
              <span>{generating ? "Generating…" : "Generate Results"}</span>
            </button>
          </div>

          {genError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} /><span>{genError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Results Panel ── */}
      {results && (
        <div className="space-y-4">

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Students Ranked</p><p className="text-2xl font-bold mt-1">{studentList.length}</p></div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Subjects</p><p className="text-2xl font-bold mt-1">{subjectNames.length}</p></div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
              <div><p className="text-sm text-gray-500">Overall Average</p><p className="text-2xl font-bold mt-1">{results.overallAverage}</p></div>
              <BarChart className="h-8 w-8 text-purple-500" />
            </div>
            <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between ${results.hasIssues ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <div>
                <p className={`text-sm ${results.hasIssues ? "text-red-600" : "text-green-600"}`}>
                  {results.hasIssues ? "Issues Found" : "All Complete"}
                </p>
                <p className="text-2xl font-bold mt-1">{results.hasIssues ? issueStudents.length : "✓"}</p>
              </div>
              {results.hasIssues
                ? <AlertTriangle className="h-8 w-8 text-red-500" />
                : <CheckCircle className="h-8 w-8 text-green-500" />
              }
            </div>
          </div>

          {/* Issues banner */}
          {results.hasIssues && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      {issueStudents.length} student{issueStudents.length > 1 ? "s have" : " has"} missing marks
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Results include these students but their totals are incomplete.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIssues((p) => !p)}
                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                >
                  {showIssues ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showIssues ? "Hide" : "Show"} Issues
                </button>
              </div>
              {showIssues && (
                <div className="mt-4 space-y-2">
                  {issueStudents.map((s) => (
                    <div
                      key={`issue-${s.studentId}`}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-red-100"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{s.studentName}</span>
                        <span className="ml-2 text-xs text-gray-500">({s.className})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(s.missingSubjects ?? []).map((subj) => (
                          <span
                            key={`miss-${s.studentId}-${subj}`}
                            className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium"
                          >
                            Missing: {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search student…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-sm text-gray-500">{filteredStudents.length} of {studentList.length} students</span>
            <span className="ml-auto text-xs text-indigo-600 font-medium flex items-center gap-1">
              <Package size={13} /> Use "Download All PDFs" to get every report card as a ZIP
            </span>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    {subjectNames.map((subj) => (
                      <th
                        key={`th-${subj}`}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                        colSpan={2}
                      >
                        {subj}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Total Marks</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-purple-50">Total Points</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-teal-50 whitespace-nowrap">Report Card</th>
                  </tr>
                  <tr className="bg-gray-100 border-t border-gray-200">
                    <th colSpan={3} />
                    {subjectNames.map((subj) => (
                      <React.Fragment key={`sub-th-${subj}`}>
                        <th className="px-3 py-1.5 text-center text-xs text-gray-400 font-medium">Marks</th>
                        <th className="px-3 py-1.5 text-center text-xs text-gray-400 font-medium">GP</th>
                      </React.Fragment>
                    ))}
                    <th className="bg-blue-50" />
                    <th className="bg-purple-50" />
                    <th className="bg-teal-50" />
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const totalPoints = calcTotalPoints(student);
                    return (
                      <tr
                        key={`result-${student.studentId}`}
                        className={`transition-colors ${student.hasIssues ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}
                      >
                        {/* Rank */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border ${getRankColor(student.rank)}`}>
                            {getRankIcon(student.rank)}
                          </span>
                        </td>

                        {/* Student name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.hasIssues && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                            <div>
                              <div className="font-semibold text-gray-900 whitespace-nowrap">{student.studentName}</div>
                              <div className="text-xs text-gray-400">ID #{student.studentId}</div>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full whitespace-nowrap">
                            {student.className}
                          </span>
                        </td>

                        {/* Subject columns — enrollment-aware */}
                        {subjectNames.map((subj) => {
                          // Key present in map → enrolled (value may be null if mark missing)
                          // Key absent → not enrolled in this subject
                          const isEnrolled = subj in (student.subjectMarks ?? {});
                          const val        = isEnrolled ? student.subjectMarks[subj] : undefined;
                          const gp         = isEnrolled ? calcGradePoint(val) : undefined;

                          return (
                            <React.Fragment key={`mark-${student.studentId}-${subj}`}>
                              {/* Marks cell */}
                              <td className="px-3 py-3 text-center">
                                {!isEnrolled ? (
                                  // Not taking this subject
                                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400">
                                    N/A
                                  </span>
                                ) : val == null ? (
                                  // Enrolled but mark not entered
                                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600">
                                    —
                                  </span>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(val)}`}>
                                    {val % 1 === 0 ? val : val.toFixed(1)}
                                  </span>
                                )}
                              </td>

                              {/* Grade point cell */}
                              <td className="px-3 py-3 text-center">
                                {!isEnrolled ? (
                                  <span className="text-gray-300 text-xs">N/A</span>
                                ) : gp == null ? (
                                  <span className="text-gray-300 text-xs">—</span>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getGradePointColor(gp)}`}>
                                    {gp}
                                  </span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Total marks */}
                        <td className="px-4 py-3 text-center bg-blue-50">
                          <span className="font-bold text-blue-800 text-sm">
                            {student.totalMarks % 1 === 0 ? student.totalMarks : student.totalMarks.toFixed(1)}
                          </span>
                        </td>

                        {/* Total points */}
                        <td className="px-4 py-3 text-center bg-purple-50">
                          <span className="font-bold text-purple-800 text-sm">{totalPoints}</span>
                        </td>

                        {/* Report card button */}
                        <td className="px-4 py-3 text-center bg-teal-50">
                          <button
                            onClick={() => handleViewReportCard(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap shadow-sm"
                          >
                            <FileText size={13} /> Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Class averages row */}
                  {subjectNames.length > 0 && (
                    <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                      <td className="px-4 py-3" colSpan={2}>
                        <span className="text-xs text-gray-600 uppercase font-bold tracking-wide">Class Average</span>
                      </td>
                      <td className="px-4 py-3" />
                      {subjectNames.map((subj) => {
                        const avg = subjectAvgs[subj];
                        const gp  = calcGradePoint(avg);
                        return (
                          <React.Fragment key={`avg-${subj}`}>
                            <td className="px-3 py-3 text-center">
                              <span className="text-sm font-bold text-gray-700">{avg ?? "—"}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {gp != null ? (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getGradePointColor(gp)}`}>
                                  {gp}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-4 py-3 text-center bg-blue-100">
                        <span className="font-bold text-blue-800">{results.overallAverage}</span>
                      </td>
                      <td className="px-4 py-3 bg-purple-50" />
                      <td className="px-4 py-3 bg-teal-50" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No students match your search</p>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-right">
            Use <strong>Export Excel</strong> for a spreadsheet · <strong>Download All PDFs</strong> for a ZIP of all report cards
          </p>
        </div>
      )}
    </div>
  );
};

export default Results;