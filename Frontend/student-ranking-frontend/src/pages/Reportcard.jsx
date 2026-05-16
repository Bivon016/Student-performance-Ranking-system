// pages/ReportCard.jsx
// Official, print-ready A4 report card.
// All field references match useReportCard hook output exactly.
//
// Route (add inside protected <Route path="/"> in App.jsx):
//   <Route path="report-card" element={<ReportCard />} />
//
// Navigate from Results.jsx:
//   const p = new URLSearchParams({ studentId, classIds: selectedClassIds.join(","), examType });
//   navigate(`/report-card?${p}`);

import { useSearchParams, useNavigate } from "react-router-dom";
import { useReportCard } from "../hooks/useReportCard";
import { ArrowLeft, Printer, Loader2, AlertCircle, AlertTriangle } from "lucide-react";

// ─── CBC helpers (self-contained so this file has zero external deps) ─────────

function scoreToCBC(score) {
  if (score == null) return "—";
  if (score >= 90) return "EE1";
  if (score >= 75) return "EE2";
  if (score >= 50) return "ME";
  if (score >= 25) return "AE";
  return "BE";
}

function cbcRemark(level) {
  const map = {
    EE1: "Exceeds Expectation",
    EE2: "Exceeds Expectation",
    ME:  "Meets Expectation",
    AE:  "Approaches Expectation",
    BE:  "Below Expectation",
  };
  return map[level] ?? "—";
}

function rankSuffix(n) {
  if (!n) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// ─── Print / font styles ─────────────────────────────────────────────────────

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap');

  @media print {
    body * { visibility: hidden !important; }
    #report-printable, #report-printable * { visibility: visible !important; }
    #report-printable { position: fixed; inset: 0; }
    .no-print { display: none !important; }
    @page { size: A4 portrait; margin: 12mm 14mm; }
  }

  #report-printable {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 13px;
    color: #111;
    background: #fff;
  }

  .rc-display-font { font-family: 'EB Garamond', serif; }
`;

// ─── Loading / Error screens ─────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
      <Loader2 size={28} className="text-blue-700 animate-spin" />
      <p className="text-gray-500 text-sm font-medium">Loading report card…</p>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 px-6">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-gray-800 font-semibold">Failed to load report</p>
      <p className="text-gray-500 text-sm text-center max-w-sm">{message}</p>
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 text-sm hover:underline mt-2">
        <ArrowLeft size={14} /> Go back
      </button>
    </div>
  );
}

// ─── Inline style constants ───────────────────────────────────────────────────

const tdBase   = { padding: "6px 10px", borderBottom: "1px solid #e2e8f0" };
const tdCenter = { ...tdBase, textAlign: "center" };
const tdLeft   = { ...tdBase, textAlign: "left" };

function cbcBadge(level = "") {
  const palettes = {
    EE1: { bg: "#dcfce7", color: "#166534" },
    EE2: { bg: "#dbeafe", color: "#1e40af" },
    ME:  { bg: "#fef9c3", color: "#854d0e" },
    AE:  { bg: "#ffedd5", color: "#9a3412" },
    BE:  { bg: "#fee2e2", color: "#991b1b" },
  };
  const p = palettes[level] ?? { bg: "#f1f5f9", color: "#475569" };
  return {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 3,
    fontWeight: 800,
    fontSize: 12,
    background: p.bg,
    color: p.color,
    letterSpacing: "0.06em",
  };
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "#1e3a5f",
      borderBottom: "1px solid #c8d4e8",
      paddingBottom: 4,
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportCard() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const studentId = searchParams.get("studentId");
  const classIds  = (searchParams.get("classIds") ?? "").split(",").filter(Boolean);
  const examType  = searchParams.get("examType") ?? "FINAL_EXAM";

  const { report, loading, error } = useReportCard(studentId, classIds, examType);

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} onBack={() => navigate(-1)} />;
  if (!report) return <ErrorScreen message="No data returned from server." onBack={() => navigate(-1)} />;

  // ── Derived values (all sourced from hook output, no undefined refs) ────────
  //
  // report.examLabel        ← "Final Exam", "Midterm Exam" etc.
  // report.currentTermLabel ← same as examLabel (alias)
  // report.meanLevel        ← CBC level for mean score e.g. "ME"
  // report.subjects[n].score  ← numeric mark (alias for .total)
  // report.subjects[n].level  ← CBC level per subject
  //
  // All of the above are set by useReportCard — nothing will be undefined.

  const {
    name, admissionNo, form, academicYear,
    examLabel, currentTermLabel,
    dateIssued,
    meanScore, meanLevel,
    totalMarks, rank, totalStudents,
    subjects,
    teacherRemark, teacherName,
    hasIssues, missingSubjects,
  } = report;

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div className="min-h-screen bg-gray-200 py-8 px-4">

        {/* Toolbar */}
        <div className="no-print max-w-[794px] mx-auto mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Results
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

        {/* Issues notice (screen only) */}
        {hasIssues && (
          <div className="no-print max-w-[794px] mx-auto mb-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-amber-800 text-sm">
              <strong>Incomplete marks:</strong> {missingSubjects.join(", ")}. Totals shown are based on available data only.
            </p>
          </div>
        )}

        {/* ── PRINTABLE CARD ─────────────────────────────────────────────── */}
        <div
          id="report-printable"
          className="max-w-[794px] mx-auto bg-white shadow-xl"
          style={{ minHeight: 1123, padding: "36px 48px" }}
        >

          {/* HEADER */}
          <div style={{ borderBottom: "3px double #1e3a5f", paddingBottom: 16, marginBottom: 20 }}>
            <div className="text-center" style={{ marginBottom: 10 }}>
              {/* School logo placeholder — swap the S for an <img> */}
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "2px solid #1e3a5f",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 8px",
                background: "#f0f4fa",
              }}>
                <span className="rc-display-font" style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}>S</span>
              </div>
              <h1
                className="rc-display-font"
                style={{ fontSize: 24, fontWeight: 700, color: "#1e3a5f", letterSpacing: "0.04em", margin: 0 }}
              >
                SCHOOL NAME HERE
              </h1>
              <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0", letterSpacing: "0.08em" }}>
                P.O. BOX 0000 · NAIROBI · Tel: +254 700 000 000
              </p>
            </div>
            <div className="text-center" style={{ marginTop: 12 }}>
              <div style={{
                display: "inline-block",
                background: "#1e3a5f", color: "#fff",
                padding: "4px 32px", borderRadius: 2,
                letterSpacing: "0.12em", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase",
              }}>
                Student Academic Report Card — {examLabel}
              </div>
            </div>
          </div>

          {/* STUDENT INFO GRID */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "6px 32px",
            background: "#f7f9fc", border: "1px solid #c8d4e8",
            borderRadius: 4, padding: "14px 18px", marginBottom: 22, fontSize: 12.5,
          }}>
            {[
              ["Student Name",  name],
              ["Admission No.", admissionNo],
              ["Class / Form",  form],
              ["Academic Year", academicYear],
              ["Exam / Term",   examLabel],
              ["Date Issued",   dateIssued],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: 6, alignItems: "baseline", borderBottom: "1px dotted #d0daea", paddingBottom: 4 }}>
                <span style={{ color: "#4a5e7a", minWidth: 110, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </span>
                <span style={{ fontWeight: 700, color: "#0f1f3d", flex: 1 }}>{value ?? "—"}</span>
              </div>
            ))}
          </div>

          {/* SUBJECT RESULTS TABLE */}
          <SectionTitle>Subject Performance</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 22 }}>
            <thead>
              <tr style={{ background: "#1e3a5f", color: "#fff" }}>
                {["#", "Subject", "Score (%)", "CBC Level", "Remarks"].map((h) => (
                  <th key={h} style={{
                    padding: "7px 10px",
                    textAlign: (h === "#" || h === "Score (%)" || h === "CBC Level") ? "center" : "left",
                    fontWeight: 700, fontSize: 11, letterSpacing: "0.05em",
                    textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => {
                // s.score is set by the hook (alias for s.total)
                // s.level is the CBC level string e.g. "ME"
                const score  = s.score;                    // ← correct field name
                const level  = s.level ?? scoreToCBC(score); // ← hook sets this, fallback just in case
                const remark = cbcRemark(level);
                const isEven = i % 2 === 0;
                return (
                  <tr key={s.name} style={{ background: isEven ? "#fff" : "#f4f7fb" }}>
                    <td style={tdCenter}>{i + 1}</td>
                    <td style={{ ...tdLeft, fontWeight: 600 }}>
                      {s.missing && <AlertTriangle size={11} style={{ display: "inline", color: "#d97706", marginRight: 4, verticalAlign: "middle" }} />}
                      {s.name}
                    </td>
                    <td style={{ ...tdCenter, fontWeight: 700, color: score == null ? "#ef4444" : "inherit" }}>
                      {score != null ? (score % 1 === 0 ? score : score.toFixed(1)) : "—"}
                    </td>
                    <td style={tdCenter}>
                      <span style={cbcBadge(level)}>{level}</span>
                    </td>
                    <td style={{ ...tdLeft, color: "#4a5e7a", fontStyle: "italic" }}>{remark}</td>
                  </tr>
                );
              })}

              {/* Totals row */}
              <tr style={{ background: "#e8eef7", borderTop: "2px solid #1e3a5f" }}>
                <td colSpan={2} style={{ ...tdLeft, fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>
                  Total / Average
                </td>
                {/* totalMarks from hook */}
                <td style={{ ...tdCenter, fontWeight: 800, fontSize: 14, color: "#1e3a5f" }}>
                  {totalMarks}
                </td>
                {/* meanLevel from hook */}
                <td style={tdCenter}>
                  <span style={cbcBadge(meanLevel)}>{meanLevel}</span>
                </td>
                <td style={{ ...tdLeft, fontWeight: 700, color: "#1e3a5f" }}>{cbcRemark(meanLevel)}</td>
              </tr>
            </tbody>
          </table>

          {/* PERFORMANCE SUMMARY */}
          <SectionTitle>Performance Summary</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Mean Score",  value: meanScore,             unit: "%"        },
              { label: "CBC Level",   value: meanLevel,             unit: ""         },
              { label: "Position",    value: rankSuffix(rank),      unit: ""         },
              { label: "Out of",      value: totalStudents,         unit: " students"},
            ].map(({ label, value, unit }) => (
              <div key={label} style={{
                border: "1px solid #c8d4e8",
                borderTop: "3px solid #1e3a5f",
                borderRadius: 4, padding: "10px 12px",
                textAlign: "center", background: "#f7f9fc",
              }}>
                <div style={{ fontSize: 11, color: "#4a5e7a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>
                  {label}
                </div>
                <div className="rc-display-font" style={{ fontSize: 22, fontWeight: 700, color: "#0f1f3d", lineHeight: 1.1 }}>
                  {value ?? "—"}{unit}
                </div>
              </div>
            ))}
          </div>

          {/* CBC GRADING SCALE */}
          <div style={{ marginBottom: 22 }}>
            <SectionTitle>CBC Grading Scale</SectionTitle>
            <div style={{ display: "flex", gap: 0, border: "1px solid #c8d4e8", borderRadius: 4, overflow: "hidden", fontSize: 11 }}>
              {[
                ["EE1", "90–100", "Exceeds Expectation (Highest)", "#166534", "#dcfce7"],
                ["EE2", "75–89",  "Exceeds Expectation",           "#1e40af", "#dbeafe"],
                ["ME",  "50–74",  "Meets Expectation",             "#854d0e", "#fef9c3"],
                ["AE",  "25–49",  "Approaches Expectation",        "#9a3412", "#ffedd5"],
                ["BE",  "0–24",   "Below Expectation",             "#991b1b", "#fee2e2"],
              ].map(([level, range, desc, color, bg]) => (
                <div key={level} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "8px 4px", background: bg, flex: 1,
                  borderRight: "1px solid #c8d4e8", textAlign: "center",
                }}>
                  <span style={{ fontWeight: 800, color, fontSize: 14 }}>{level}</span>
                  <span style={{ color: "#374151", fontSize: 10, fontWeight: 600 }}>{range}</span>
                  <span style={{ color: "#6b7280", fontSize: 9, marginTop: 2 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TEACHER REMARKS */}
          <SectionTitle>Class Teacher's Remarks</SectionTitle>
          <div style={{
            border: "1px solid #c8d4e8",
            borderLeft: "4px solid #1e3a5f",
            borderRadius: 4, padding: "12px 16px",
            background: "#f7f9fc", marginBottom: 28,
            fontSize: 12.5, lineHeight: 1.7, color: "#2d3748", fontStyle: "italic",
          }}>
            {teacherRemark ??
              "The student has demonstrated commendable effort throughout this term. Continued commitment to academic excellence is encouraged."}
          </div>

          {/* SIGNATURE BLOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>
            {[
              { role: "Class Teacher", name: teacherName ?? "" },
              { role: "Head of Dept.", name: "" },
              { role: "Principal",     name: "" },
            ].map(({ role, name: sigName }) => (
              <div key={role} style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #333", marginBottom: 4, height: 36 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.05em" }}>{role}</div>
                {sigName && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{sigName}</div>}
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div style={{
            borderTop: "2px solid #1e3a5f", paddingTop: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 10, color: "#6b7280",
          }}>
            <span>Official Academic Document — Not valid without school stamp &amp; authorised signature.</span>
            {/* currentTermLabel — set by hook as alias for examLabel */}
            <span>{currentTermLabel} · {academicYear}</span>
          </div>

        </div>
        {/* end printable */}
      </div>
    </>
  );
}