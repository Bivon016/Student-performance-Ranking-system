// pages/ReportCard.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useReportCard } from "../hooks/Usereportcard";
import { useSchool } from "../hooks/useSchool";
import { resolveLogoUrl } from "../utils/logoUrl";
import { ArrowLeft, Printer, Loader2, AlertCircle, AlertTriangle } from "lucide-react";

const CBC_SCALE = [
  { level: "EE1", range: "90–100", color: "#166534", bg: "#dcfce7" },
  { level: "EE2", range: "80–89",  color: "#1e40af", bg: "#dbeafe" },
  { level: "ME1", range: "70–79",  color: "#065f46", bg: "#d1fae5" },
  { level: "ME2", range: "60–69",  color: "#854d0e", bg: "#fef9c3" },
  { level: "AE1", range: "50–59",  color: "#9a3412", bg: "#ffedd5" },
  { level: "AE2", range: "40–49",  color: "#7c2d12", bg: "#fed7aa" },
  { level: "BE1", range: "30–39",  color: "#991b1b", bg: "#fee2e2" },
  { level: "BE2", range: "0–29",   color: "#7f1d1d", bg: "#fecaca" },
];

const CBC_MAP = {
  EE1: "Exceeds Expectation (Distinction)",
  EE2: "Exceeds Expectation",
  ME1: "Meets Expectation (Upper)",
  ME2: "Meets Expectation (Lower)",
  AE1: "Approaches Expectation (Upper)",
  AE2: "Approaches Expectation (Lower)",
  BE1: "Below Expectation (Upper)",
  BE2: "Below Expectation (Lower)",
};

const CBC_PALETTE = Object.fromEntries(CBC_SCALE.map(({ level, color, bg }) => [level, { color, bg }]));

function cbcBadge(level = "") {
  const p = CBC_PALETTE[level] ?? { bg: "#f1f5f9", color: "#64748b" };
  return {
    display: "inline-block", padding: "1px 7px", borderRadius: 3,
    fontWeight: 800, fontSize: 9.5, background: p.bg, color: p.color,
    letterSpacing: "0.05em", whiteSpace: "nowrap", border: `1px solid ${p.color}22`,
  };
}

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

const INK   = "#0f1923";
const GOLD  = "#b8860b";
const GOLD2 = "#d4a017";
const CREAM = "#fdfaf4";
const RULE  = "#d6cdb8";
const MUTED = "#7a6f5e";

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap');
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @media print {
    html, body { margin: 0; padding: 0; }
    body * { visibility: hidden !important; }
    #rc-root, #rc-root * { visibility: visible !important; }
    #rc-root {
      position: fixed !important; inset: 0 !important;
      width: 210mm !important; height: 297mm !important;
      margin: 0 !important; padding: 0 !important;
      box-shadow: none !important; border-radius: 0 !important;
    }
    .no-print { display: none !important; }
    @page { size: A4 portrait; margin: 0; }
  }
  #rc-root { font-family: 'Source Serif 4', Georgia, serif; color: ${INK}; background: ${CREAM}; }
  .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
`;

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#f8f5ef" }}>
      <Loader2 size={28} style={{ color: GOLD }} className="animate-spin" />
      <p style={{ color: MUTED, fontSize: 14 }}>Preparing report card…</p>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
      <AlertCircle size={32} style={{ color: "#dc2626" }} />
      <p style={{ fontWeight: 600 }}>Failed to load report</p>
      <p style={{ color: MUTED, fontSize: 13, maxWidth: 360, textAlign: "center" }}>{message}</p>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, color: GOLD, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
        <ArrowLeft size={14} /> Go back
      </button>
    </div>
  );
}

function SchoolLogo({ school }) {
  const logoSrc = resolveLogoUrl(school?.schoolLogo);
  if (logoSrc) {
    return (
      <img src={logoSrc} alt="logo"
        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto 5px", border: `2px solid ${GOLD}` }}
        onError={e => { e.target.style.display = "none"; }} />
    );
  }
  const initials = (school?.schoolName ?? "S").split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase() || "S";
  return (
    <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", background: "#faf7ef" }}>
      <span className="cg" style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>{initials}</span>
    </div>
  );
}

export default function ReportCard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const studentId = searchParams.get("studentId");
  const classIds  = (searchParams.get("classIds") ?? "").split(",").filter(Boolean);
  const examType  = searchParams.get("examType") ?? "FINAL_EXAM";
  const periodId  = searchParams.get("periodId");

  const { report, loading: rLoad, error: rErr } = useReportCard(studentId, classIds, examType, periodId);
  const { school, loading: sLoad } = useSchool();

  if (rLoad || sLoad) return <LoadingScreen />;
  if (rErr) return <ErrorScreen message={rErr} onBack={() => navigate(-1)} />;
  if (!report) return <ErrorScreen message="No report data." onBack={() => navigate(-1)} />;

  const {
    name, admissionNo, form, academicYear, examLabel, currentTermLabel,
    dateIssued, meanScore, meanLevel, subjects, subjectAverages,
    teacherRemark, teacherName, hasIssues, missingSubjects, totalStudents, rank,
  } = report;

  const schoolName  = school?.schoolName ?? "School Name";
  const schoolMotto = school?.motto ?? school?.schoolMotto ?? "";
  const contact = [
    school?.postalAddress, school?.city, school?.country,
    school?.phoneNumber && `Tel: ${school.phoneNumber}`,
    school?.email,
  ].filter(Boolean).join("  ·  ");

  const totalGP = subjects.reduce((s, x) => s + (x.gp ?? 0), 0);
  const meanGP  = subjects.length ? (totalGP / subjects.length).toFixed(2) : "—";

  const handlePrint = () => {
    const t = document.title;
    const cleanName = name?.replace(/\s+/g, "_") ?? "Student";
    const cleanExam = examLabel?.replace(/\s+/g, "_") ?? "Report";
    document.title = `${cleanName}_ID${studentId}_${cleanExam}`;
    window.print();
    document.title = t;
  };

  const RemarksBlock = ({ label, remark, signerName }) => (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ border: `1px solid ${RULE}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 3, padding: "6px 12px", background: "#fff", minHeight: 52 }}>
        {remark
          ? <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: INK, fontStyle: "italic" }}>{remark}</p>
          : <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 40 }}>{[1,2,3].map(i => <div key={i} style={{ borderBottom: `1px dashed ${RULE}`, height: 1 }} />)}</div>
        }
      </div>
      {signerName && (
        <div style={{ marginTop: 3, fontSize: 8.5, color: MUTED, textAlign: "right", fontStyle: "italic" }}>
          — {signerName}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{PRINT_STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#e8e3da", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Toolbar */}
        <div className="no-print" style={{ width: "100%", maxWidth: 794, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: INK, background: "#fff", border: `1px solid ${RULE}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {hasIssues && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#fefce8", border: "1px solid #ca8a04", color: "#854d0e", fontSize: 12, padding: "5px 12px", borderRadius: 8 }}>
                <AlertTriangle size={12} /> Incomplete: {missingSubjects.join(", ")}
              </span>
            )}
            <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#fff", background: INK, border: "none", borderRadius: 8, padding: "7px 18px", cursor: "pointer" }}>
              <Printer size={14} /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* A4 Card — width fixed at 794px, height grows with content on screen, locked to A4 on print */}
        <div id="rc-root" style={{
          width: 794,
          background: CREAM,
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}>

          {/* Gold top stripe */}
          <div style={{ height: 6, background: `linear-gradient(90deg,${GOLD},${GOLD2},${GOLD})`, flexShrink: 0 }} />

          {/* HEADER */}
          <div style={{ padding: "10px 28px 8px", textAlign: "center", borderBottom: `1.5px solid ${RULE}`, flexShrink: 0, background: `linear-gradient(180deg,#fdf8ee,${CREAM})` }}>
            <SchoolLogo school={school} />
            <h1 className="cg" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.12em", color: INK, margin: "0 0 1px", textTransform: "uppercase" }}>{schoolName}</h1>
            {schoolMotto && <p className="cg" style={{ fontSize: 11, fontStyle: "italic", color: GOLD, margin: "0 0 2px", letterSpacing: "0.04em" }}>"{schoolMotto}"</p>}
            <p style={{ fontSize: 9, color: MUTED, margin: "0 0 6px", letterSpacing: "0.03em" }}>{contact}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ height: 1, width: 40, background: GOLD }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD }}>Student Academic Report Card — {examLabel}</span>
              <div style={{ height: 1, width: 40, background: GOLD }} />
            </div>
          </div>

          {/* BODY — no fixed height, no overflow hidden, no spacer; content determines height */}
          <div style={{ display: "flex", flexDirection: "column", padding: "12px 22px", gap: 7 }}>

            {/* Student details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: `1px solid ${RULE}`, borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
              {[
                ["Student Name", name],
                ["Admission No.", admissionNo],
                ["Class / Grade", form],
                ["Academic Year", academicYear],
                ["Exam / Term", examLabel],
                ["Date Issued", dateIssued],
              ].map(([label, value], i) => (
                <div key={label} style={{ display: "flex", borderBottom: i < 4 ? `1px solid ${RULE}` : "none", borderRight: i % 2 === 0 ? `1px solid ${RULE}` : "none" }}>
                  <div style={{ width: 105, background: "#f5f0e8", padding: "5px 8px", fontSize: 8, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", borderRight: `1px solid ${RULE}`, flexShrink: 0 }}>{label}</div>
                  <div style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, color: INK, display: "flex", alignItems: "center" }}>{value ?? "—"}</div>
                </div>
              ))}
            </div>

            {/* Section divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ height: 1, flex: 1, background: RULE }} />
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD }}>Subject Performance</span>
              <div style={{ height: 1, flex: 1, background: RULE }} />
            </div>

            {/* Subjects table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, border: `1px solid ${RULE}`, flexShrink: 0 }}>
              <thead>
                <tr style={{ background: INK, color: "#fff" }}>
                  {[["#","4%","center"],["Subject","30%","left"],["Score","9%","center"],["Grade Point","11%","center"],["CBC Level","11%","center"],["Remarks","35%","left"]].map(([l,w,a]) => (
                    <th key={l} style={{ padding: "5px 7px", textAlign: a, width: w, fontSize: 8.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => {
                  const avg = subjectAverages?.[s.name];
                  return (
                    <tr key={s.name} style={{ background: i % 2 === 0 ? "#fff" : "#faf7f0" }}>
                      <td style={{ padding: "4px 7px", textAlign: "center", color: MUTED, fontSize: 9.5, borderBottom: `1px solid ${RULE}` }}>{i+1}</td>
                      <td style={{ padding: "4px 7px", fontWeight: 600, color: INK, borderBottom: `1px solid ${RULE}`, borderLeft: `1px solid ${RULE}` }}>
                        {s.missing && <AlertTriangle size={9} style={{ display:"inline", color:"#d97706", marginRight:3, verticalAlign:"middle" }} />}
                        {s.name}
                        {avg != null && <span style={{ fontSize: 8.5, color: MUTED, marginLeft: 5, fontWeight: 400 }}>(avg {fmt(avg)})</span>}
                      </td>
                      <td style={{ padding:"4px 7px", textAlign:"center", fontWeight:700, color: s.missing?"#dc2626":INK, fontSize:12, borderBottom:`1px solid ${RULE}`, borderLeft:`1px solid ${RULE}` }}>{s.score != null ? fmt(s.score) : "—"}</td>
                      <td style={{ padding:"4px 7px", textAlign:"center", color:INK, fontWeight:600, borderBottom:`1px solid ${RULE}`, borderLeft:`1px solid ${RULE}` }}>{s.gp ?? "—"}</td>
                      <td style={{ padding:"4px 7px", textAlign:"center", borderBottom:`1px solid ${RULE}`, borderLeft:`1px solid ${RULE}` }}><span style={cbcBadge(s.level)}>{s.level !== "—" ? s.level : "—"}</span></td>
                      <td style={{ padding:"4px 7px", color:MUTED, fontSize:10, fontStyle:"italic", borderBottom:`1px solid ${RULE}`, borderLeft:`1px solid ${RULE}` }}>{CBC_MAP[s.level] ?? "—"}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: "#f0ebe0", borderTop: `2px solid ${GOLD}` }}>
                  <td colSpan={2} style={{ padding:"5px 7px", fontWeight:700, fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em", color:INK }}>Overall / Average</td>
                  <td style={{ padding:"5px 7px", textAlign:"center", fontWeight:800, fontSize:13, color:GOLD, borderLeft:`1px solid ${RULE}` }}>{fmt(meanScore)}</td>
                  <td style={{ padding:"5px 7px", textAlign:"center", fontWeight:700, color:INK, borderLeft:`1px solid ${RULE}` }}>{meanGP}</td>
                  <td style={{ padding:"5px 7px", textAlign:"center", borderLeft:`1px solid ${RULE}` }}><span style={cbcBadge(meanLevel)}>{meanLevel}</span></td>
                  <td style={{ padding:"5px 7px", fontWeight:600, color:INK, fontSize:10.5, fontStyle:"italic", borderLeft:`1px solid ${RULE}` }}>{CBC_MAP[meanLevel] ?? "—"}</td>
                </tr>
              </tbody>
            </table>

            {/* Summary + CBC Key */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, marginBottom: 5 }}>Performance Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5 }}>
                  {[["Mean Score",`${fmt(meanScore)}%`],["CBC Level",meanLevel],["Position",rankSuffix(rank)],["Out of",`${totalStudents ?? "—"} students`]].map(([l,v]) => (
                    <div key={l} style={{ background:"#fff", border:`1px solid ${RULE}`, borderTop:`2.5px solid ${GOLD}`, borderRadius:3, padding:"5px 4px", textAlign:"center" }}>
                      <div style={{ fontSize:7.5, color:MUTED, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>{l}</div>
                      <div className="cg" style={{ fontSize:14, fontWeight:700, color:INK, lineHeight:1 }}>{v ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, marginBottom: 5 }}>CBC Grading Scale</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                  {CBC_SCALE.map(({ level, range, color, bg }) => (
                    <div key={level} style={{ background:bg, border:`1px solid ${color}33`, borderRadius:3, padding:"3px 4px", textAlign:"center" }}>
                      <div style={{ fontWeight:800, color, fontSize:10 }}>{level}</div>
                      <div style={{ fontSize:7.5, color:"#374151", fontWeight:600 }}>{range}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <RemarksBlock
              label="Class Teacher's Remarks"
              remark={teacherRemark}
              signerName={teacherName}
            />
            <RemarksBlock
              label="Principal's Remarks"
              remark={null}
              signerName={null}
            />

            {/* Signatures — directly after remarks, no spacer */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, flexShrink:0, marginTop: 4, marginBottom: 6 }}>
              {[
                ["Class Teacher", teacherName ?? ""],
                ["Head of Department", ""],
                ["Principal", ""],
              ].map(([role, sub]) => (
                <div key={role} style={{ textAlign:"center" }}>
                  <div style={{ height:28, borderBottom:`1px solid ${INK}`, marginBottom:4 }} />
                  <div style={{ fontSize:8.5, fontWeight:700, color:INK, textTransform:"uppercase", letterSpacing:"0.06em" }}>{role}</div>
                  {sub && <div style={{ fontSize:9, color:MUTED, marginTop:1 }}>{sub}</div>}
                  <div style={{ fontSize:8, color:MUTED, marginTop:1 }}>Signature &amp; Date</div>
                </div>
              ))}
            </div>

          </div>

          {/* FOOTER */}
          <div style={{ padding:"5px 22px", borderTop:`1px solid ${RULE}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f5f0e8", flexShrink:0 }}>
            <span style={{ fontSize:8, color:MUTED, fontStyle:"italic" }}>Official Academic Document — Valid only with school stamp &amp; authorised signature.</span>
            <span style={{ fontSize:8.5, color:GOLD, fontWeight:700, letterSpacing:"0.06em" }}>{currentTermLabel} · {academicYear}</span>
          </div>

          {/* Gold bottom stripe */}
          <div style={{ height:4, background:`linear-gradient(90deg,${GOLD},${GOLD2},${GOLD})`, flexShrink:0 }} />

        </div>
      </div>
    </>
  );
}