// pages/ReportCard.jsx
// Official, print-ready A4 report card.
// CBC scale: 8 levels (EE1 EE2 ME1 ME2 AE1 AE2 BE1 BE2) — synced to useReportCard.js.
//
// App.jsx — add inside the protected <Route path="/">:
//   import ReportCard from './pages/ReportCard';
//   <Route path="report-card" element={<ReportCard />} />
//
// Navigate from Results.jsx:
//   const p = new URLSearchParams({ studentId, classIds: selectedClassIds.join(","), examType });
//   navigate(`/report-card?${p}`);

import { useSearchParams, useNavigate } from "react-router-dom";
import { useReportCard } from "../hooks/useReportCard";
import { ArrowLeft, Printer, Loader2, AlertCircle, AlertTriangle } from "lucide-react";

// ─── CBC scale ────────────────────────────────────────────────────────────────
// MUST stay in sync with scoreToCBC() in useReportCard.js

const CBC_SCALE = [
  { level: "EE1", range: "90–100", desc: "Exceeds Expectation (Distinction)", color: "#14532d", bg: "#dcfce7" },
  { level: "EE2", range: "75–89",  desc: "Exceeds Expectation",               color: "#1e3a8a", bg: "#dbeafe" },
  { level: "ME1", range: "58–74",  desc: "Meets Expectation (Upper)",         color: "#065f46", bg: "#d1fae5" },
  { level: "ME2", range: "41–57",  desc: "Meets Expectation (Lower)",         color: "#854d0e", bg: "#fef9c3" },
  { level: "AE1", range: "31–40",  desc: "Approaches Expectation (Upper)",    color: "#9a3412", bg: "#ffedd5" },
  { level: "AE2", range: "21–30",  desc: "Approaches Expectation (Lower)",    color: "#7c2d12", bg: "#fed7aa" },
  { level: "BE1", range: "11–20",  desc: "Below Expectation (Upper)",         color: "#991b1b", bg: "#fee2e2" },
  { level: "BE2", range: "0–10",   desc: "Below Expectation (Lower)",         color: "#7f1d1d", bg: "#fecaca" },
];

const CBC_PALETTE = Object.fromEntries(
  CBC_SCALE.map(({ level, color, bg }) => [level, { color, bg }])
);

function cbcRemark(level) {
  const map = {
    EE1: "Exceeds Expectation — Distinction",
    EE2: "Exceeds Expectation",
    ME1: "Meets Expectation (Upper)",
    ME2: "Meets Expectation (Lower)",
    AE1: "Approaches Expectation (Upper)",
    AE2: "Approaches Expectation (Lower)",
    BE1: "Below Expectation (Upper)",
    BE2: "Below Expectation (Lower)",
  };
  return map[level] ?? "—";
}

function cbcBadge(level = "") {
  const p = CBC_PALETTE[level] ?? { bg: "#f1f5f9", color: "#475569" };
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 3,
    fontWeight: 800,
    fontSize: 11,
    background: p.bg,
    color: p.color,
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rankSuffix(n) {
  if (!n) return "—";
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
}

function fmt(val) {
  if (val == null) return "—";
  return val % 1 === 0 ? String(val) : val.toFixed(1);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAVY   = "#1e3a5f";
const SILVER = "#c8d4e8";

// ─── Print / font injection ───────────────────────────────────────────────────

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap');

  @media print {
    body * { visibility: hidden !important; }
    #rc-root, #rc-root * { visibility: visible !important; }
    #rc-root { position: fixed; inset: 0; overflow: hidden; }
    .no-print { display: none !important; }
    @page { size: A4 portrait; margin: 10mm 13mm; }
  }

  #rc-root {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 12px;
    line-height: 1.45;
    color: #111;
    background: #fff;
  }

  .rc-serif { font-family: 'EB Garamond', serif; }

  /* Ruled lines in remarks box */
  .rc-ruled-line {
    border-bottom: 1px solid #c8d4e8;
    height: 26px;
    width: 100%;
    display: block;
  }
`;

// ─── Inline style constants ───────────────────────────────────────────────────

const tdBase   = { padding: "5px 8px", borderBottom: `1px solid #e8edf5` };
const tdCenter = { ...tdBase, textAlign: "center" };
const tdLeft   = { ...tdBase, textAlign: "left"   };

// ─── Small reusable pieces ────────────────────────────────────────────────────

function SectionTitle({ children, mt = 18, mb = 8 }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.10em",
      color: NAVY,
      borderBottom: `1.5px solid ${SILVER}`,
      paddingBottom: 3,
      marginTop: mt, marginBottom: mb,
    }}>
      {children}
    </div>
  );
}

/** Ruled writing lines for handwritten remarks */
function RuledLines({ count = 4 }) {
  return (
    <div style={{ padding: "4px 0 2px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="rc-ruled-line" />
      ))}
    </div>
  );
}

/** Stamp-style watermark circle */
function StampWatermark() {
  return (
    <div style={{
      position: "absolute",
      bottom: 90, right: 52,
      width: 96, height: 96,
      borderRadius: "50%",
      border: `2.5px dashed ${NAVY}`,
      opacity: 0.12,
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        width: 78, height: 78, borderRadius: "50%",
        border: `1.5px dashed ${NAVY}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: NAVY, textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.4 }}>
          OFFICIAL<br />STAMP
        </span>
      </div>
    </div>
  );
}

// ─── Loading / Error screens ──────────────────────────────────────────────────

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
      <p className="text-gray-800 font-semibold text-center">Failed to load report</p>
      <p className="text-gray-500 text-sm text-center max-w-sm">{message}</p>
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 text-sm hover:underline mt-2">
        <ArrowLeft size={14} /> Go back
      </button>
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

  const {
    name, admissionNo, form, academicYear,
    examLabel, currentTermLabel,
    dateIssued,
    meanScore, meanLevel, meanGrade,
    totalMarks, totalPoints,
    rank, totalStudents,
    subjects,
    subjectAverages,
    teacherRemark, teacherName,
    hasIssues, missingSubjects,
  } = report;

  // Include ALL subjects in GP mean — missing ones contribute 0, so
  // incomplete records are penalised rather than silently excluded.
  const totalGP = subjects.reduce((sum, s) => sum + (s.gp ?? 0), 0);
  const meanGP  = subjects.length > 0
    ? (totalGP / subjects.length).toFixed(2)
    : "—";

  // CBC key split into 2 rows of 4
  const cbcRow1 = CBC_SCALE.slice(0, 4);
  const cbcRow2 = CBC_SCALE.slice(4);

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* ── Screen wrapper ── */}
      <div className="min-h-screen bg-slate-300 py-10 px-4">

        {/* Toolbar */}
        <div className="no-print max-w-[794px] mx-auto mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Results
          </button>

          <div className="flex items-center gap-2">
            {hasIssues && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 text-xs font-medium px-3 py-2 rounded-lg">
                <AlertTriangle size={13} />
                Incomplete marks: {missingSubjects.join(", ")}
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PRINTABLE A4 CARD
            ══════════════════════════════════════════════════════════════════ */}
        <div
          id="rc-root"
          className="max-w-[794px] mx-auto bg-white shadow-2xl"
          style={{ minHeight: 1123, padding: "30px 44px", position: "relative", boxSizing: "border-box" }}
        >
          <StampWatermark />

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <div style={{ borderBottom: `3px double ${NAVY}`, paddingBottom: 13, marginBottom: 16, textAlign: "center" }}>

            {/* Logo placeholder — replace <div> with <img src="/logo.png" alt="logo" style={{width:60,height:60}} /> */}
            <div style={{
              width: 58, height: 58, borderRadius: "50%",
              border: `2.5px solid ${NAVY}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 6, background: "#f0f4fa",
            }}>
              <span className="rc-serif" style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>S</span>
            </div>

            <h1 className="rc-serif" style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: "0.04em", margin: "0 0 2px" }}>
              SCHOOL NAME HERE
            </h1>
            <p style={{ fontSize: 10, color: "#555", margin: 0, letterSpacing: "0.07em" }}>
              P.O. BOX 0000 · NAIROBI · Tel: +254 700 000 000 · www.school.ac.ke
            </p>

            <div style={{ marginTop: 10 }}>
              <span style={{
                display: "inline-block", background: NAVY, color: "#fff",
                padding: "3px 28px", borderRadius: 2,
                letterSpacing: "0.12em", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase",
              }}>
                Student Academic Report Card — {examLabel}
              </span>
            </div>
          </div>

          {/* ── STUDENT DETAILS ─────────────────────────────────────────── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "4px 24px",
            background: "#f7f9fc", border: `1px solid ${SILVER}`,
            borderRadius: 4, padding: "11px 15px", marginBottom: 0, fontSize: 11.5,
          }}>
            {[
              ["Student Name",  name],
              ["Admission No.", admissionNo],
              ["Class / Form",  form],
              ["Academic Year", academicYear],
              ["Exam / Term",   examLabel],
              ["Date Issued",   dateIssued],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: 6, alignItems: "baseline", borderBottom: `1px dotted #d0daea`, paddingBottom: 3 }}>
                <span style={{
                  color: "#4a5e7a", minWidth: 100, fontWeight: 600,
                  fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                }}>
                  {label}
                </span>
                <span style={{ fontWeight: 700, color: "#0f1f3d", fontSize: 12 }}>{value ?? "—"}</span>
              </div>
            ))}
          </div>

          {/* ── SUBJECT PERFORMANCE TABLE ───────────────────────────────── */}
          <SectionTitle mt={16} mb={7}>Subject Performance</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: NAVY, color: "#fff" }}>
                {[
                  { label: "#",           align: "center" },
                  { label: "Subject",     align: "left"   },
                  { label: "Score",       align: "center" },
                  { label: "Grade Point", align: "center" },
                  { label: "CBC Level",   align: "center" },
                  { label: "Remarks",     align: "left"   },
                ].map(({ label, align }) => (
                  <th key={label} style={{
                    padding: "6px 8px", textAlign: align,
                    fontWeight: 700, fontSize: 9.5, letterSpacing: "0.06em",
                    textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {subjects.map((s, i) => {
                const bg = i % 2 === 0 ? "#fff" : "#f4f7fb";
                const avg = subjectAverages?.[s.name];
                return (
                  <tr key={s.name} style={{ background: bg }}>
                    {/* # */}
                    <td style={{ ...tdCenter, color: "#9ca3af", fontSize: 10.5 }}>{i + 1}</td>

                    {/* Subject name */}
                    <td style={{ ...tdLeft, fontWeight: 600 }}>
                      {s.missing && (
                        <AlertTriangle size={10} style={{ display: "inline", color: "#d97706", marginRight: 3, verticalAlign: "middle" }} />
                      )}
                      {s.name}
                      {avg != null && (
                        <span style={{ fontSize: 9.5, color: "#b0bcd0", marginLeft: 5, fontWeight: 400 }}>
                          avg {fmt(avg)}
                        </span>
                      )}
                    </td>

                    {/* Score */}
                    <td style={{
                      ...tdCenter,
                      fontWeight: 700,
                      color: s.missing ? "#ef4444" : "#0f1f3d",
                      fontSize: 12.5,
                    }}>
                      {s.score != null ? fmt(s.score) : "—"}
                    </td>

                    {/* Grade Point */}
                    <td style={{ ...tdCenter, color: "#374151" }}>
                      {s.gp != null ? s.gp : "—"}
                    </td>

                    {/* CBC Level badge */}
                    <td style={tdCenter}>
                      <span style={cbcBadge(s.level)}>{s.level !== "—" ? s.level : "—"}</span>
                    </td>

                    {/* Remark */}
                    <td style={{ ...tdLeft, color: "#4a5e7a", fontStyle: "italic", fontSize: 11 }}>
                      {cbcRemark(s.level)}
                    </td>
                  </tr>
                );
              })}

              {/* Overall totals row */}
              <tr style={{ background: "#e8eef7", borderTop: `2.5px solid ${NAVY}` }}>
                <td colSpan={2} style={{
                  ...tdLeft, fontWeight: 700,
                  textTransform: "uppercase", fontSize: 9.5, letterSpacing: "0.06em",
                }}>
                  Overall / Average
                </td>
                <td style={{ ...tdCenter, fontWeight: 800, fontSize: 14, color: NAVY }}>
                  {fmt(meanScore)}
                </td>
                <td style={{ ...tdCenter, fontWeight: 700, color: NAVY }}>
                  {meanGP}
                </td>
                <td style={tdCenter}>
                  <span style={cbcBadge(meanLevel)}>{meanLevel}</span>
                </td>
                <td style={{ ...tdLeft, fontWeight: 700, color: NAVY, fontStyle: "italic" }}>
                  {cbcRemark(meanLevel)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── PERFORMANCE SUMMARY CARDS ─────────────────────────────── */}
          <SectionTitle mt={16} mb={7}>Performance Summary</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[
              { label: "Mean Score",     value: `${fmt(meanScore)}%`       },
              { label: "Mean Grade",     value: meanGrade                   },
              { label: "CBC Level",      value: meanLevel                   },
              { label: "Class Position", value: rankSuffix(rank)            },
              { label: "Out of",         value: `${totalStudents} students` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                border: `1px solid ${SILVER}`, borderTop: `3px solid ${NAVY}`,
                borderRadius: 4, padding: "8px 6px",
                textAlign: "center", background: "#f7f9fc",
              }}>
                <div style={{
                  fontSize: 8.5, color: "#4a5e7a",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  fontWeight: 700, marginBottom: 4,
                }}>
                  {label}
                </div>
                <div className="rc-serif" style={{ fontSize: 17, fontWeight: 700, color: "#0f1f3d", lineHeight: 1 }}>
                  {value ?? "—"}
                </div>
              </div>
            ))}
          </div>

          {/* ── CBC GRADING SCALE KEY ─────────────────────────────────── */}
          <SectionTitle mt={16} mb={7}>CBC Grading Scale</SectionTitle>
          {[cbcRow1, cbcRow2].map((row, ri) => (
            <div key={ri} style={{
              display: "flex",
              border: `1px solid ${SILVER}`,
              borderTop: ri === 1 ? "none" : `1px solid ${SILVER}`,
              borderRadius: ri === 0 ? "4px 4px 0 0" : "0 0 4px 4px",
              overflow: "hidden",
            }}>
              {row.map(({ level, range, desc, color, bg }, ci) => (
                <div key={level} style={{
                  flex: 1, background: bg,
                  borderRight: ci < row.length - 1 ? `1px solid ${SILVER}` : "none",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "6px 3px", textAlign: "center",
                }}>
                  <span style={{ fontWeight: 800, color, fontSize: 12.5 }}>{level}</span>
                  <span style={{ color: "#374151", fontSize: 9, fontWeight: 600 }}>{range}</span>
                  <span style={{ color: "#6b7280", fontSize: 8, marginTop: 1, lineHeight: 1.3 }}>{desc}</span>
                </div>
              ))}
            </div>
          ))}

          {/* ── CLASS TEACHER'S REMARKS ───────────────────────────────── */}
          <SectionTitle mt={16} mb={7}>Class Teacher's Remarks</SectionTitle>
          <div style={{
            border: `1px solid ${SILVER}`,
            borderLeft: `4px solid ${NAVY}`,
            borderRadius: 4,
            padding: "10px 14px 6px",
            background: "#f7f9fc",
          }}>
            {teacherRemark ? (
              /* If API returns a remark, display it styled */
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.75, color: "#2d3748", fontStyle: "italic" }}>
                {teacherRemark}
              </p>
            ) : (
              /* Otherwise show ruled lines for handwriting */
              <RuledLines count={4} />
            )}
          </div>

          {/* ── SIGNATURE BLOCK ───────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginTop: 20, marginBottom: 20 }}>
            {[
              { role: "Class Teacher", sub: teacherName ?? "" },
              { role: "Head of Dept.", sub: "" },
              { role: "Principal",     sub: "" },
            ].map(({ role, sub }) => (
              <div key={role} style={{ textAlign: "center" }}>
                {/* Signature space */}
                <div style={{ height: 36, borderBottom: `1px solid #333`, marginBottom: 4 }} />
                <div style={{
                  fontSize: 9.5, fontWeight: 700, color: NAVY,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {role}
                </div>
                {sub && (
                  <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{sub}</div>
                )}
                <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>Signature &amp; Date</div>
              </div>
            ))}
          </div>

          {/* ── FOOTER ────────────────────────────────────────────────── */}
          <div style={{
            borderTop: `2px solid ${NAVY}`, paddingTop: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 9, color: "#6b7280",
          }}>
            <span>
              Official Academic Document — Not valid without school stamp &amp; authorised signature.
            </span>
            <span style={{ whiteSpace: "nowrap", marginLeft: 10 }}>
              {currentTermLabel} · {academicYear}
            </span>
          </div>

        </div>
        {/* end #rc-root */}

      </div>
    </>
  );
}