"use client";
import { useState } from "react";
import {
  LayoutDashboard, Mic, ClipboardList, FileText, User, LogOut,
  Activity, Shield, Accessibility, Clock, ChevronRight, ChevronLeft,
  Calendar, Upload, Zap, FolderOpen, CheckCircle2, ArrowRight,
  Stethoscope, FileClock, FileCheck2, FileX2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════════ */
const INK     = "#0C1E2E";
const INK_MID = "#334155";
const INK_MUT = "#64748B";
const INK_FA  = "#94A3B8";
const BLUE    = "#0891B2";
const GREEN   = "#059669";
const AMBER   = "#D97706";
const RED     = "#DC2626";

const GBG = "rgba(255,255,255,0.90)";
const GBD = "rgba(186,225,244,0.75)";
const GSH = "0 2px 16px rgba(10,40,75,0.05), 0 1px 4px rgba(10,40,75,0.03)";
const RC  = 16;

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA  (swap with real props/hooks as needed)
═══════════════════════════════════════════════════════════════════════ */
const MOCK_NAME  = "Abinash Samantaray";
const MOCK_EMAIL = "abinash.samantaray555@gmail.com";
const MOCK_UID   = "d3c47e9c";
const MOCK_DATE  = "Mon, 21 Sept, 2026";

const MOCK_VISIT = {
  id: "a818ba56",
  dept: "General OPD Visit",
  status: "Ready to Begin",
  desc: "Consultation registered. Begin speaking with CareVoice or type your symptoms now.",
};

const MOCK_STATS = [
  { label: "Total Consultations", value: 2,  trend: "+1 this week", trendUp: true,  icon: Stethoscope, grad: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", blob: "rgba(147,197,253,0.55)" },
  { label: "Active Visits",       value: 2,  trend: "+1 this week", trendUp: true,  icon: Activity,    grad: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", blob: "rgba(110,231,183,0.55)" },
  { label: "Verified Reports",    value: 0,  trend: "No change",    trendUp: false, icon: FileCheck2,  grad: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", blob: "rgba(196,181,253,0.55)" },
  { label: "Clinical Documents",  value: 1,  trend: "+1 this week", trendUp: true,  icon: ClipboardList,grad: "linear-gradient(135deg,#FCE7F3,#FBCFE8)",blob: "rgba(249,168,212,0.55)" },
];

const MOCK_ACTIVITY = [
  { id: "a1", title: "General OPD Consultation", badge: "Latest", status: "Active",  dot: "#3B82F6", date: "21 Sept", desc: "Status: registered",                                            isErr: false },
  { id: "a2", title: "General Medicine Consultation", badge: "",   status: "Active",  dot: GREEN,    date: "21 Sept", desc: "Status: Intake in progress",                                    isErr: false },
  { id: "a3", title: "caste.jpeg",                   badge: "",   status: "Failed",  dot: AMBER,    date: "29 Sept", desc: "Extraction issue · Clinical extraction failed during document parsing.", isErr: true  },
];

const MOCK_DOCS = [
  { id: "d1", name: "caste.jpeg", type: "Prescription", status: "failed" },
];

/* ═══════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════════ */

/* Glass Card */
function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: GBG, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderRadius: RC, border: `1px solid ${GBD}`, boxShadow: GSH, overflow: "hidden", position: "relative", ...style }}>
      {children}
    </div>
  );
}

/* Section Header */
function SHead({ icon: Icon, title, right, color = BLUE }: {
  icon: React.ElementType; title: string; right?: React.ReactNode; color?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: `1px solid ${GBD}`, background: "rgba(236,250,255,0.55)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: INK_MUT }}>
        <Icon style={{ width: 13, height: 13, color, flexShrink: 0 }} />
        {title}
      </span>
      {right}
    </div>
  );
}

/* Status Pill */
function Pill({ v, children }: { v: "success" | "info" | "error" | "pending" | "neutral"; children: React.ReactNode }) {
  const C = {
    success: { bg: "rgba(5,150,105,0.09)",  bd: "rgba(5,150,105,0.28)",  fg: GREEN },
    info:    { bg: "rgba(8,145,178,0.09)",  bd: "rgba(8,145,178,0.28)",  fg: BLUE  },
    error:   { bg: "rgba(220,38,38,0.09)",  bd: "rgba(220,38,38,0.26)",  fg: RED   },
    pending: { bg: "rgba(217,119,6,0.09)",  bd: "rgba(217,119,6,0.26)",  fg: AMBER },
    neutral: { bg: "rgba(100,116,139,0.07)",bd: "rgba(100,116,139,0.20)",fg: INK_MID },
  }[v];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", padding: "3px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 600, lineHeight: 1, background: C.bg, border: `1px solid ${C.bd}`, color: C.fg }}>
      {children}
    </span>
  );
}

/* Chevron Action Link (text) */
function ALink({ children, color = BLUE }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 600, color, cursor: "pointer" }}>
      {children}<ChevronRight style={{ width: 12, height: 12 }} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════════════ */
const NAV_GROUPS = [
  { label: "HOME",         items: [{ label: "Dashboard",       icon: LayoutDashboard, active: true  }] },
  { label: "CONSULTATION", items: [{ label: "Pre-Consultation", icon: Mic,             active: false },
                                    { label: "Health Reports",  icon: ClipboardList,   active: false },
                                    { label: "Documents",       icon: FileText,        active: false }] },
  { label: "HEALTH",       items: [{ label: "Health Record",   icon: Activity,        active: false },
                                    { label: "Timeline",        icon: Clock,           active: false }] },
  { label: "ACCOUNT",      items: [{ label: "Profile",         icon: User,            active: false },
                                    { label: "Privacy",         icon: Shield,          active: false },
                                    { label: "Accessibility",   icon: Accessibility,  active: false }] },
];

function Sidebar({ visible, onClose }: { visible: boolean; onClose?: () => void }) {
  const initials = MOCK_NAME.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase();
  return (
    <aside
      style={{
        width: 210,
        minWidth: 210,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg,#091E34 0%,#0B3060 18%,#0A52A0 38%,#0879C4 55%,#0891B2 68%,#07B0D0 82%,#22D3EE 100%)",
        boxShadow: "4px 0 28px rgba(6,28,50,0.38)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* ── Animated background elements ── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* Glow blob top */}
        <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,211,238,0.14) 0%,transparent 70%)", filter: "blur(22px)" }} />
        {/* Glow blob mid */}
        <div style={{ position: "absolute", top: "48%", left: "60%", width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,211,238,0.10) 0%,transparent 70%)", filter: "blur(18px)" }} />
        {/* Wave line */}
        <svg viewBox="0 0 210 130" fill="none" style={{ position: "absolute", top: "30%", left: 0, width: "100%", height: 130, opacity: 1 }}>
          <path d="M-5 45 Q52 18 105 45 T218 45" stroke="rgba(255,255,255,0.55)" strokeWidth="0.75" />
          <path d="M-5 65 Q52 38 105 65 T218 65" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
          <path d="M-5 28 Q52 6 105 28 T218 28"  stroke="rgba(34,211,238,0.38)" strokeWidth="0.6" />
        </svg>
        <svg viewBox="0 0 210 100" fill="none" style={{ position: "absolute", top: "60%", left: 0, width: "100%", height: 100 }}>
          <path d="M-5 50 Q52 25 105 50 T218 50" stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
        </svg>
        {/* Floating plus symbols */}
        {([
          { top: "10%", left: "10%", sz: 13 }, { top: "44%", left: "78%", sz: 10 }, { top: "75%", left: "14%", sz: 12 },
        ] as const).map((d, i) => (
          <svg key={i} width={d.sz} height={d.sz} viewBox="0 0 24 24" fill="white" style={{ position: "absolute", top: d.top, left: d.left, opacity: 0.10 }}>
            <rect x="9" y="2" width="6" height="20" rx="3" /><rect x="2" y="9" width="20" height="6" rx="3" />
          </svg>
        ))}
      </div>

      {/* ── Logo ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 14px", borderBottom: "1px solid rgba(255,255,255,0.10)", flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12L6 12L9 5L12 19L15 9L18 12L21 12" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, color: "#fff", fontSize: 13.5, letterSpacing: "-0.01em", lineHeight: 1 }}>CareFlow AI</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.92)", marginLeft: "auto" }}>Patient</span>
        <ChevronLeft style={{ width: 13, height: 13, color: "rgba(255,255,255,0.40)", flexShrink: 0, marginLeft: 2 }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto", position: "relative", zIndex: 10 }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 4, marginTop: gi > 0 ? 14 : 0 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.40)", padding: "0 8px", marginBottom: 3 }}>{group.label}</p>
            {group.items.map(({ label, icon: Icon, active }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 10, marginBottom: 1, cursor: "pointer",
                fontWeight: active ? 600 : 500, color: active ? "#fff" : "rgba(255,255,255,0.68)", fontSize: 12.5,
                background: active ? "linear-gradient(90deg,rgba(255,255,255,0.22),rgba(255,255,255,0.10))" : "transparent",
                border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                boxShadow: active ? "0 2px 10px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                transition: "all 160ms ease",
                position: "relative",
              }}>
                <Icon style={{ width: 13, height: 13, color: active ? "rgba(125,242,255,0.95)" : "rgba(255,255,255,0.60)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <ChevronRight style={{ width: 11, height: 11, color: "rgba(255,255,255,0.50)" }} />}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Heart ECG Decor ── */}
      <div aria-hidden style={{ position: "relative", padding: "0 10px 2px", flexShrink: 0, zIndex: 10 }}>
        {/* ECG line */}
        <svg viewBox="0 0 170 26" fill="none" style={{ width: "100%", height: 18 }}>
          <path d="M0 13 L28 13 L34 13 L39 2 L44 24 L49 6 L54 18 L59 13 L87 13 L93 13 L98 2 L103 24 L108 6 L113 18 L118 13 L170 13"
            stroke="rgba(34,211,238,0.58)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Decor row */}
        <div style={{ position: "relative", height: 52, width: "100%" }}>
          {/* Left leaf */}
          <svg viewBox="0 0 36 60" fill="none" style={{ position: "absolute", left: 6, bottom: 4, width: 22, height: 40, opacity: 0.72 }}>
            <path d="M18 56C18 56 3 42 3 26C3 12 10 3 18 3C26 3 33 12 33 26C33 42 18 56 18 56Z" fill="rgba(52,211,153,0.26)" stroke="rgba(52,211,153,0.52)" strokeWidth="1" />
            <line x1="18" y1="56" x2="18" y2="10" stroke="rgba(52,211,153,0.36)" strokeWidth="1" strokeLinecap="round" />
          </svg>
          {/* Left ECG arm */}
          <svg viewBox="0 0 64 16" fill="none" style={{ position: "absolute", left: 30, bottom: 24, width: 44, height: 16 }}>
            <path d="M0 8 L14 8 L18 2 L22 14 L26 4 L30 11 L34 8 L64 8" stroke="rgba(34,211,238,0.68)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {/* Center heart */}
          <div style={{ position: "absolute", left: "50%", bottom: 6, transform: "translateX(-50%)", width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#9333EA,#EC4899)", boxShadow: "0 0 16px 5px rgba(147,51,234,0.45),0 2px 8px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="white">
              <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.25 3 11.81 3.88 12 5C12.19 3.88 13.75 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14.5 12 21 12 21Z" />
            </svg>
          </div>
          {/* Right ECG arm */}
          <svg viewBox="0 0 64 16" fill="none" style={{ position: "absolute", right: 30, bottom: 24, width: 44, height: 16 }}>
            <path d="M0 8 L30 8 L34 2 L38 14 L42 4 L46 11 L50 8 L64 8" stroke="rgba(34,211,238,0.68)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {/* Right leaf */}
          <svg viewBox="0 0 36 60" fill="none" style={{ position: "absolute", right: 6, bottom: 4, width: 22, height: 40, opacity: 0.58, transform: "scaleX(-1)" }}>
            <path d="M18 56C18 56 3 42 3 26C3 12 10 3 18 3C26 3 33 12 33 26C33 42 18 56 18 56Z" fill="rgba(52,211,153,0.22)" stroke="rgba(52,211,153,0.46)" strokeWidth="1" />
            <line x1="18" y1="56" x2="18" y2="10" stroke="rgba(52,211,153,0.30)" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── Profile + Sign Out ── */}
      <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.10)", flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px", marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#06B6D4,#0884AB)", border: "2px solid rgba(255,255,255,0.32)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{MOCK_NAME}</p>
            <p style={{ margin: 0, fontSize: 9.5, color: "rgba(255,255,255,0.50)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{MOCK_EMAIL}</p>
          </div>
        </div>
        <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.62)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", transition: "all 160ms ease" }}>
          <LogOut style={{ width: 13, height: 13, flexShrink: 0 }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN CONTENT AREA
═══════════════════════════════════════════════════════════════════════ */

/* 3-step Stepper */
function Stepper() {
  const steps = [
    { n: 1, label: "Start Pre-Consultation" },
    { n: 2, label: "Upload Past Records"    },
    { n: 3, label: "Doctor Consultation"   },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${GBD}`, gap: 0 }}>
      {steps.map((s, i) => {
        const active = s.n === 1;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, ...(active ? { background: "linear-gradient(135deg,#0891B2,#22D3EE)", color: "#fff", boxShadow: "0 2px 10px rgba(8,145,178,0.45)" } : { background: "#fff", color: INK_FA, border: "1.5px solid #CBD5E1" }) }}>
              {s.n}
            </div>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, marginLeft: 7, whiteSpace: "nowrap", color: active ? BLUE : INK_FA, overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
            {i < steps.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 4, margin: "0 8px" }}>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                <ChevronRight style={{ width: 11, height: 11, flexShrink: 0, color: "#CBD5E1" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Quick Action Button */
function QBtn({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: BLUE, background: "rgba(240,250,255,0.90)", border: "1.5px solid rgba(8,145,178,0.22)", boxShadow: "0 1px 4px rgba(8,40,80,0.04)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 150ms ease" }}>
      <Icon style={{ width: 12, height: 12 }} />{label}
    </span>
  );
}

function MainContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── HEADER ── */}
      <GCard style={{ padding: "18px 22px" }}>
        {/* Top-right decorative leaf / cross */}
        <div aria-hidden style={{ position: "absolute", top: 8, right: 16, pointerEvents: "none" }}>
          <svg viewBox="0 0 90 80" fill="none" style={{ width: 90, height: 80, opacity: 0.55 }}>
            <path d="M45 74C45 74 14 54 14 32C14 18 26 8 38 8C44 8 49 12 52 16" stroke="rgba(8,145,178,0.35)" strokeWidth="1.2" fill="rgba(186,230,253,0.25)" />
            <path d="M52 16C52 16 60 8 70 8C80 8 90 18 90 32C90 52 64 70 52 76" stroke="rgba(8,145,178,0.35)" strokeWidth="1.2" fill="rgba(186,230,253,0.25)" />
          </svg>
          {/* Small + cross */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", top: -8, right: 0, opacity: 0.50 }}>
            <rect x="9" y="2" width="6" height="20" rx="3" fill="#38BDF8" /><rect x="2" y="9" width="20" height="6" rx="3" fill="#38BDF8" />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          {/* Greeting */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
                Good evening, {MOCK_NAME.split(" ")[0].toUpperCase()}
              </h1>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#94A3B8", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>Patient Portal</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: INK_MUT, lineHeight: 1.55 }}>
              AI Clinical Intake Workstation · Prepare symptoms and document evidence for your physician.
            </p>
          </div>
          {/* Meta pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(240,249,255,0.92)", border: "1px solid rgba(186,225,244,0.80)", color: INK_MUT, boxShadow: GSH }}>
              <Calendar style={{ width: 11, height: 11, color: BLUE }} />{MOCK_DATE}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(240,249,255,0.92)", border: "1px solid rgba(186,225,244,0.80)", color: INK_MUT, boxShadow: GSH }}>
              <Clock style={{ width: 11, height: 11, color: BLUE }} />UID: {MOCK_UID}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(8,145,178,0.10)", border: `1px solid rgba(8,145,178,0.22)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User style={{ width: 14, height: 14, color: BLUE }} />
            </div>
          </div>
        </div>
      </GCard>

      {/* ── CURRENT VISIT ── */}
      <GCard style={{ padding: "14px 18px 18px" }}>
        {/* ECG decoration */}
        <svg aria-hidden style={{ position: "absolute", bottom: 0, right: 0, width: 240, height: 52, pointerEvents: "none" }} viewBox="0 0 280 52" fill="none">
          <path d="M0 38 Q30 38 46 38 L58 38 L66 16 L74 48 L82 24 L90 40 L98 38 L134 38 Q160 38 176 38 L188 38 L196 16 L204 48 L212 24 L220 40 L228 38 L280 38" stroke="rgba(8,145,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Label row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: "0 0 0 2px rgba(5,150,105,0.22)", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: INK_MUT }}>Current Visit</span>
          </div>
          <span style={{ fontSize: 11, color: INK_FA, fontFamily: "monospace" }}>#{MOCK_VISIT.id}</span>
        </div>

        {/* Visit info row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#CFFAFE,#A5F3FC)", border: "2px solid rgba(6,182,212,0.30)", boxShadow: "0 2px 12px rgba(6,182,212,0.22)" }}>
              <Stethoscope style={{ width: 22, height: 22, color: BLUE }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>{MOCK_VISIT.dept}</span>
                <Pill v="success">
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: GREEN, marginRight: 4 }} />
                  {MOCK_VISIT.status}
                </Pill>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: INK_MUT, lineHeight: 1.5 }}>{MOCK_VISIT.desc}</p>
            </div>
          </div>
          {/* CTA */}
          <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#0A3D78 0%,#0769A9 45%,#0891B2 80%,#06B6D4 100%)", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(8,69,120,0.40)", whiteSpace: "nowrap", flexShrink: 0 }}>
            Begin Pre-Consultation <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <Stepper />
      </GCard>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MOCK_STATS.map(({ label, value, trend, trendUp, icon: Icon, grad, blob }) => (
          <GCard key={label} style={{ overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", bottom: -18, right: -18, width: 76, height: 76, borderRadius: "50%", background: blob, opacity: 0.65 }} />
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: grad }}>
                <Icon style={{ width: 19, height: 19, color: INK_MID }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: INK, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
                <div style={{ fontSize: 11, color: INK_MUT, marginTop: 2, lineHeight: 1.3 }}>{label}</div>
                <div style={{ fontSize: 10.5, marginTop: 3, color: trendUp ? GREEN : INK_FA, display: "flex", alignItems: "center", gap: 3 }}>
                  {trendUp ? "↑" : "—"} {trend}
                </div>
              </div>
              <ChevronRight style={{ width: 13, height: 13, color: INK_FA, flexShrink: 0 }} />
            </div>
          </GCard>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <GCard>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: INK_MUT, marginRight: 8, flexShrink: 0 }}>
            <Zap style={{ width: 12, height: 12, color: AMBER }} />Quick Actions
          </span>
          <QBtn icon={Mic}      label="Resume Intake"    />
          <QBtn icon={Upload}   label="Upload Document"  />
          <QBtn icon={Activity} label="Health Record"    />
          <QBtn icon={Calendar} label="Timeline"         />
        </div>
      </GCard>

      {/* ── TWO-COLUMN LOWER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-3">

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Recent Clinical Activity */}
          <GCard>
            <SHead icon={Activity} title="Recent Clinical Activity" right={<ALink>View Full Timeline</ALink>} />
            <div>
              {MOCK_ACTIVITY.map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 18px", cursor: "pointer", borderTop: i > 0 ? `1px solid ${GBD}` : "none", transition: "background 140ms ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.70)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <div style={{ flexShrink: 0, paddingTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.dot }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{a.title}</span>
                      {a.badge && (
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", padding: "2px 6px", borderRadius: 99, background: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.25)", color: BLUE }}>{a.badge}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: INK_MUT, lineHeight: 1.45 }}>{a.desc}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <Pill v={a.isErr ? "error" : "success"}>{a.status}</Pill>
                    <span style={{ fontSize: 10.5, color: INK_FA, whiteSpace: "nowrap" }}>{a.date}</span>
                    <ChevronRight style={{ width: 12, height: 12, color: INK_FA }} />
                  </div>
                </div>
              ))}
            </div>
          </GCard>

          {/* My Health Record Snapshot */}
          <GCard>
            <SHead icon={FileText} title="My Health Record Snapshot" right={<ALink>Explore Record</ALink>} />
            <div style={{ padding: "12px 18px" }}>
              <p style={{ margin: 0, fontSize: 12, color: INK_MUT, lineHeight: 1.55 }}>
                Your full health record, past consultations, prescriptions, and clinical notes are available in the Health Record section.
              </p>
            </div>
          </GCard>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Document Center */}
          <GCard>
            <SHead icon={FolderOpen} title="Document Center" right={<ALink>Manage ({MOCK_DOCS.length})</ALink>} />
            <div>
              {MOCK_DOCS.map((doc, i) => {
                const isErr = doc.status === "failed";
                const DocIcon = isErr ? FileX2 : FileCheck2;
                const docColor = isErr ? RED : GREEN;
                return (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", borderTop: i > 0 ? `1px solid ${GBD}` : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.70)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isErr ? "rgba(220,38,38,0.08)" : "rgba(5,150,105,0.08)", border: `1px solid ${docColor}25` }}>
                      <DocIcon style={{ width: 14, height: 14, color: docColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: INK, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10.5, color: INK_MUT }}>{doc.type}</p>
                    </div>
                    <Pill v="error">Failed</Pill>
                  </div>
                );
              })}
              <div style={{ padding: "9px 16px", borderTop: `1px solid ${GBD}` }}>
                <p style={{ margin: 0, fontSize: 10, color: INK_FA, lineHeight: 1.5 }}>
                  Accepted: Prescriptions, Lab Reports, Discharge Summaries (PDF / JPEG / PNG)
                </p>
              </div>
            </div>
          </GCard>

          {/* Quick Access */}
          <GCard>
            <SHead icon={Zap} title="Quick Access" color={AMBER} />
            <div>
              {[
                { icon: Mic,      label: "CareVoice Intake", sub: "Start or resume consultation", color: BLUE    },
                { icon: FileText, label: "Documents",         sub: "1 uploaded",                  color: INK_MID },
              ].map(({ icon: Icon, label, sub, color }, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderTop: i > 0 ? `1px solid ${GBD}` : "none", transition: "background 140ms ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.70)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,249,255,0.90)", border: `1px solid ${GBD}` }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: INK, lineHeight: 1.2 }}>{label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: INK_MUT }}>{sub}</p>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(200,222,234,0.40)" }}>
                    <ChevronRight style={{ width: 12, height: 12, color: INK_FA }} />
                  </div>
                </div>
              ))}
            </div>
          </GCard>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE BACKGROUND
═══════════════════════════════════════════════════════════════════════ */
function PageBg() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg,#DAF0F9 0%,#E8F7FD 20%,#F0FAFE 45%,#E4F5FB 70%,#EBF7FC 100%)" }} />
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -80, left: 160, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(186,230,253,0.55) 0%,transparent 65%)" }} />
      <div style={{ position: "absolute", bottom: -60, right: 0, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(165,243,252,0.45) 0%,transparent 65%)" }} />
      {/* Top-right leaf decor */}
      <div style={{ position: "absolute", top: 0, right: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: 90, height: 90, filter: "drop-shadow(0 4px 14px rgba(34,211,238,0.35))" }}>
          <path d="M50 86C50 86 11 59 11 34C11 19 22 9 35 9C42 9 47 13 50 17C53 13 58 9 65 9C78 9 89 19 89 34C89 59 50 86 50 86Z" fill="url(#hG)" stroke="rgba(255,255,255,0.80)" strokeWidth="2" />
          <path d="M18 50L34 50L40 34L46 62L52 38L57 52L61 50L82 50" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <defs><linearGradient id="hG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#67E8F9" stopOpacity="0.80" /><stop offset="100%" stopColor="#0891B2" stopOpacity="0.92" /></linearGradient></defs>
        </svg>
      </div>
      {/* Cross top-right */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", top: "6%", right: "18%", opacity: 0.40 }}>
        <rect x="9" y="2" width="6" height="20" rx="3" fill="#38BDF8" /><rect x="2" y="9" width="20" height="6" rx="3" fill="#38BDF8" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOT EXPORT — full two-column dashboard
═══════════════════════════════════════════════════════════════════════ */
export default function PatientDashboardUI() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, lineHeight: 1.5, minHeight: "100vh", position: "relative" }}>
      <PageBg />

      {/* ── Two-column shell ── */}
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>

        {/* Desktop sidebar */}
        <div className="hidden md:flex" style={{ width: 210, flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
          <Sidebar visible />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={() => setSidebarOpen(false)} />
            <div style={{ position: "relative", zIndex: 51, height: "100%", width: 210 }}>
              <Sidebar visible onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Mobile header */}
        <div className="md:hidden" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20, height: 52, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(90deg,#091E34,#0891B2)", borderBottom: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 2px 12px rgba(9,30,52,0.30)" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12L6 12L9 5L12 19L15 9L18 12L21 12" /></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13 }}>CareFlow AI</span>
          </button>
          <LogOut style={{ width: 16, height: 16, color: "rgba(255,255,255,0.75)", cursor: "pointer" }} />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-6 overflow-y-auto">
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
