import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllClasses, getResults, getSubjectRanking, getAllPeriods, getCurrentPeriod } from "../services/api";
import * as XLSX from "xlsx";
import {
  Trophy, AlertTriangle, CheckCircle, ChevronDown,
  ChevronUp, Search, BarChart, Users, BookOpen,
  Zap, RefreshCw, Download, FileText, Package, Filter,
  Activity,
} from "lucide-react";
import { UserMessage } from "../components/UserMessage";
import { getFriendlyError } from "../utils/errorMessages";
import { useTheme } from "../contexts/ThemeContext";

const EXAM_TYPES = [
  { value: "FINAL_EXAM", label: "Final Exam",  gradient: "from-blue-500 to-blue-700" },
  { value: "MIDTERM",    label: "Midterm",     gradient: "from-violet-500 to-purple-700" },
  { value: "QUIZ",       label: "Quiz",        gradient: "from-emerald-500 to-teal-600" },
  { value: "ASSIGNMENT", label: "Assignment",  gradient: "from-orange-400 to-rose-500" },
  { value: "LAB_WORK",   label: "Lab Work",    gradient: "from-pink-500 to-fuchsia-600" },
  { value: "PROJECT",    label: "Project",     gradient: "from-cyan-500 to-sky-600" },
];

const FORM_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-700",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-pink-500 to-fuchsia-600",
  "from-cyan-500 to-sky-600",
];
const getFormGradient = (f) => FORM_GRADIENTS[(f - 1) % FORM_GRADIENTS.length];

const RANK_STYLES = {
  light: [
    "bg-yellow-100 text-yellow-800 border-yellow-300",
    "bg-gray-100 text-gray-700 border-gray-300",
    "bg-orange-100 text-orange-700 border-orange-300",
  ],
  dark: [
    "bg-yellow-900/50 text-yellow-300 border-yellow-600",
    "bg-gray-700 text-gray-200 border-gray-500",
    "bg-orange-900/50 text-orange-300 border-orange-600",
  ],
};
const getRankColor = (rank, isDark) =>
  RANK_STYLES[isDark ? "dark" : "light"][rank - 1]
  ?? (isDark ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-700 border-gray-200");
const getRankIcon  = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

const GRADE_COLORS = {
  light: {
    missing: "bg-red-100 text-red-600",
    g90: "bg-green-100 text-green-800",
    g80: "bg-blue-100 text-blue-800",
    g70: "bg-yellow-100 text-yellow-800",
    g60: "bg-orange-100 text-orange-800",
    low: "bg-red-100 text-red-800",
  },
  dark: {
    missing: "bg-red-900/60 text-red-300 border border-red-700/50",
    g90: "bg-green-900/50 text-green-300",
    g80: "bg-blue-900/50 text-blue-300",
    g70: "bg-yellow-900/50 text-yellow-300",
    g60: "bg-orange-900/50 text-orange-300",
    low: "bg-red-900/50 text-red-300",
  },
};
const getGradeColor = (val, isDark) => {
  const c = GRADE_COLORS[isDark ? "dark" : "light"];
  if (val == null) return c.missing;
  if (val >= 90) return c.g90;
  if (val >= 80) return c.g80;
  if (val >= 70) return c.g70;
  if (val >= 60) return c.g60;
  return c.low;
};

const calcGradePoint = (marks) => {
  if (marks == null) return null;
  if (marks >= 90) return 8;
  if (marks >= 80) return 7;
  if (marks >= 70) return 6;
  if (marks >= 60) return 5;
  if(marks >= 50) return 4;
  if(marks >=40) return 3;
  if(marks >=30) return 2;
  return 1;
};
const GP_COLORS = {
  light: {
    8: "bg-green-100 text-green-700",
    7: "bg-green-100 text-green-700",
    6: "bg-blue-100 text-blue-700",
    5: "bg-blue-100 text-blue-700",
    4: "bg-yellow-100 text-yellow-700",
    3: "bg-orange-100 text-orange-700",
    2: "bg-orange-100 text-orange-700",
    1: "bg-red-100 text-red-700",
    0: "bg-gray-100 text-gray-400",
  },
  dark: {
    8: "bg-green-900/50 text-green-300",
    7: "bg-green-900/50 text-green-300",
    6: "bg-blue-900/50 text-blue-300",
    5: "bg-blue-900/50 text-blue-300",
    4: "bg-yellow-900/50 text-yellow-300",
    3: "bg-orange-900/50 text-orange-300",
    2: "bg-orange-900/50 text-orange-300",
    1: "bg-red-900/50 text-red-300",
    0: "bg-gray-700 text-gray-400",
  },
};
const getGradePointColor = (pt, isDark) =>
  GP_COLORS[isDark ? "dark" : "light"][pt] ?? GP_COLORS[isDark ? "dark" : "light"][0];

const calcTotalPoints = (student) =>
  Object.values(student.subjectMarks ?? {})
    .reduce((sum, val) => sum + (calcGradePoint(val) ?? 0), 0);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />
);

// ─── Bulk progress modal ───────────────────────────────────────────────────────
function BulkProgressModal({ total, current, currentName, done, onClose, isDark }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className={`rounded-2xl p-8 w-[420px] shadow-2xl text-center ${
        isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
      }`}>
        {!done ? (
          <>
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-blue-600" />
            </div>
            <h2 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}>Generating Report Cards</h2>
            <p className={`text-sm mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {current} of {total} — <strong className={isDark ? "text-gray-200" : "text-gray-700"}>{currentName}</strong>
            </p>
            <div className={`rounded-full h-2.5 overflow-hidden mb-2 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm font-bold text-blue-600">{pct}%</p>
            <p className="text-xs text-gray-400 mt-2">Please keep this window open…</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-100" : "text-gray-900"}`}>All Done!</h2>
            <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {total} report card{total !== 1 ? "s" : ""} downloaded as a ZIP file.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
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
  const { isDark } = useTheme();

  const cardCls = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-100";
  const tableHeadCls = isDark ? "bg-gray-800/80" : "bg-gray-50";
  const tableSubHeadCls = isDark ? "bg-gray-800 border-t border-gray-700" : "bg-gray-100 border-t border-gray-200";
  const tableBodyCls = isDark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100";
  const colTotalMarks = isDark ? "bg-blue-950/40" : "bg-blue-50";
  const colTotalPts = isDark ? "bg-violet-950/40" : "bg-violet-50";
  const colReport = isDark ? "bg-teal-950/40" : "bg-teal-50";
  const textTotalMarks = isDark ? "text-blue-300" : "text-blue-800";
  const textTotalPts = isDark ? "text-violet-300" : "text-violet-800";
  const thTotalMarks = isDark ? "text-blue-300 bg-blue-950/40" : "text-blue-600 bg-blue-50";
  const thTotalPts = isDark ? "text-violet-300 bg-violet-950/40" : "text-violet-600 bg-violet-50";
  const thReport = isDark ? "text-teal-300 bg-teal-950/40" : "text-teal-600 bg-teal-50";
  const issueRowCls = isDark
    ? "bg-red-950/25 hover:bg-red-950/40"
    : "bg-red-50 hover:bg-red-100";
  const normalRowCls = isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50";

  const [loading,          setLoading]          = useState(true);
  const [classes,          setClasses]          = useState([]);
  const [error,            setError]            = useState(null);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [examType,         setExamType]         = useState("");
  const [periodId,         setPeriodId]         = useState("");
  const [allPeriods,       setAllPeriods]       = useState([]);
  const [currentPeriod,    setCurrentPeriod]    = useState(null);
  const [results,          setResults]          = useState(null);
  const [generating,       setGenerating]       = useState(false);
  const [genError,         setGenError]         = useState(null);
  const [search,           setSearch]           = useState("");
  const [showIssues,       setShowIssues]       = useState(false);
  const [bulkProgress,     setBulkProgress]     = useState(null);
  const [subjectRanking,        setSubjectRanking]        = useState(null);
  const [subjectRankingLoading, setSubjectRankingLoading] = useState(false);
  const [subjectRankingError,   setSubjectRankingError]   = useState(null);
  const [showSubjectRanking,    setShowSubjectRanking]    = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    Promise.all([getAllClasses(), getAllPeriods(), getCurrentPeriod()])
      .then(([cls, periods, period]) => {
        setClasses(cls);
        setAllPeriods(periods);
        setCurrentPeriod(period);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formGroups  = classes.reduce((acc, c) => { const f = c.formNumber; if (!acc[f]) acc[f] = []; acc[f].push(c); return acc; }, {});
  const sortedForms = Object.keys(formGroups).map(Number).sort((a, b) => a - b);
  const studentList = results?.students ?? [];

  const subjectNames = useMemo(() => {
    if (!results) return [];
    const allKeys = new Set();
    studentList.forEach((s) => Object.keys(s.subjectMarks ?? {}).forEach((k) => allKeys.add(k)));
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

  const allStreamsSelected = (fn) =>
    formGroups[fn].map((c) => c.classId).every((id) => selectedClassIds.includes(id));

  const canGenerate = selectedClassIds.length > 0 && examType && (periodId || currentPeriod);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true); setGenError(null); setResults(null);
    setSubjectRanking(null); setSubjectRankingError(null); setShowSubjectRanking(false);
    try {
      const data = await getResults(selectedClassIds, examType, periodId || null);
      setResults(data);
      if (data.hasIssues) setShowIssues(true);
    } catch (err) {
      setGenError(getFriendlyError(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setResults(null); setSelectedClassIds([]); setExamType(""); setPeriodId("");
    setGenError(null); setSearch(""); setShowIssues(false);
    setSubjectRanking(null); setSubjectRankingError(null); setShowSubjectRanking(false);
  };

  const handleToggleSubjectRanking = async () => {
    const nextShown = !showSubjectRanking;
    setShowSubjectRanking(nextShown);
    if (nextShown && !subjectRanking && !subjectRankingLoading) {
      setSubjectRankingLoading(true);
      setSubjectRankingError(null);
      try {
        const resolvedPeriodId = periodId || results?.periodId;
        const data = await getSubjectRanking(selectedClassIds, examType, resolvedPeriodId || null);
        setSubjectRanking(data);
      } catch (err) {
        setSubjectRankingError(getFriendlyError(err));
      } finally {
        setSubjectRankingLoading(false);
      }
    }
  };

  const handleViewReportCard = (student) => {
    const params = new URLSearchParams({
      studentId: student.studentId,
      classIds:  selectedClassIds.join(","),
      examType,
    });
    const resolvedPeriodId = periodId || results?.periodId;
    if (resolvedPeriodId) params.append("periodId", resolvedPeriodId);
    navigate(`/report-card?${params.toString()}`);
  };

  const handleExportExcel = () => {
    if (!results) return;
    const examLabel = EXAM_TYPES.find((e) => e.value === examType)?.label ?? examType;
    const rows = filteredStudents.map((student) => {
      const row = { Rank: student.rank, Student: student.studentName, Class: student.className };
      let totalPoints = 0;
      subjectNames.forEach((subj) => {
        const isEnrolled = subj in (student.subjectMarks ?? {});
        const val = isEnrolled ? student.subjectMarks[subj] : undefined;
        const gp  = isEnrolled ? calcGradePoint(val) : undefined;
        row[subj]           = !isEnrolled ? "N/A" : val ?? "Missing";
        row[`${subj} (GP)`] = !isEnrolled ? "N/A" : gp ?? "—";
        if (isEnrolled) totalPoints += gp ?? 0;
      });
      row["Total Marks"]  = student.totalMarks;
      row["Total Points"] = totalPoints;
      return row;
    });
    const avgRow = { Rank: "", Student: "Class Average", Class: "" };
    subjectNames.forEach((subj) => {
      avgRow[subj]            = subjectAvgs[subj] ?? "—";
      avgRow[`${subj} (GP)`] = calcGradePoint(subjectAvgs[subj]) ?? "—";
    });
    avgRow["Total Marks"] = results.overallAverage;
    avgRow["Total Points"] = "";
    rows.push(avgRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `Results_${examLabel.replace(/\s+/g, "_")}.xlsx`);
  };

const handleBulkDownload = async () => {
  if (!results || studentList.length === 0) return;
  abortRef.current = false;
  setBulkProgress({ total: studentList.length, current: 0, currentName: "", done: false });

  let iframe;
  try {
    const [html2pdfMod, JSZipMod, { saveAs }] = await Promise.all([
      import("html2pdf.js"),
      import("jszip"),
      import("file-saver"),
    ]);
    const html2pdf = html2pdfMod.default;
    const JSZip    = JSZipMod.default;
    const zip      = new JSZip();
    const examLabel   = EXAM_TYPES.find((e) => e.value === examType)?.label ?? examType;
    const classIdsStr = selectedClassIds.join(",");

    iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden";
    document.body.appendChild(iframe);

    let generatedCount = 0;
    for (let i = 0; i < studentList.length; i++) {
      if (abortRef.current) break;
      const student = studentList[i];
      setBulkProgress({ total: studentList.length, current: i + 1, currentName: student.studentName, done: false });
      const params = new URLSearchParams({ studentId: student.studentId, classIds: classIdsStr, examType });
      const resolvedPeriodId = periodId || results?.periodId;
      if (resolvedPeriodId) params.append("periodId", resolvedPeriodId);

      try {
        await new Promise((resolve) => { iframe.onload = resolve; iframe.src = `/report-card?${params.toString()}`; });
        await new Promise((r) => setTimeout(r, 2000));
        const rcRoot = iframe.contentDocument?.getElementById("rc-root");
        if (!rcRoot) continue;
        const cleanName = student.studentName?.replace(/\s+/g, "_") ?? "Student";
        const filename  = `${cleanName}_ID${student.studentId}_${examLabel.replace(/\s+/g, "_")}.pdf`;
        const pdfBlob = await html2pdf()
          .set({ margin: 0, filename, image: { type: "jpeg", quality: 0.97 }, html2canvas: { scale: 2, useCORS: true, width: 794, height: 1123, logging: false }, jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" } })
          .from(rcRoot).outputPdf("blob");
        zip.file(filename, pdfBlob);
        generatedCount++;
      } catch (studentErr) {
        console.error(`Failed to generate PDF for ${student.studentName} (ID ${student.studentId}):`, studentErr);
        // continue with remaining students instead of aborting the whole batch
      }
    }

    if (abortRef.current) {
      setBulkProgress(null);
      return;
    }
    if (generatedCount === 0) {
      setGenError("Couldn't generate any report cards. Please try again.");
      setBulkProgress(null);
      return;
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `ReportCards_${examLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.zip`);
    setBulkProgress((prev) => ({ ...prev, done: true }));
  } catch (err) {
    console.error("Bulk download failed:", err);
    setGenError(getFriendlyError(err));
    setBulkProgress(null);
  } finally {
    if (iframe) document.body.removeChild(iframe);
  }
};

  return (
    <div className="space-y-7">

      {bulkProgress && (
        <BulkProgressModal
          total={bulkProgress.total} current={bulkProgress.current}
          currentName={bulkProgress.currentName} done={bulkProgress.done}
          onClose={() => setBulkProgress(null)} isDark={isDark}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rankings</h1>
          <p className="text-gray-500 mt-0.5">Generate, view, and export ranked student results</p>
        </div>
        {results && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSubjectRanking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <Activity size={16} />
              {showSubjectRanking ? "Hide Subject Ranking" : "Subject Ranking"}
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <Download size={16} /> Export Excel
            </button>
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <Package size={16} /> Download All PDFs
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                border hover:-translate-y-0.5 transition-all duration-200 shadow-sm ${
                  isDark
                    ? "border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700"
                    : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                }`}>
              <RefreshCw size={16} /> New Results
            </button>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <UserMessage message={error} />
      )}

      {/* ── Selection Panel ── */}
      {!results && (
        <div className={`rounded-2xl shadow-sm border p-6 space-y-7 ${cardCls}`}>

          {/* Step 1 — Classes */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700
                flex items-center justify-center text-white text-xs font-bold shadow-sm">1</span>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Class(es)</p>
            </div>

            <div className="space-y-4">
              {sortedForms.map((formNumber) => {
                const streamClasses = formGroups[formNumber];
                const allSelected   = allStreamsSelected(formNumber);
                return (
                  <div key={`form-group-${formNumber}`}
                    className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getFormGradient(formNumber)}
                          flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                          G{formNumber}
                        </div>
                        <span className="font-bold text-gray-800 text-sm">Grade {formNumber}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                          {streamClasses.length} stream{streamClasses.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => selectAllStreams(formNumber)}
                        className={`text-xs px-3 py-1.5 rounded-xl border-2 font-semibold transition-all ${
                          allSelected
                            ? `bg-gradient-to-r ${getFormGradient(formNumber)} border-transparent text-white shadow-sm`
                            : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                        }`}>
                        {allSelected ? "✓ All Selected" : "Select All"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {streamClasses.map((c) => (
                        <button
                          key={`cls-${c.classId}`}
                          onClick={() => toggleClass(c.classId)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                            selectedClassIds.includes(c.classId)
                              ? `bg-gradient-to-r ${getFormGradient(formNumber)} border-transparent text-white shadow-sm`
                              : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                          }`}>
                          {c.className}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Step 2 — Academic Term */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600
                flex items-center justify-center text-white text-xs font-bold shadow-sm">2</span>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Academic Term</p>
            </div>
            <select
              value={periodId}
              onChange={(e) => { setPeriodId(e.target.value); setResults(null); }}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-teal-400 min-w-[240px]">
              <option value="">
                Current term{currentPeriod ? ` (${currentPeriod.year} · Term ${currentPeriod.term})` : ""}
              </option>
              {allPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.year} · Term {p.term}{p.status === "CLOSED" ? " (closed)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Step 3 — Exam Type */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700
                flex items-center justify-center text-white text-xs font-bold shadow-sm">3</span>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Exam Type</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {EXAM_TYPES.map((et) => (
                <button
                  key={et.value}
                  onClick={() => { setExamType(et.value); setResults(null); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    examType === et.value
                      ? `bg-gradient-to-r ${et.gradient} border-transparent text-white shadow-sm`
                      : "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"
                  }`}>
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Step 4 — Generate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className={`flex items-center gap-2 ${selectedClassIds.length > 0 ? "text-blue-700" : "text-gray-400"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${selectedClassIds.length > 0 ? "bg-blue-100" : "bg-gray-100"}`}>
                  {selectedClassIds.length > 0 ? "✓" : "·"}
                </div>
                {selectedClassIds.length > 0
                  ? <span className="font-semibold">{selectedClassIds.length} class{selectedClassIds.length > 1 ? "es" : ""} selected</span>
                  : <span>No classes selected</span>}
              </div>
              <div className={`flex items-center gap-2 ${(periodId || currentPeriod) ? "text-teal-700" : "text-gray-400"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${(periodId || currentPeriod) ? "bg-teal-100" : "bg-gray-100"}`}>
                  {(periodId || currentPeriod) ? "✓" : "·"}
                </div>
                {(periodId || currentPeriod)
                  ? <span className="font-semibold">
                      {periodId
                        ? (() => { const p = allPeriods.find((x) => String(x.id) === String(periodId)); return p ? `${p.year} · Term ${p.term}` : "Term selected"; })()
                        : `${currentPeriod.year} · Term ${currentPeriod.term} (current)`}
                    </span>
                  : <span>No term selected</span>}
              </div>
              <div className={`flex items-center gap-2 ${examType ? "text-violet-700" : "text-gray-400"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${examType ? "bg-violet-100" : "bg-gray-100"}`}>
                  {examType ? "✓" : "·"}
                </div>
                {examType
                  ? <span className="font-semibold">{EXAM_TYPES.find((e) => e.value === examType)?.label}</span>
                  : <span>No exam type selected</span>}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
                disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed">
              <Zap size={16} />
              {generating ? "Generating…" : "Generate Results"}
            </button>
          </div>

          {genError && (
            <UserMessage message={genError} />
          )}
        </div>
      )}

      {/* ── Results Panel ── */}
      {results && (
        <div className="space-y-5">

          {(results.periodYear != null) && (
            <div className={`text-sm rounded-xl px-4 py-3 border ${
              isDark
                ? "text-blue-300 bg-blue-950/30 border-blue-800"
                : "text-gray-600 bg-blue-50 border-blue-100"
            }`}>
              Results for <strong>{results.periodYear} · Term {results.periodTerm}</strong>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Students Ranked", value: studentList.length,
                icon: <Users size={20} className="text-white" />,
                gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
              },
              {
                label: "Subjects", value: subjectNames.length,
                icon: <BookOpen size={20} className="text-white" />,
                gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
              },
              {
                label: "Overall Average", value: results.overallAverage,
                icon: <BarChart size={20} className="text-white" />,
                gradient: "bg-gradient-to-br from-violet-500 to-purple-700",
              },
              results.hasIssues
                ? {
                    label: "Issues Found", value: issueStudents.length,
                    icon: <AlertTriangle size={20} className="text-white" />,
                    gradient: "bg-gradient-to-br from-orange-400 to-rose-500",
                  }
                : {
                    label: "All Complete", value: "✓",
                    icon: <CheckCircle size={20} className="text-white" />,
                    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
                  },
            ].map(({ label, value, icon, gradient }) => (
              <div key={label} className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold opacity-80">{label}</p>
                    <p className="text-3xl font-extrabold tracking-tight mt-1">{value}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Issues banner */}
          {results.hasIssues && (
            <div className={`border rounded-2xl p-4 ${
              isDark ? "bg-red-950/30 border-red-800" : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? "bg-red-900/50" : "bg-red-100"
                  }`}>
                    <AlertTriangle size={18} className={isDark ? "text-red-400" : "text-red-600"} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-red-300" : "text-red-800"}`}>
                      {issueStudents.length} student{issueStudents.length > 1 ? "s have" : " has"} missing marks
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-red-400" : "text-red-500"}`}>
                      Results include these students but their totals are incomplete.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIssues((p) => !p)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 text-white
                    rounded-xl font-semibold hover:bg-red-700 transition-colors">
                  {showIssues ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showIssues ? "Hide" : "Show"} Issues
                </button>
              </div>
              {showIssues && (
                <div className="mt-4 space-y-2">
                  {issueStudents.map((s) => (
                    <div key={`issue-${s.studentId}`}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                        isDark ? "bg-gray-800 border-red-900" : "bg-white border-red-100"
                      }`}>
                      <div>
                        <span className={`font-semibold text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>{s.studentName}</span>
                        <span className="ml-2 text-xs text-gray-400">({s.className})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(s.missingSubjects ?? []).map((subj) => (
                          <span key={`miss-${s.studentId}-${subj}`}
                            className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                              isDark ? "bg-red-900/60 text-red-300" : "bg-red-100 text-red-700"
                            }`}>
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

          {/* Search bar */}
          <div className={`rounded-2xl border shadow-sm p-4 ${cardCls}`}>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search student…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {filteredStudents.length} of {studentList.length} students
                </span>
                <span className={`text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border ${
                  isDark
                    ? "text-violet-300 bg-violet-950/40 border-violet-800"
                    : "text-violet-600 bg-violet-50 border-violet-100"
                }`}>
                  <Package size={12} /> ZIP available above
                </span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${cardCls}`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
                <thead>
                  <tr className={tableHeadCls}>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                    {subjectNames.map((subj) => (
                      <th key={`th-${subj}`}
                        className="px-4 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        colSpan={2}>
                        {subj}
                      </th>
                    ))}
                    <th className={`px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider ${thTotalMarks}`}>Total Marks</th>
                    <th className={`px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider ${thTotalPts}`}>Total Pts</th>
                    <th className={`px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap ${thReport}`}>Report Card</th>
                  </tr>
                  <tr className={tableSubHeadCls}>
                    <th colSpan={3} />
                    {subjectNames.map((subj) => (
                      <React.Fragment key={`sub-th-${subj}`}>
                        <th className="px-3 py-1.5 text-center text-xs text-gray-400 font-semibold">Marks</th>
                        <th className="px-3 py-1.5 text-center text-xs text-gray-400 font-semibold">GP</th>
                      </React.Fragment>
                    ))}
                    <th className={colTotalMarks} />
                    <th className={colTotalPts} />
                    <th className={colReport} />
                  </tr>
                </thead>

                <tbody className={tableBodyCls}>
                  {filteredStudents.map((student) => {
                    const totalPoints = calcTotalPoints(student);
                    return (
                      <tr key={`result-${student.studentId}`}
                        className={`transition-colors ${
                          student.hasIssues ? issueRowCls : normalRowCls
                        }`}>
                        {/* Rank */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full
                            text-sm font-bold border-2 ${getRankColor(student.rank, isDark)}`}>
                            {getRankIcon(student.rank)}
                          </span>
                        </td>

                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.hasIssues && <AlertTriangle size={14} className="text-red-400 shrink-0" />}
                            <div>
                              <div className={`font-semibold text-sm whitespace-nowrap ${isDark ? "text-gray-100" : "text-gray-900"}`}>{student.studentName}</div>
                              <div className="text-xs text-gray-400">ID #{student.studentId}</div>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${
                            isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                          }`}>
                            {student.className}
                          </span>
                        </td>

                        {/* Subject columns */}
                        {subjectNames.map((subj) => {
                          const isEnrolled = subj in (student.subjectMarks ?? {});
                          const val = isEnrolled ? student.subjectMarks[subj] : undefined;
                          const gp  = isEnrolled ? calcGradePoint(val) : undefined;
                          return (
                            <React.Fragment key={`mark-${student.studentId}-${subj}`}>
                              <td className="px-3 py-3 text-center">
                                {!isEnrolled ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                    isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-400"
                                  }`}>N/A</span>
                                ) : val == null ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                                    isDark ? "bg-red-900/60 text-red-300" : "bg-red-100 text-red-600"
                                  }`}>—</span>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${getGradeColor(val, isDark)}`}>
                                    {val % 1 === 0 ? val : val.toFixed(1)}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {!isEnrolled ? (
                                  <span className="text-gray-300 text-xs">N/A</span>
                                ) : gp == null ? (
                                  <span className="text-gray-300 text-xs">—</span>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getGradePointColor(gp, isDark)}`}>
                                    {gp}
                                  </span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Total marks */}
                        <td className={`px-4 py-3 text-center ${colTotalMarks}`}>
                          <span className={`font-bold text-sm ${textTotalMarks}`}>
                            {student.totalMarks % 1 === 0 ? student.totalMarks : student.totalMarks.toFixed(1)}
                          </span>
                        </td>

                        {/* Total points */}
                        <td className={`px-4 py-3 text-center ${colTotalPts}`}>
                          <span className={`font-bold text-sm ${textTotalPts}`}>{totalPoints}</span>
                        </td>

                        {/* Report card */}
                        <td className={`px-4 py-3 text-center ${colReport}`}>
                          <button
                            onClick={() => handleViewReportCard(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5
                              bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700
                              text-white text-xs font-semibold rounded-xl transition-all
                              hover:shadow-md active:scale-95 whitespace-nowrap">
                            <FileText size={12} /> Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Class averages row */}
                  {subjectNames.length > 0 && (
                    <tr className={`font-semibold border-t-2 ${
                      isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
                    }`}>
                      <td className="px-4 py-3" colSpan={2}>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Class Average</span>
                      </td>
                      <td className="px-4 py-3" />
                      {subjectNames.map((subj) => {
                        const avg = subjectAvgs[subj];
                        const gp  = calcGradePoint(avg);
                        return (
                          <React.Fragment key={`avg-${subj}`}>
                            <td className="px-3 py-3 text-center">
                              <span className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{avg ?? "—"}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {gp != null ? (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getGradePointColor(gp, isDark)}`}>
                                  {gp}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className={`px-4 py-3 text-center ${colTotalMarks}`}>
                        <span className={`font-bold ${textTotalMarks}`}>{results.overallAverage}</span>
                      </td>
                      <td className={`px-4 py-3 ${colTotalPts}`} />
                      <td className={`px-4 py-3 ${colReport}`} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="text-gray-300" size={28} />
                </div>
                <p className="text-gray-600 font-semibold">No students match your search</p>
                <p className="text-gray-400 text-sm mt-1">Try a different name or ID</p>
              </div>
            )}
          </div>

          {/* ── Subject Ranking by Class (mean + std deviation) ── */}
          {showSubjectRanking && (
            <div className={`rounded-2xl shadow-sm border p-6 space-y-6 ${cardCls}`}>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600
                  flex items-center justify-center text-white shadow-sm">
                  <Activity size={16} />
                </span>
                <div>
                  <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                    Subject Ranking by Class
                  </p>
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Subjects ranked by mean score within each class, with standard deviation
                  </p>
                </div>
              </div>

              {subjectRankingLoading && (
                <div className="space-y-2">
                  <Sk className="h-8 w-full" />
                  <Sk className="h-8 w-full" />
                  <Sk className="h-8 w-full" />
                </div>
              )}

              {subjectRankingError && (
                <UserMessage message={subjectRankingError} />
              )}

              {!subjectRankingLoading && subjectRanking && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {subjectRanking.classResults.map((cls) => (
                    <div key={`subj-rank-${cls.classId}`}
                      className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                      <div className={`px-4 py-2.5 font-bold text-sm ${
                        isDark ? "bg-gray-800/80 text-gray-200" : "bg-gray-50 text-gray-700"
                      }`}>
                        {cls.className}
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={isDark ? "text-gray-400" : "text-gray-500"}>
                            <th className="px-4 py-2 text-left font-semibold text-xs uppercase tracking-wider">Rank</th>
                            <th className="px-4 py-2 text-left font-semibold text-xs uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-2 text-center font-semibold text-xs uppercase tracking-wider">Mean</th>
                            <th className="px-4 py-2 text-center font-semibold text-xs uppercase tracking-wider">vs Last Term</th>
                            <th className="px-4 py-2 text-center font-semibold text-xs uppercase tracking-wider">Students</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
                          {cls.subjects.map((subj) => (
                            <tr key={`${cls.classId}-${subj.subjectName}`} className={normalRowCls}>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold border ${getRankColor(subj.rank, isDark)}`}>
                                  {subj.rank}
                                </span>
                              </td>
                              <td className={`px-4 py-2.5 font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                {subj.subjectName}
                              </td>
                              <td className={`px-4 py-2.5 text-center font-bold ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                                {subj.mean}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {subj.deviation == null ? (
                                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                    No prior data
                                  </span>
                                ) : (
                                  <span className={`text-sm font-semibold ${
                                    subj.deviation > 0
                                      ? (isDark ? "text-emerald-400" : "text-emerald-600")
                                      : subj.deviation < 0
                                        ? (isDark ? "text-red-400" : "text-red-600")
                                        : (isDark ? "text-gray-400" : "text-gray-500")
                                  }`}>
                                    {subj.deviation > 0 ? "▲ +" : subj.deviation < 0 ? "▼ " : "— "}
                                    {subj.deviation}
                                    <span className={`ml-1 font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                      (was {subj.previousMean})
                                    </span>
                                  </span>
                                )}
                              </td>
                              <td className={`px-4 py-2.5 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                {subj.studentCount}
                              </td>
                            </tr>
                          ))}
                          {cls.subjects.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-gray-400 text-sm">
                                No subject data for this class
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Rank 1 = highest mean score in that class this term. "vs Last Term" compares this
                term's mean to the same class + subject's mean last term — ▲ green means it improved,
                ▼ red means it dropped. "No prior data" means there's no earlier term on record, or
                that subject wasn't graded last term.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-right">
            Use <strong>Export Excel</strong> for a spreadsheet · <strong>Download All PDFs</strong> for a ZIP of all report cards
          </p>
        </div>
      )}
    </div>
  );
};

export default Results;