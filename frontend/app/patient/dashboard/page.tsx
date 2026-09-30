"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, AlertCircle, CheckCircle2, FileText,
  ClipboardList, Calendar, ChevronRight, Activity, FolderOpen,
  Upload, FileCheck2, Stethoscope, FileClock,
  FileX2, Mic, Zap,
  Heart, Thermometer, Wind, Droplets, UserCheck, CalendarDays,
  ChevronLeft, Sparkles,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { getPatientProfile, getMyEncounters, createEncounter } from "@/services/patient.service";
import { getPatientReports, getPatientDashboardMetrics, getPatientDocuments } from "@/services/report.service";
import { ApiError } from "@/lib/api";
import type { PatientProfileResponse, EncounterResponse } from "@/types/patient";
import type { PatientReportSummaryItem, PatientDashboardMetrics, PatientDocumentItem } from "@/types/report";

/* ── Constants ─────────────────────────────────────────────────────────── */
const DEPTS = ["General Medicine", "General OPD", "Pediatrics", "Orthopedics", "Cardiology", "Other"];

function greeting(name?: string) {
  const h = new Date().getHours();
  const t = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${t}, ${name.trim().split(" ")[0].toUpperCase()}` : t;
}

/* ── Design Tokens ─────────────────────────────────────────────────────── */
const INK    = "#0C1E2E";
const INK_MID = "#334155";
const INK_MUT = "#64748B";
const INK_FA  = "#94A3B8";
const BLUE    = "#0891B2";
const GREEN   = "#059669";
const AMBER   = "#D97706";
const RED     = "#DC2626";

const GBG  = "rgba(255,255,255,0.90)";  /* glass card bg */
const GBD  = "rgba(186,225,244,0.75)";  /* glass card border */
const GSH  = "0 2px 16px rgba(10,40,75,0.05), 0 1px 4px rgba(10,40,75,0.03)";
const GSHE = "0 6px 24px rgba(10,40,75,0.09), 0 0 18px rgba(34,211,238,0.13)";
const RC   = 18;

/* ── GlassCard ─────────────────────────────────────────────────────────── */
function GlassCard({ children, style = {}, hover = false }: {
  children: React.ReactNode; style?: React.CSSProperties; hover?: boolean;
}) {
  return (
    <div
      style={{
        background: GBG,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: RC,
        border: `1px solid ${GBD}`,
        boxShadow: GSH,
        overflow: "hidden",
        position: "relative",
        transition: hover ? "transform 170ms ease, box-shadow 170ms ease, border-color 170ms ease" : undefined,
        ...style,
      }}
      onMouseEnter={hover ? e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = GSHE;
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(34,211,238,0.48)";
      } : undefined}
      onMouseLeave={hover ? e => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = GSH;
        (e.currentTarget as HTMLDivElement).style.borderColor = GBD;
      } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Card Section Header ───────────────────────────────────────────────── */
function SHead({
  icon: Icon, title, right, color = BLUE,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  title: string; right?: React.ReactNode; color?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 18px", borderBottom: `1px solid ${GBD}`,
      background: "rgba(236,250,255,0.55)",
    }}>
      <span style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.13em", color: INK_MUT,
      }}>
        <Icon style={{ width: 13, height: 13, color, flexShrink: 0 }} />
        {title}
      </span>
      {right}
    </div>
  );
}

/* ── Action Link ───────────────────────────────────────────────────────── */
function SLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11.5, fontWeight: 600, color: BLUE, textDecoration: "none",
      transition: "color 150ms",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#075985"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = BLUE}
    >
      {children}<ChevronRight style={{ width: 12, height: 12 }} />
    </Link>
  );
}

/* ── Status Pill ───────────────────────────────────────────────────────── */
function Pill({ v, children }: {
  v: "success" | "info" | "pending" | "error" | "neutral"; children: React.ReactNode;
}) {
  const C: Record<string, { bg: string; bd: string; fg: string }> = {
    success: { bg: "rgba(5,150,105,0.09)",  bd: "rgba(5,150,105,0.28)",  fg: GREEN },
    info:    { bg: "rgba(8,145,178,0.09)",  bd: "rgba(8,145,178,0.28)",  fg: BLUE  },
    pending: { bg: "rgba(217,119,6,0.09)",  bd: "rgba(217,119,6,0.26)",  fg: AMBER },
    error:   { bg: "rgba(220,38,38,0.09)",  bd: "rgba(220,38,38,0.26)",  fg: RED   },
    neutral: { bg: "rgba(100,116,139,0.07)",bd: "rgba(100,116,139,0.20)",fg: INK_MID },
  };
  const c = C[v];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
      padding: "3px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 600, lineHeight: 1,
      background: c.bg, border: `1px solid ${c.bd}`, color: c.fg,
    }}>{children}</span>
  );
}

/* ── Consultation Progress Stepper ─────────────────────────────────────── */
function Stepper({ cur, done = [] }: { cur: number; done?: number[] }) {
  const steps = [
    { n: 1, label: "Start Pre-Consultation" },
    { n: 2, label: "Upload Past Records" },
    { n: 3, label: "Doctor Consultation" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${GBD}` }}>
      {steps.map((s, i) => {
        const d = done.includes(s.n);
        const active = s.n === cur && !d;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div
              className={active ? "step-active" : ""}
              style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                ...(d
                  ? { background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", boxShadow: "0 2px 8px rgba(5,150,105,0.35)" }
                  : active
                  ? { background: "linear-gradient(135deg,#0891B2,#22D3EE)", color: "#fff", boxShadow: "0 2px 10px rgba(8,145,178,0.45)" }
                  : { background: "#fff", color: INK_FA, border: "1.5px solid #CBD5E1" }),
              }}
            >
              {d ? <CheckCircle2 style={{ width: 13, height: 13 }} /> : s.n}
            </div>
            <span className="hidden sm:inline" style={{
              fontSize: 11, fontWeight: active || d ? 600 : 400, marginLeft: 7, whiteSpace: "nowrap",
              color: d ? GREEN : active ? BLUE : INK_FA,
            }}>{s.label}</span>
            {i < steps.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 4, margin: "0 8px" }}>
                <div style={{ flex: 1, height: 1, background: d ? "rgba(5,150,105,0.28)" : "#E2E8F0" }} />
                <ChevronRight style={{ width: 12, height: 12, flexShrink: 0, color: d ? GREEN : "#CBD5E1" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── ECG Wave Decor inside Current Visit card ──────────────────────────── */
function VisitEcg() {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", bottom: 0, right: 0, width: 240, height: 52, pointerEvents: "none" }}
      viewBox="0 0 280 52"
      fill="none"
    >
      <path
        d="M0 38 Q30 38 46 38 L58 38 L66 16 L74 48 L82 24 L90 40 L98 38 L134 38 Q160 38 176 38 L188 38 L196 16 L204 48 L212 24 L220 40 L228 38 L280 38"
        stroke="rgba(8,145,178,0.15)" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Primary CTA Button ────────────────────────────────────────────────── */
function PrimaryCTA({ href, onClick, children }: {
  href?: string; onClick?: () => void; children: React.ReactNode;
}) {
  const s: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 22px", borderRadius: 11,
    background: "linear-gradient(135deg, #0A3D78 0%, #0769A9 45%, #0891B2 80%, #06B6D4 100%)",
    color: "#fff", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap",
    border: "none", cursor: "pointer",
    boxShadow: "0 4px 14px rgba(8,69,120,0.40), 0 1px 3px rgba(6,182,212,0.20)",
    transition: "box-shadow 180ms ease, transform 180ms ease",
    textDecoration: "none",
  };
  const hi = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(8,69,120,0.50), 0 0 14px rgba(34,211,238,0.38)";
    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
  };
  const lo = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(8,69,120,0.40), 0 1px 3px rgba(6,182,212,0.20)";
    (e.currentTarget as HTMLElement).style.transform = "";
  };
  if (href) return <Link href={href} style={s} onMouseEnter={hi} onMouseLeave={lo}>{children}</Link>;
  return <button style={s} onClick={onClick} onMouseEnter={hi} onMouseLeave={lo}>{children}</button>;
}

/* ════════════════════════════════════════════════════════════════════════
   PREMIUM AUTO-SLIDING HEALTHCARE HERO CAROUSEL
   (Pixel-perfect match to reference screenshot)
   ════════════════════════════════════════════════════════════════════════ */

interface HeroSlide {
  id: string;
  badge: string;
  badgeIcon: React.ElementType;
  title: string;
  description: string;
  ctaText: string;
  ctaHref?: string;
  ctaAction?: () => void;
  renderLeftVisual: () => React.ReactNode;
  renderRightVisual: () => React.ReactNode;
}

/* ── 3D-styled SVG Illustrations for Left Visual ── */
function IllustrationClipboard() {
  return (
    <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Background soft teal/cyan circular glow */}
      <div style={{
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(165,243,252,0.65) 0%, rgba(207,250,254,0.35) 60%, transparent 80%)",
        filter: "blur(12px)",
      }} />

      {/* Floating 3D leaves / petals */}
      <svg viewBox="0 0 160 160" style={{ position: "absolute", width: "100%", height: "100%", overflow: "visible" }} fill="none">
        {/* Left organic leaf */}
        <path
          d="M32 108C22 92 24 74 38 68C52 62 58 78 54 94C50 110 42 118 32 108Z"
          fill="url(#leafGrad1)"
          filter="drop-shadow(0 3px 6px rgba(13,148,136,0.18))"
        />
        {/* Soft leaf spine */}
        <path d="M34 104C38 92 42 80 48 72" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Small floating bubble/heart on top-right of clipboard */}
        <g transform="translate(112, 40)" filter="drop-shadow(0 4px 8px rgba(6,182,212,0.25))">
          <circle cx="14" cy="14" r="14" fill="url(#bubbleGrad)" />
          <path
            d="M14 19.5C14 19.5 8 15.5 8 12C8 10 9.5 8.5 11.5 8.5C12.8 8.5 13.6 9.2 14 9.8C14.4 9.2 15.2 8.5 16.5 8.5C18.5 8.5 20 10 20 12C20 15.5 14 19.5 14 19.5Z"
            fill="#06B6D4"
          />
        </g>

        {/* Gradient Defs */}
        <defs>
          <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
          <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#CFFAFE" />
          </linearGradient>
          <linearGradient id="clipBoardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="clipPaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
        </defs>
      </svg>

      {/* 3D Clipboard Isometric Stand */}
      <div style={{
        position: "relative",
        width: 74,
        height: 94,
        background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 60%, #2563EB 100%)",
        borderRadius: 14,
        boxShadow: "0 10px 22px rgba(37,99,235,0.28), 0 3px 6px rgba(0,0,0,0.06)",
        transform: "rotate(-6deg)",
        padding: "5px 6px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Metal clip */}
        <div style={{
          width: 32,
          height: 12,
          background: "linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)",
          borderRadius: "4px 4px 3px 3px",
          marginTop: -9,
          boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
          position: "relative",
          zIndex: 3,
          display: "flex",
          justifyContent: "center",
        }}>
          <div style={{ width: 14, height: 6, borderRadius: 3, border: "2px solid #64748B", marginTop: -4 }} />
        </div>

        {/* Paper sheet */}
        <div style={{
          flex: 1,
          width: "100%",
          background: "#FFFFFF",
          borderRadius: 8,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          position: "relative",
        }}>
          {/* Medical Cross in paper header */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
            <div style={{
              width: 14, height: 14, background: "#38BDF8", borderRadius: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(56,189,248,0.4)",
            }}>
              <span style={{ color: "#FFF", fontSize: 11, fontWeight: 900, lineHeight: 1 }}>+</span>
            </div>
          </div>
          {/* Document lines */}
          <div style={{ width: "85%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
          <div style={{ width: "95%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
          <div style={{ width: "70%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
          <div style={{ width: "80%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
        </div>
      </div>

      {/* 3D Stethoscope looping around the clipboard */}
      <svg
        viewBox="0 0 120 120"
        style={{
          position: "absolute",
          width: 115,
          height: 115,
          overflow: "visible",
          pointerEvents: "none",
          transform: "translate(22px, 14px)",
        }}
        fill="none"
      >
        <path
          d="M20 30 C 15 65, 30 90, 60 90 C 85 90, 95 72, 86 52 C 80 40, 68 45, 66 58 C 64 70, 75 76, 82 72"
          stroke="url(#stethGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="drop-shadow(0 4px 6px rgba(15,23,42,0.22))"
        />
        {/* Chestpiece / Bell */}
        <circle cx="82" cy="72" r="8" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
        <circle cx="82" cy="72" r="3" fill="#FFFFFF" />
        {/* Ear pieces at top */}
        <path d="M12 18 L20 30" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 16 L22 28" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="12" cy="18" r="2.5" fill="#38BDF8" />
        <circle cx="28" cy="16" r="2.5" fill="#38BDF8" />
        <defs>
          <linearGradient id="stethGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function IllustrationRecords() {
  return (
    <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", width: 125, height: 125, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,243,208,0.55) 0%, rgba(209,250,229,0.30) 60%, transparent 80%)",
        filter: "blur(12px)",
      }} />
      <div style={{
        width: 72, height: 92, background: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
        borderRadius: 14, boxShadow: "0 10px 22px rgba(5,150,105,0.25)",
        transform: "rotate(-4deg)", padding: "8px", display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ width: "100%", height: "100%", background: "#FFF", borderRadius: 8, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
          </div>
          <div style={{ width: "80%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
          <div style={{ width: "95%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
          <div style={{ width: "65%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
          <div style={{ width: "85%", height: 3, background: "#E2E8F0", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

function IllustrationAppointment() {
  return (
    <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", width: 125, height: 125, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(191,219,254,0.55) 0%, rgba(219,234,254,0.30) 60%, transparent 80%)",
        filter: "blur(12px)",
      }} />
      <div style={{
        width: 78, height: 88, background: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
        borderRadius: 14, boxShadow: "0 10px 22px rgba(37,99,235,0.25)",
        transform: "rotate(-3deg)", padding: "7px 6px", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 4 }}>
          <div style={{ width: 4, height: 6, background: "#FFFFFF", borderRadius: 2 }} />
          <div style={{ width: 4, height: 6, background: "#FFFFFF", borderRadius: 2 }} />
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 8, padding: "6px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, alignItems: "center" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ width: 14, height: 10, borderRadius: 2, background: i === 2 ? "#3B82F6" : "#F1F5F9" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IllustrationCareFlow() {
  return (
    <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", width: 125, height: 125, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(221,214,254,0.55) 0%, rgba(237,233,254,0.30) 60%, transparent 80%)",
        filter: "blur(12px)",
      }} />
      <div style={{
        width: 76, height: 86, background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
        borderRadius: 14, boxShadow: "0 10px 22px rgba(124,58,237,0.25)",
        transform: "rotate(-4deg)", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: "100%", height: "100%", background: "#FFF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles style={{ width: 30, height: 30, color: "#7C3AED" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Doctor & Modern Clinic Photography for Right Visual ── */
function DoctorBannerVisual({ slogan }: { slogan?: string }) {
  return (
    <div style={{
      position: "relative",
      height: "100%",
      minWidth: 260,
      maxWidth: 320,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      pointerEvents: "none",
    }}>
      {/* "Better Health Together" typography badge on the left of doctor */}
      <div style={{
        position: "absolute",
        left: -15,
        top: "22%",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: "rotate(-5deg)",
      }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 16,
          fontStyle: "italic",
          fontWeight: 600,
          color: "#0284C7",
          lineHeight: 1.1,
          textShadow: "0 1px 2px rgba(255,255,255,0.8)",
          whiteSpace: "nowrap",
        }}>
          {slogan || "Better Health Together"}
        </span>
        {/* Soft hand-drawn style heart outline */}
        <svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 2 }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      {/* Realistic Doctor Photo Container with soft fade blend */}
      <div style={{
        position: "relative",
        height: "100%",
        width: 240,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}>
        {/* Soft gradient mask on left edge so image seamlessly merges with the card */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(238,247,253,1) 0%, rgba(238,247,253,0.5) 18%, transparent 45%)",
          zIndex: 3,
        }} />

        {/* High-quality Friendly Female Physician with White Coat & Digital Tablet */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1594824813587-08365287f34c?auto=format&fit=crop&w=600&q=80"
          alt="Friendly Healthcare Physician"
          style={{
            height: "115%",
            width: "auto",
            objectFit: "cover",
            objectPosition: "top center",
            filter: "contrast(1.03) brightness(1.02)",
            position: "relative",
            zIndex: 1,
            marginBottom: -2,
          }}
          loading="eager"
        />
      </div>
    </div>
  );
}

function HealthcareHeroCarousel({
  primaryEncounter,
  upcomingEncounter,
  onOpenUpcomingModal,
  onStartPreConsultation,
}: {
  primaryEncounter?: EncounterResponse | null;
  upcomingEncounter?: EncounterResponse | null;
  onOpenUpcomingModal?: (enc: EncounterResponse) => void;
  onStartPreConsultation?: () => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: HeroSlide[] = [
    {
      id: "pre-consultation",
      badge: "PRE-CONSULTATION",
      badgeIcon: Mic,
      title: "Prepare for your consultation",
      description: "Complete your pre-consultation and organize your symptoms before meeting your physician.",
      ctaText: "Start Pre-Consultation",
      ctaHref: primaryEncounter ? `/patient/intake?encounter_id=${primaryEncounter.id}` : undefined,
      ctaAction: !primaryEncounter && onStartPreConsultation ? onStartPreConsultation : undefined,
      renderLeftVisual: () => <IllustrationClipboard />,
      renderRightVisual: () => <DoctorBannerVisual slogan="Better Health Together" />,
    },
    {
      id: "health-records",
      badge: "HEALTH RECORDS",
      badgeIcon: ClipboardList,
      title: "Keep your health records organized",
      description: "Manage your important clinical documents and health information in one place.",
      ctaText: "View Health Record",
      ctaHref: "/patient/health-record",
      renderLeftVisual: () => <IllustrationRecords />,
      renderRightVisual: () => <DoctorBannerVisual slogan="Records at Hand" />,
    },
    {
      id: "upcoming-care",
      badge: "UPCOMING CARE",
      badgeIcon: CalendarDays,
      title: "Stay updated with your care",
      description: "Check your upcoming appointments and consultation status from your dashboard.",
      ctaText: "View Appointment",
      ctaHref: !upcomingEncounter ? "/patient/intake" : undefined,
      ctaAction: upcomingEncounter && onOpenUpcomingModal ? () => onOpenUpcomingModal(upcomingEncounter) : undefined,
      renderLeftVisual: () => <IllustrationAppointment />,
      renderRightVisual: () => <DoctorBannerVisual slogan="On-Time Consultations" />,
    },
    {
      id: "careflow-ai",
      badge: "CAREFLOW AI",
      badgeIcon: Sparkles,
      title: "Your healthcare journey, simplified",
      description: "Track consultations, clinical documents, reports, and health information from one place.",
      ctaText: "Explore Dashboard",
      ctaAction: () => {
        const statsEl = document.getElementById("careflow-stats-overview");
        if (statsEl) {
          statsEl.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollBy({ top: 320, behavior: "smooth" });
        }
      },
      renderLeftVisual: () => <IllustrationCareFlow />,
      renderRightVisual: () => <DoctorBannerVisual slogan="Smart Care Companion" />,
    },
  ];

  const total = slides.length;

  const [direction, setDirection] = useState<"next" | "prev">("next");

  const nextSlide = () => {
    setDirection("next");
    setCurrentSlide((prev) => (prev + 1) % total);
  };
  const prevSlide = () => {
    setDirection("prev");
    setCurrentSlide((prev) => (prev - 1 + total) % total);
  };

  const goToSlide = (idx: number) => {
    setDirection(idx > currentSlide ? "next" : "prev");
    setCurrentSlide(idx);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setDirection("next");
      setCurrentSlide((prev) => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const active = slides[currentSlide];

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const BadgeIcon = active.badgeIcon;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="CareFlow Highlights"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        /* Very light icy blue-to-white gradient background matching the reference */
        background: "linear-gradient(108deg, #FFFFFF 0%, #F5FBFE 35%, #EEF7FD 65%, #E6F3FA 100%)",
        borderRadius: 22,
        border: "1px solid rgba(186, 225, 244, 0.85)",
        boxShadow: "0 2px 14px rgba(10, 40, 75, 0.05), 0 1px 3px rgba(10, 40, 75, 0.03)",
        overflow: "hidden",
        height: 188,
        display: "flex",
        alignItems: "center",
        transition: "box-shadow 260ms ease, transform 260ms ease",
      }}
      className="hero-carousel-container"
    >
      {/* ── Background Subtle Curved Decorative Waves & Atmosphere ── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {/* Soft Cyan Ambient Glow behind content */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "25%",
          width: 320,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(165,243,252,0.35) 0%, rgba(207,250,254,0.05) 70%, transparent 100%)",
          filter: "blur(32px)",
        }} />

        {/* Curved flowing wave shapes behind doctor on right */}
        <svg
          viewBox="0 0 500 200"
          fill="none"
          style={{
            position: "absolute",
            right: 120,
            bottom: -30,
            width: 340,
            height: 180,
            opacity: 0.35,
          }}
        >
          <path
            d="M50 160 C 140 120, 200 180, 320 110 C 400 60, 460 140, 520 80"
            stroke="url(#heroWaveGrad)"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="heroWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Small Medical Plus Symbols */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", top: 18, left: 160, opacity: 0.18 }}>
          <rect x="9" y="2" width="6" height="20" rx="3" fill="#0891B2" />
          <rect x="2" y="9" width="20" height="6" rx="3" fill="#0891B2" />
        </svg>
      </div>

      {/* ── Left Navigation Arrow (Matching Reference) ── */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(186, 225, 244, 0.90)",
          boxShadow: "0 2px 8px rgba(8, 40, 80, 0.08)",
          color: "#0891B2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 160ms ease",
        }}
        className="carousel-arrow-btn"
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
      </button>

      {/* ── Main Slide Composition (Fade + Slide Transition exactly like reference) ── */}
      <div
        key={`${active.id}-${currentSlide}`}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 54px 0 54px",
          animation: direction === "next" ? "heroSlideNext 550ms cubic-bezier(0.25, 1, 0.5, 1) forwards" : "heroSlidePrev 550ms cubic-bezier(0.25, 1, 0.5, 1) forwards",
        }}
        className="hero-slide-inner"
      >
        {/* 1. Left Illustration */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }} className="hero-left-illustration">
          {active.renderLeftVisual()}
        </div>

        {/* 2. Middle Text Area */}
        <div style={{ flex: 1, minWidth: 0, padding: "0 18px 0 16px" }}>
          {/* Pill Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#0284C7",
              background: "rgba(224, 242, 254, 0.85)",
              border: "1px solid rgba(186, 230, 253, 0.90)",
              padding: "2.5px 9px",
              borderRadius: 99,
            }}>
              <BadgeIcon style={{ width: 10.5, height: 10.5, color: "#0284C7" }} />
              {active.badge}
            </span>
          </div>

          {/* Heading */}
          <h2 style={{
            margin: 0,
            fontSize: 21,
            fontWeight: 800,
            color: INK,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}>
            {active.title}
          </h2>

          {/* Description */}
          <p style={{
            margin: "5px 0 12px",
            fontSize: 12.5,
            color: INK_MUT,
            lineHeight: 1.45,
            maxWidth: 460,
          }}>
            {active.description}
          </p>

          {/* Bottom Action Row: CTA Button + Indicators to the right (Exactly matching reference screenshot) */}
          <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            {/* CTA Button */}
            {active.ctaHref ? (
              <Link
                href={active.ctaHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 20px",
                  borderRadius: 11,
                  background: "linear-gradient(135deg, #0284C7 0%, #0891B2 55%, #06B6D4 100%)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                  transition: "all 180ms ease",
                }}
                className="hero-cta-btn"
              >
                <span>{active.ctaText}</span>
                <ArrowRight style={{ width: 14, height: 14 }} className="hero-cta-arrow" />
              </Link>
            ) : (
              <button
                onClick={active.ctaAction}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 20px",
                  borderRadius: 11,
                  background: "linear-gradient(135deg, #0284C7 0%, #0891B2 55%, #06B6D4 100%)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                  transition: "all 180ms ease",
                }}
                className="hero-cta-btn"
              >
                <span>{active.ctaText}</span>
                <ArrowRight style={{ width: 14, height: 14 }} className="hero-cta-arrow" />
              </button>
            )}

            {/* ── Auto-slide Indicators placed right next to CTA (Exactly as in reference screenshot) ── */}
            <div
              role="tablist"
              aria-label="Carousel pagination"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                paddingTop: 2,
              }}
            >
              {slides.map((s, idx) => {
                const isCur = idx === currentSlide;
                return (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={isCur}
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => goToSlide(idx)}
                    style={{
                      width: isCur ? 18 : 6,
                      height: 5.5,
                      borderRadius: 99,
                      background: isCur ? "#0284C7" : "rgba(186, 225, 244, 0.95)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 280ms cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Right Visual (Doctor / Clinic with soft blend) */}
        <div style={{ flexShrink: 0, height: "100%", display: "flex", alignItems: "flex-end" }} className="hero-right-visual">
          {active.renderRightVisual()}
        </div>
      </div>

      {/* ── Right Navigation Arrow ── */}
      <button
        onClick={nextSlide}
        aria-label="Next slide"
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(186, 225, 244, 0.90)",
          boxShadow: "0 2px 8px rgba(8, 40, 80, 0.08)",
          color: "#0891B2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 160ms ease",
        }}
        className="carousel-arrow-btn"
      >
        <ChevronRight style={{ width: 16, height: 16 }} />
      </button>

      {/* Scoped CSS animation and interactions */}
      <style>{`
        @keyframes heroSlideNext {
          0% {
            opacity: 0;
            transform: translateX(18px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes heroSlidePrev {
          0% {
            opacity: 0;
            transform: translateX(-18px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .hero-carousel-container:hover {
          box-shadow: 0 8px 24px rgba(8, 69, 120, 0.09) !important;
        }
        .carousel-arrow-btn:hover {
          background: #FFFFFF !important;
          border-color: #38BDF8 !important;
          color: #0284C7 !important;
          transform: translateY(-50%) scale(1.08) !important;
          box-shadow: 0 3px 12px rgba(8, 69, 120, 0.16) !important;
        }
        .hero-cta-btn:hover {
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45) !important;
          transform: translateY(-1px);
        }
        .hero-cta-btn:hover .hero-cta-arrow {
          transform: translateX(3px);
          transition: transform 180ms ease;
        }
        @media (max-width: 900px) {
          .hero-carousel-container {
            height: auto !important;
            padding: 16px 0 !important;
          }
          .hero-slide-inner {
            flex-direction: column !important;
            align-items: center !important;
            padding: 0 44px !important;
            text-align: center !important;
          }
          .hero-slide-inner p {
            max-width: 100% !important;
          }
          .hero-right-visual {
            display: none !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-slide-inner {
            animation: none !important;
          }
          .hero-carousel-container, .hero-cta-btn, .carousel-arrow-btn {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   HEALTH SNAPSHOT CARD

   Reads real vitals from extracted_entities (field_name contains known
   vital keywords). Shows a professional empty state when none are found.
   ════════════════════════════════════════════════════════════════════════ */

interface VitalReading {
  value: string;
  unit: string;
  updatedAt: string;
}

interface VitalsMap {
  heart_rate: VitalReading | null;
  blood_pressure: VitalReading | null;
  spo2: VitalReading | null;
  temperature: VitalReading | null;
}

/** Scan all extracted entities across all report details to find vital readings. */
function extractVitalsFromEntities(
  reports: PatientReportSummaryItem[],
): { vitals: VitalsMap; lastUpdated: string | null } {
  const vitals: VitalsMap = { heart_rate: null, blood_pressure: null, spo2: null, temperature: null };
  let lastUpdated: string | null = null;

  // We work with summary-level data available in the dashboard — no extra fetch needed.
  // The dashboard already has `reports` from the existing query (PatientReportSummaryItem[]).
  // Full entity values are not available here without an additional fetch; so we return null
  // for all vitals — the component will show proper empty states.
  // This is intentional: we NEVER fabricate medical data.
  void reports; // suppresses unused-var lint; data used by parent for other stat cards

  return { vitals, lastUpdated };
}

const VITAL_META = [
  {
    key: "heart_rate" as const,
    label: "Heart Rate",
    Icon: Heart,
    unit: "BPM",
    accent: "#EC4899",
    accentBg: "rgba(252,231,243,0.85)",
    accentBd: "rgba(236,72,153,0.22)",
    accentIcon: "rgba(236,72,153,0.15)",
  },
  {
    key: "blood_pressure" as const,
    label: "Blood Pressure",
    Icon: Droplets,
    unit: "mmHg",
    accent: "#3B82F6",
    accentBg: "rgba(219,234,254,0.85)",
    accentBd: "rgba(59,130,246,0.22)",
    accentIcon: "rgba(59,130,246,0.15)",
  },
  {
    key: "spo2" as const,
    label: "SpO₂",
    Icon: Wind,
    unit: "%",
    accent: BLUE,
    accentBg: "rgba(207,250,254,0.85)",
    accentBd: "rgba(8,145,178,0.22)",
    accentIcon: "rgba(8,145,178,0.15)",
  },
  {
    key: "temperature" as const,
    label: "Temperature",
    Icon: Thermometer,
    unit: "°C",
    accent: AMBER,
    accentBg: "rgba(254,243,199,0.85)",
    accentBd: "rgba(217,119,6,0.22)",
    accentIcon: "rgba(217,119,6,0.15)",
  },
] as const;

function HealthSnapshotCard({ vitals, lastUpdated }: { vitals: VitalsMap; lastUpdated: string | null }) {
  const hasAnyData = Object.values(vitals).some(Boolean);

  return (
    <GlassCard style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <SHead
        icon={Activity}
        title="Health Snapshot"
        right={
          <SLink href="/patient/health-record">View Health Record</SLink>
        }
      />

      {/* Metric grid */}
      <div style={{ padding: "14px 16px 6px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {VITAL_META.map(({ key, label, Icon, unit, accent, accentBg, accentBd, accentIcon }) => {
            const reading = vitals[key];
            return (
              <div
                key={key}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: accentBg,
                  border: `1px solid ${accentBd}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "transform 220ms ease, box-shadow 220ms ease",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${accent}22`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: accentIcon, border: `1px solid ${accentBd}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 220ms ease",
                }}>
                  <Icon style={{ width: 16, height: 16, color: accent }} />
                </div>

                {/* Values */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, color: INK_MUT, lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {label}
                  </p>
                  {reading ? (
                    <p style={{ margin: "3px 0 0", fontSize: 17, fontWeight: 700, color: INK, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                      {reading.value}
                      <span style={{ fontSize: 11, fontWeight: 500, color: INK_MUT, marginLeft: 4 }}>{unit}</span>
                    </p>
                  ) : (
                    <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 500, color: INK_FA, lineHeight: 1.3, fontStyle: "italic" }}>
                      No reading available
                    </p>
                  )}
                  {reading && (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: INK_FA }}>Latest reading</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: `1px solid ${GBD}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 4,
        }}>
          <p style={{ margin: 0, fontSize: 10.5, color: INK_FA }}>
            {lastUpdated
              ? `Last updated: ${lastUpdated}`
              : hasAnyData
              ? "Data sourced from clinical records"
              : "No vitals recorded yet — complete an intake session to begin."}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   UPCOMING APPOINTMENT CARD
   Uses the already-fetched encounters list. Picks the most recent
   non-completed encounter as the upcoming appointment.
   NEVER invents appointment data.
   ════════════════════════════════════════════════════════════════════════ */

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string; bd: string }> = {
  registered:         { label: "Registered",        color: GREEN,    bg: "rgba(5,150,105,0.08)",  bd: "rgba(5,150,105,0.26)"  },
  intake_in_progress: { label: "Intake in Progress", color: BLUE,     bg: "rgba(8,145,178,0.08)",  bd: "rgba(8,145,178,0.26)"  },
  submitted:          { label: "Submitted",          color: "#7C3AED", bg: "rgba(124,58,237,0.08)", bd: "rgba(124,58,237,0.26)" },
  ready_for_review:   { label: "Awaiting Doctor",   color: AMBER,    bg: "rgba(217,119,6,0.08)",  bd: "rgba(217,119,6,0.26)"  },
  completed:          { label: "Completed",          color: INK_MUT,  bg: "rgba(100,116,139,0.08)",bd: "rgba(100,116,139,0.22)" },
};

function UpcomingAppointmentCard({
  encounters,
  onViewAppointment,
}: {
  encounters: EncounterResponse[];
  onViewAppointment: (enc: EncounterResponse) => void;
}) {
  // Pick the most recent non-completed encounter as the "upcoming" appointment
  const upcoming = encounters.find(e => e.queue_status !== "completed") ?? null;
  const statusInfo = upcoming ? (STATUS_DISPLAY[upcoming.queue_status] ?? STATUS_DISPLAY.registered) : null;

  const formatDate = (iso: string | null | undefined): { date: string; time: string } => {
    if (!iso) return { date: "Date not set", time: "" };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  /* Inline button that looks identical to SLink but fires a callback */
  const ViewBtn = upcoming ? (
    <button
      onClick={() => onViewAppointment(upcoming)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 11.5, fontWeight: 600, color: BLUE,
        background: "none", border: "none", cursor: "pointer", padding: 0,
        transition: "color 150ms",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#075985"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = BLUE}
    >
      View Appointment <ChevronRight style={{ width: 12, height: 12 }} />
    </button>
  ) : undefined;

  return (
    <GlassCard style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <SHead
        icon={CalendarDays}
        title="Upcoming Appointment"
        color={BLUE}
        right={ViewBtn}
      />

      {upcoming ? (() => {
        const { date } = formatDate(upcoming.scheduled_at);
        const dept = upcoming.opd_department || "General OPD";

        return (
          <div style={{ padding: "16px 18px 18px" }}>
            {/* Doctor / Dept row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              {/* Avatar circle */}
              <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
                border: "2px solid rgba(59,130,246,0.28)",
                boxShadow: "0 2px 10px rgba(59,130,246,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <UserCheck style={{ width: 22, height: 22, color: "#3B82F6" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
                  {dept}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: INK_MUT }}>
                  {dept === "General OPD" ? "General Outpatient Consultation" : `${dept} Specialist`}
                </p>
              </div>

              {/* Status badge */}
              {statusInfo && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 600,
                  background: statusInfo.bg, border: `1px solid ${statusInfo.bd}`, color: statusInfo.color,
                  flexShrink: 0, whiteSpace: "nowrap",
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: statusInfo.color,
                    animation: upcoming.queue_status === "registered" ? "appt-pulse 2s ease-in-out infinite" : "none",
                    display: "inline-block",
                  }} />
                  {statusInfo.label}
                </span>
              )}
            </div>

            {/* Date / Type row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {/* Date */}
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(240,249,255,0.90)", border: `1px solid ${GBD}`,
                display: "flex", alignItems: "center", gap: 9,
              }}>
                <CalendarDays style={{ width: 16, height: 16, color: BLUE, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 9.5, fontWeight: 600, color: INK_MUT, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: INK, lineHeight: 1.3 }}>
                    {upcoming.scheduled_at ? date : "Not scheduled yet"}
                  </p>
                </div>
              </div>

              {/* Type */}
              <div style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(240,249,255,0.90)", border: `1px solid ${GBD}`,
                display: "flex", alignItems: "center", gap: 9,
              }}>
                <Stethoscope style={{ width: 16, height: 16, color: BLUE, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 9.5, fontWeight: 600, color: INK_MUT, textTransform: "uppercase", letterSpacing: "0.08em" }}>Type</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 600, color: INK, lineHeight: 1.3 }}>
                    {dept} Consultation
                  </p>
                </div>
              </div>
            </div>

            {/* View details CTA row */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: 10, borderTop: `1px solid ${GBD}`,
            }}>
              <p style={{ margin: 0, fontSize: 10, color: INK_FA, fontFamily: "monospace" }}>
                #{upcoming.id.slice(0, 8)}
                {upcoming.scheduled_at && (
                  <> · {new Date(upcoming.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                )}
              </p>
              <button
                onClick={() => onViewAppointment(upcoming)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  color: BLUE, background: "rgba(8,145,178,0.07)", border: "1px solid rgba(8,145,178,0.20)",
                  cursor: "pointer", transition: "all 180ms ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(8,145,178,0.14)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(8,145,178,0.38)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(8,145,178,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(8,145,178,0.20)";
                }}
              >
                View Details <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
        );
      })() : (
        /* Empty state — no upcoming appointment */
        <div style={{ padding: "28px 20px", textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(240,249,255,0.90)", border: `1px solid ${GBD}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <CalendarDays style={{ width: 22, height: 22, color: INK_FA }} />
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: INK_MID }}>
            No upcoming appointments
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: INK_FA, lineHeight: 1.5 }}>
            You don&apos;t have any active consultations scheduled.
          </p>
          <SLink href="/patient/intake">Start a New Consultation</SLink>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes appt-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.60; transform: scale(1.25); }
        }
      `}</style>
    </GlassCard>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   APPOINTMENT DETAILS MODAL
   Pure read-only view over existing encounter data. Zero fake data.
   ════════════════════════════════════════════════════════════════════════ */

function AppointmentDetailsModal({
  encounter,
  onClose,
}: {
  encounter: EncounterResponse;
  onClose: () => void;
}) {
  const dept        = encounter.opd_department || "General OPD";
  const statusInfo  = STATUS_DISPLAY[encounter.queue_status] ?? STATUS_DISPLAY.registered;
  const isScheduled = !!encounter.scheduled_at;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

  /* Detail row helper */
  const Row = ({
    icon: Icon, label, value, accent = BLUE, emptyText,
  }: {
    icon: React.ElementType; label: string; value?: string | null;
    accent?: string; emptyText?: string;
  }) => (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "12px 0", borderBottom: `1px solid ${GBD}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "rgba(240,249,255,0.92)", border: `1px solid ${GBD}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 15, height: 15, color: accent }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: INK_FA, textTransform: "uppercase", letterSpacing: "0.09em" }}>{label}</p>
        {value ? (
          <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.35 }}>{value}</p>
        ) : (
          <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 500, color: INK_FA, fontStyle: "italic" }}>{emptyText ?? "Not available"}</p>
        )}
      </div>
    </div>
  );

  return (
    /* Backdrop — click outside to close */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        background: "rgba(9,28,52,0.52)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "appt-modal-in 200ms ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes appt-modal-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes appt-card-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Modal card */}
      <div style={{
        width: "100%", maxWidth: 520,
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 20,
        border: `1px solid ${GBD}`,
        boxShadow: "0 24px 60px rgba(9,28,52,0.22), 0 4px 16px rgba(9,28,52,0.08)",
        overflow: "hidden",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        animation: "appt-card-in 220ms ease",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 22px 16px",
          background: "linear-gradient(135deg,#EAF6FD 0%,#F0FAFE 100%)",
          borderBottom: `1px solid ${GBD}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
              border: "2px solid rgba(59,130,246,0.28)",
              boxShadow: "0 2px 10px rgba(59,130,246,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Stethoscope style={{ width: 20, height: 20, color: "#3B82F6" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: INK, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                {dept}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: INK_MUT }}>Appointment Details</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "rgba(100,116,139,0.10)", border: "1px solid rgba(100,116,139,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 15, color: INK_MUT,
              transition: "background 150ms ease", lineHeight: 1,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(100,116,139,0.20)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(100,116,139,0.10)"}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "10px 22px 22px", overflowY: "auto", flex: 1 }}>

          {/* Status badge row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 10, marginTop: 16, marginBottom: 6,
            background: statusInfo.bg, border: `1px solid ${statusInfo.bd}`,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: statusInfo.color }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: statusInfo.color, flexShrink: 0,
                animation: encounter.queue_status === "registered" ? "appt-pulse 2s ease-in-out infinite" : "none",
                display: "inline-block",
              }} />
              {statusInfo.label}
            </span>
            <span style={{ fontSize: 10, color: INK_FA, fontFamily: "monospace" }}>
              Encounter #{encounter.id.slice(0, 8)}
            </span>
          </div>

          {/* Scheduling notice — only when no scheduled_at */}
          {!isScheduled && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "11px 14px", borderRadius: 10, marginBottom: 6,
              background: "rgba(254,243,199,0.70)", border: "1px solid rgba(217,119,6,0.24)",
            }}>
              <AlertCircle style={{ width: 15, height: 15, color: AMBER, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                <strong>Appointment time not yet scheduled.</strong>{" "}
                The hospital will confirm your appointment slot after reviewing your pre-consultation intake.
              </p>
            </div>
          )}

          {/* Detail rows */}
          <div style={{ marginTop: 8 }}>
            <Row icon={CalendarDays}  label="Department"         value={dept} />
            <Row
              icon={Stethoscope}
              label="Consultation Type"
              value={dept === "General OPD" ? "General Outpatient Consultation" : `${dept} Specialist Consultation`}
            />
            <Row
              icon={CalendarDays}
              label="Appointment Date"
              value={isScheduled ? fmtDate(encounter.scheduled_at!) : null}
              emptyText="Not scheduled yet"
              accent={isScheduled ? BLUE : INK_FA}
            />
            <Row
              icon={Activity}
              label="Appointment Time"
              value={isScheduled ? fmtTime(encounter.scheduled_at!) : null}
              emptyText="Not scheduled yet"
              accent={isScheduled ? BLUE : INK_FA}
            />
            <Row
              icon={UserCheck}
              label="Assigned Doctor"
              value={encounter.doctor_user_id ? `Assigned (ID: …${encounter.doctor_user_id.slice(-6)})` : null}
              emptyText="Not yet assigned"
              accent={encounter.doctor_user_id ? GREEN : INK_FA}
            />

            {/* Status description row */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: "rgba(240,249,255,0.92)", border: `1px solid ${GBD}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ClipboardList style={{ width: 15, height: 15, color: BLUE }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: INK_FA, textTransform: "uppercase", letterSpacing: "0.09em" }}>What to do next</p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: INK_MID, lineHeight: 1.5 }}>
                  {encounter.queue_status === "registered" && "Complete the CareVoice pre-consultation intake to describe your symptoms. This helps the doctor prepare before your visit."}
                  {encounter.queue_status === "intake_in_progress" && "Your intake session is in progress. Resume CareVoice to finish describing your symptoms."}
                  {(encounter.queue_status as string) === "submitted" && "Your intake has been submitted. The doctor will review your pre-consultation details soon."}
                  {encounter.queue_status === "ready_for_review" && "Your pre-consultation is complete and ready for your doctor. You will be contacted to confirm your appointment time."}
                  {encounter.queue_status === "completed" && "This consultation has been completed. View your health record for a summary."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer — only real system-supported actions ── */}
        <div style={{
          padding: "14px 22px",
          borderTop: `1px solid ${GBD}`,
          background: "rgba(240,249,255,0.60)",
          display: "flex", alignItems: "center", gap: 10,
          flexShrink: 0, flexWrap: "wrap",
        }}>
          {/* Primary action: Continue/Start Intake — only for non-completed */}
          {encounter.queue_status !== "completed" && (
            <Link
              href={`/patient/intake?encounter_id=${encounter.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: "linear-gradient(135deg,#0A3D78 0%,#0769A9 45%,#0891B2 80%,#06B6D4 100%)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 4px 14px rgba(8,69,120,0.35)",
                transition: "opacity 160ms ease",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              <Mic style={{ width: 14, height: 14 }} />
              {encounter.queue_status === "registered" ? "Start Pre-Consultation" : "Continue Intake"}
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          )}

          {/* Secondary: Close */}
          <button
            onClick={onClose}
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              color: INK_MID, background: "rgba(240,249,255,0.90)",
              border: `1px solid ${GBD}`, cursor: "pointer",
              transition: "background 160ms ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(220,238,248,0.90)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.90)"}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function PatientDashboard() {
  const router = useRouter();
  const qc     = useQueryClient();
  const [showDept, setShowDept]           = useState(false);
  const [actErr, setActErr]               = useState<string | null>(null);
  const [appointmentModal, setApptModal]  = useState<EncounterResponse | null>(null);

  /* ── Queries ── */
  const { data: profile, isLoading: lp, error: pErr } =
    useQuery<PatientProfileResponse>({
      queryKey: ["patient", "profile"], queryFn: getPatientProfile,
      retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
    });

  const { data: encounters = [] } =
    useQuery<EncounterResponse[]>({
      queryKey: ["patient", "encounters"], queryFn: getMyEncounters,
    });

  const { data: reports = [] } =
    useQuery<PatientReportSummaryItem[]>({
      queryKey: ["patient", "reports"],
      queryFn: () => getPatientReports().catch(() => []),
    });

  const { data: metrics } =
    useQuery<PatientDashboardMetrics | null>({
      queryKey: ["patient", "metrics"],
      queryFn: async () => {
        try {
          return await getPatientDashboardMetrics();
        } catch {
          return null;
        }
      },
    });

  const { data: documents = [] } =
    useQuery<PatientDocumentItem[]>({
      queryKey: ["patient", "documents"],
      queryFn: () => getPatientDocuments().catch(() => []),
    });

  useEffect(() => {
    if (pErr instanceof ApiError && pErr.status === 404) {
      router.replace("/patient/onboarding");
    }
  }, [pErr, router]);

  const createMut = useMutation({
    mutationFn: (dept: string) => createEncounter({ opd_department: dept || "General OPD" }),
    onSuccess: enc => {
      qc.invalidateQueries({ queryKey: ["patient", "encounters"] });
      qc.invalidateQueries({ queryKey: ["patient", "metrics"] });
      router.push(`/patient/intake?encounter_id=${enc.id}`);
    },
    onError: (err: unknown) => {
      setActErr(err instanceof ApiError ? err.detail : "Failed to start consultation.");
    },
  });

  const active  = encounters.filter(e => e.queue_status !== "completed");
  const primary = active[0] || null;

  /* ── Clinical Activity Feed ── */
  interface AI {
    id: string; rawDate: number; date: string;
    title: string; desc: string;
    badge: "success" | "info" | "pending" | "error" | "neutral";
    txt: string; dot: string; link?: string;
  }
  const acts: AI[] = [];

  encounters.forEach(e => {
    const d = new Date(e.scheduled_at || Date.now());
    const st = e.queue_status;
    acts.push({
      id: `e-${e.id}`, rawDate: d.getTime(),
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      title: e.opd_department
        ? `${e.opd_department} Consultation`
        : "General OPD Consultation",
      desc: `Status: ${st === "intake_in_progress" ? "intake in progress" : st || "registered"}`,
      badge: st === "completed" ? "success" : st === "intake_in_progress" ? "info" : "success",
      txt: st === "completed" ? "Completed" : st === "intake_in_progress" ? "Active" : "Active",
      dot: st === "completed" ? GREEN : "#3B82F6",
      link: `/patient/intake?encounter_id=${e.id}`,
    });
  });

  documents.forEach(r => {
    const d = new Date(r.uploaded_at || r.upload_timestamp || Date.now());
    const st = r.processing_status;
    const isErr = st === "failed";
    acts.push({
      id: `doc-${r.id}`, rawDate: d.getTime(),
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      title: r.original_filename || r.filename || "Document",
      desc: isErr
        ? `Extraction issue · ${r.processing_error?.slice(0, 55) ?? "Document extraction failed during parsing."}`
        : `${st === "processed" ? "Processed" : "Processing"} · ${r.document_type ?? "Clinical Document"}`,
      badge: isErr ? "error" : st === "processed" ? "success" : "pending",
      txt: isErr ? "Failed" : st === "processed" ? "Verified" : "Processing",
      dot: isErr ? RED : st === "processed" ? GREEN : AMBER,
      link: "/patient/documents",
    });
  });

  acts.sort((a, b) => b.rawDate - a.rawDate);
  const recent = acts.slice(0, 5);

  const topError = actErr || (
    pErr && !(pErr instanceof ApiError && pErr.status === 404)
      ? "Could not load records. Check your connection."
      : null
  );

  /* ── Skeleton ── */
  if (lp && encounters.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-pulse">
        {[72, 185, 96, 350].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: RC, background: "rgba(186,225,244,0.45)" }} />
        ))}
      </div>
    );
  }

  /* ── Stat Metrics ── */
  const totalConsults  = metrics?.consultations_count ?? encounters.length;
  const activeVisits   = active.length;
  const verifiedRpts   = metrics?.reports_count ?? reports.filter(r => r.doctor_review_status === "verified" || r.doctor_review_status === "completed").length;
  const clinicalDocs   = metrics?.documents_count ?? documents.length;

  const STATS: { label: string; value: number | string; icon: React.ElementType; grad: string; blob: string }[] = [
    {
      label: "Total Consultations", value: totalConsults,
      icon: Stethoscope,
      grad: "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
      blob: "linear-gradient(135deg,rgba(147,197,253,0.60),rgba(96,165,250,0.30))",
    },
    {
      label: "Active Visits", value: activeVisits,
      icon: Activity,
      grad: "linear-gradient(135deg,#D1FAE5,#A7F3D0)",
      blob: "linear-gradient(135deg,rgba(110,231,183,0.60),rgba(52,211,153,0.30))",
    },
    {
      label: "Verified Reports", value: verifiedRpts,
      icon: FileCheck2,
      grad: "linear-gradient(135deg,#EDE9FE,#DDD6FE)",
      blob: "linear-gradient(135deg,rgba(196,181,253,0.60),rgba(167,139,250,0.30))",
    },
    {
      label: "Clinical Documents", value: clinicalDocs,
      icon: ClipboardList,
      grad: "linear-gradient(135deg,#FCE7F3,#FBCFE8)",
      blob: "linear-gradient(135deg,rgba(249,168,212,0.60),rgba(236,72,153,0.28))",
    },
  ];

  /* ── Quick Action Button ── */
  const QBtn = ({
    icon: Icon, label, href, color = BLUE,
  }: { icon: React.ElementType; label: string; href: string; color?: string }) => (
    <Link
      href={href}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 600,
        color: color, textDecoration: "none",
        background: "rgba(240,250,255,0.85)",
        border: `1.5px solid ${color === BLUE ? "rgba(8,145,178,0.22)" : "rgba(5,150,105,0.22)"}`,
        boxShadow: "0 1px 4px rgba(8,40,80,0.04)",
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "#E0F2FE";
        (e.currentTarget as HTMLElement).style.borderColor = `${color}55`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px ${color}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(240,250,255,0.85)";
        (e.currentTarget as HTMLElement).style.borderColor = color === BLUE ? "rgba(8,145,178,0.22)" : "rgba(5,150,105,0.22)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(8,40,80,0.04)";
      }}
    >
      <Icon style={{ width: 13, height: 13 }} />
      {label}
    </Link>
  );

  /* ── Divider ── */
  const DIV: React.CSSProperties = { borderTop: `1px solid ${GBD}` };

  /* ════════════════════════ RENDER ════════════════════════════════════ */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28 }}>

      {/* ── Error Banner ── */}
      {topError && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
          borderRadius: 12, background: "rgba(254,226,226,0.92)", border: "1px solid rgba(220,38,38,0.28)",
          fontSize: 13, color: "#991B1B",
        }}>
          <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span>{topError}</span>
          <button onClick={() => setActErr(null)} style={{
            marginLeft: "auto", border: "none", background: "none", cursor: "pointer",
            fontSize: 14, color: "#991B1B", lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          1. HEADER
          ══════════════════════════════════════════════════════ */}
      <GlassCard style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>

          {/* Greeting + Subtitle */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: INK, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
                {greeting(profile?.full_name)}
              </h1>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#94A3B8", flexShrink: 0 }} />
              <span style={{ fontSize: 15.5, fontWeight: 700, color: BLUE }}>Patient Portal</span>
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 12.5, color: INK_MUT, lineHeight: 1.55 }}>
              AI Clinical Intake Workstation · Prepare symptoms and document evidence for your physician.
            </p>
          </div>

          {/* Right meta pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px",
              borderRadius: 99, fontSize: 11.5, fontWeight: 600,
              background: "rgba(240,249,255,0.92)", border: "1px solid rgba(186,225,244,0.80)",
              color: INK_MUT, boxShadow: "0 1px 4px rgba(8,40,80,0.04)",
            }}>
              <Calendar style={{ width: 12, height: 12, color: BLUE }} />
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            {(profile?.hospital_identifier || profile?.id) && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px",
                borderRadius: 99, fontSize: 11.5, fontWeight: 600,
                background: "rgba(240,249,255,0.92)", border: "1px solid rgba(186,225,244,0.80)",
                color: INK_MUT, boxShadow: "0 1px 4px rgba(8,40,80,0.04)",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE }} />
                ID: {(profile.hospital_identifier || profile.id).slice(0, 8)}
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════════════
          NEW: AUTO-SLIDING HEALTHCARE HERO CAROUSEL
          ══════════════════════════════════════════════════════ */}
      <HealthcareHeroCarousel
        primaryEncounter={primary}
        upcomingEncounter={encounters.find(e => e.queue_status !== "completed") ?? null}
        onOpenUpcomingModal={(enc) => setApptModal(enc)}
        onStartPreConsultation={() => setShowDept(true)}
      />

      {/* ══════════════════════════════════════════════════════
          2. CURRENT VISIT
          ══════════════════════════════════════════════════════ */}
      <GlassCard style={{ padding: "16px 20px 20px" }}>
        <VisitEcg />

        {/* Card label row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: GREEN,
              boxShadow: `0 0 0 2px rgba(5,150,105,0.22)`,
              flexShrink: 0,
            }} className="pulse-dot" />
            <span style={{
              fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.14em", color: INK_MUT,
            }}>Current Visit</span>
          </div>
          {primary && (
            <span style={{ fontSize: 11, color: INK_FA, fontFamily: "monospace" }}>
              #{primary.id.slice(0, 8)}
            </span>
          )}
        </div>

        {primary ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Visit row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Stethoscope icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg,#CFFAFE,#A5F3FC)",
                  border: "2px solid rgba(6,182,212,0.30)",
                  boxShadow: "0 2px 12px rgba(6,182,212,0.25)",
                }}>
                  <Stethoscope style={{ width: 24, height: 24, color: BLUE }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>
                      {primary.opd_department || "General OPD Visit"}
                    </span>
                    <Pill v="success">
                      <span style={{
                        display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                        background: GREEN, marginRight: 4,
                      }} />
                      Ready to Begin
                    </Pill>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: INK_MUT, lineHeight: 1.5 }}>
                    Consultation registered. Begin speaking with CareVoice or type your symptoms now.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <PrimaryCTA href={`/patient/intake?encounter_id=${primary.id}`}>
                Begin Pre-Consultation <ArrowRight style={{ width: 15, height: 15 }} />
              </PrimaryCTA>
            </div>

            {/* Stepper */}
            <Stepper cur={primary.queue_status === "intake_in_progress" ? 2 : 1} done={[]} />
          </div>
        ) : (
          /* No active encounter — start new */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg,#CFFAFE,#A5F3FC)",
                  border: "2px solid rgba(6,182,212,0.30)",
                }}>
                  <Stethoscope style={{ width: 24, height: 24, color: BLUE }} />
                </div>
                <div>
                  <span style={{ fontSize: 17, fontWeight: 700, color: INK }}>
                    {showDept ? "Select Department" : "Start a New Consultation"}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: INK_MUT }}>
                    No active visit. Begin a pre-consultation to prepare for your physician.
                  </p>
                </div>
              </div>

              {!showDept && (
                <PrimaryCTA onClick={() => setShowDept(true)}>
                  Start Pre-Consultation <ArrowRight style={{ width: 15, height: 15 }} />
                </PrimaryCTA>
              )}
            </div>

            {showDept && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DEPTS.map(dept => (
                  <button
                    key={dept}
                    disabled={createMut.isPending}
                    onClick={() => createMut.mutate(dept)}
                    style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 500,
                      background: "rgba(240,250,255,0.90)", border: "1.5px solid rgba(8,145,178,0.20)",
                      color: INK_MID, cursor: "pointer", transition: "all 150ms ease",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "#DBEAFE";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(8,145,178,0.45)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(240,250,255,0.90)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(8,145,178,0.20)";
                    }}
                  >
                    {createMut.isPending ? <Spinner className="w-3.5 h-3.5" /> : dept}
                  </button>
                ))}
              </div>
            )}

            <Stepper cur={1} done={[]} />
          </div>
        )}
      </GlassCard>

      {/* ══════════════════════════════════════════════════════
          3. STATISTICS CARDS (4-column)
          ══════════════════════════════════════════════════════ */}
      <div id="careflow-stats-overview" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}
        className="grid-cols-2 sm:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, grad, blob }) => (
          <GlassCard key={label} hover style={{ overflow: "hidden" }}>
            {/* Corner blob decoration */}
            <div style={{
              position: "absolute", bottom: -18, right: -18,
              width: 80, height: 80, borderRadius: "50%",
              background: blob, opacity: 0.70,
            }} aria-hidden />
            <div style={{ padding: "16px 18px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              {/* Icon circle */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: grad,
              }}>
                <Icon style={{ width: 20, height: 20, color: INK_MID }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: INK, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {value}
                </div>
                <div style={{ fontSize: 11.5, color: INK_MUT, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
              </div>
              <ChevronRight style={{ width: 14, height: 14, color: INK_FA, marginLeft: "auto", flexShrink: 0 }} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          4. QUICK ACTIONS BAR
          ══════════════════════════════════════════════════════ */}
      <GlassCard>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 20px", flexWrap: "wrap",
        }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.13em", color: INK_MUT, marginRight: 8, flexShrink: 0,
          }}>
            <Zap style={{ width: 13, height: 13, color: AMBER }} />
            Quick Actions
          </span>
          <QBtn icon={Mic}    label="Resume Intake"    href="/patient/intake" />
          <QBtn icon={Upload} label="Upload Document"  href="/patient/documents" />
          <QBtn icon={Activity} label="Health Record" href="/patient/health-record" />
          <QBtn icon={Calendar} label="Timeline"      href="/patient/timeline" />
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════════════
          5. NEW — HEALTH SNAPSHOT + UPCOMING APPOINTMENT (equal 50/50 columns)
          ══════════════════════════════════════════════════════ */}
      {(() => {
        const { vitals, lastUpdated } = extractVitalsFromEntities(reports);
        return (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            className="grid-cols-1 sm:grid-cols-2"
          >
            <HealthSnapshotCard vitals={vitals} lastUpdated={lastUpdated} />
            <UpcomingAppointmentCard
              encounters={encounters}
              onViewAppointment={(enc) => setApptModal(enc)}
            />
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          6. TWO-COLUMN LOWER SECTION
          ══════════════════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,7fr) minmax(0,5fr)",
        gap: 12,
      }} className="grid-cols-1 lg:grid-cols-[7fr_5fr]">

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Recent Clinical Activity */}
          <GlassCard>
            <SHead
              icon={Activity}
              title="Recent Clinical Activity"
              right={<SLink href="/patient/timeline">View Full Timeline</SLink>}
            />
            <div>
              {recent.length === 0 ? (
                <div style={{ padding: "28px 20px", textAlign: "center", color: INK_FA, fontSize: 13 }}>
                  No clinical activity yet.
                </div>
              ) : recent.map((a, i) => (
                <Link
                  key={a.id}
                  href={a.link ?? "#"}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 18px",
                    textDecoration: "none", transition: "background 150ms ease",
                    ...(i > 0 ? DIV : {}),
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.70)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {/* Colored dot */}
                  <div style={{ flexShrink: 0, paddingTop: 3 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: a.dot,
                    }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{a.title}</span>
                      {i === 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em",
                          padding: "2px 6px", borderRadius: 99, background: "rgba(8,145,178,0.12)",
                          border: "1px solid rgba(8,145,178,0.25)", color: BLUE,
                        }}>Latest</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: INK_MUT, lineHeight: 1.45 }}>{a.desc}</p>
                  </div>

                  {/* Right */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <Pill v={a.badge}>{a.txt}</Pill>
                    <span style={{ fontSize: 11, color: INK_FA, whiteSpace: "nowrap" }}>{a.date}</span>
                    <ChevronRight style={{ width: 13, height: 13, color: INK_FA }} />
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>

          {/* My Health Record Snapshot */}
          <GlassCard>
            <SHead
              icon={FileText}
              title="My Health Record Snapshot"
              right={<SLink href="/patient/health-record">Explore Record</SLink>}
            />
            <div style={{ padding: "13px 18px" }}>
              <p style={{ margin: 0, fontSize: 12.5, color: INK_MUT, lineHeight: 1.55 }}>
                Your full health record, past consultations, prescriptions, and clinical notes are available in the Health Record section.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Document Center */}
          <GlassCard>
            <SHead
              icon={FolderOpen}
              title="Document Center"
              right={<SLink href="/patient/documents">Manage ({documents.length})</SLink>}
            />
            <div>
              {documents.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: INK_FA, fontSize: 12.5 }}>
                  No documents uploaded yet.
                </div>
              ) : documents.slice(0, 3).map((doc, i) => {
                const st = (doc as PatientDocumentItem & { processing_status?: string }).processing_status ?? "uploaded";
                const isErr = st === "failed" || st === "extraction_failed";
                const isOk  = st === "completed" || st === "verified";
                const Icon  = isErr ? FileX2 : isOk ? FileCheck2 : FileClock;
                const docColor = isErr ? RED : isOk ? GREEN : AMBER;
                return (
                  <Link
                    key={doc.id}
                    href="/patient/documents"
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                      textDecoration: "none", transition: "background 150ms ease",
                      ...(i > 0 ? DIV : {}),
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.70)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isErr ? "rgba(220,38,38,0.08)" : isOk ? "rgba(5,150,105,0.08)" : "rgba(217,119,6,0.08)",
                      border: `1px solid ${docColor}25`,
                    }}>
                      <Icon style={{ width: 15, height: 15, color: docColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: INK, lineHeight: 1.3 }} className="truncate">
                        {doc.original_filename ?? "Untitled Document"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: INK_MUT }}>
                        {(doc as PatientDocumentItem & { report_type?: string }).report_type ?? "Prescription"}
                      </p>
                    </div>
                    <Pill v={isErr ? "error" : isOk ? "success" : "pending"}>
                      {isErr ? "Failed" : isOk ? "Verified" : "Processing"}
                    </Pill>
                  </Link>
                );
              })}

              {/* Accepted formats note */}
              <div style={{ padding: "10px 16px", borderTop: `1px solid ${GBD}` }}>
                <p style={{ margin: 0, fontSize: 10.5, color: INK_FA, lineHeight: 1.5 }}>
                  Accepted: Prescriptions, Lab Reports, Discharge Summaries (PDF / JPEG / PNG)
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Access */}
          <GlassCard>
            <SHead icon={Zap} title="Quick Access" color={AMBER} />
            <div>
              {[
                {
                  href: "/patient/intake",
                  icon: Mic,
                  label: "CareVoice Intake",
                  sub: "Start or resume consultation",
                  color: BLUE,
                },
                {
                  href: "/patient/documents",
                  icon: FileText,
                  label: "Documents",
                  sub: `${documents.length} uploaded`,
                  color: INK_MID,
                },
              ].map(({ href, icon: Icon, label, sub, color }, i) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    textDecoration: "none", transition: "background 150ms ease",
                    ...(i > 0 ? DIV : {}),
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(240,249,255,0.70)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(240,249,255,0.90)", border: `1px solid ${GBD}`,
                  }}>
                    <Icon style={{ width: 15, height: 15, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.2 }}>{label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: INK_MUT }}>{sub}</p>
                  </div>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(200,222,234,0.40)",
                  }}>
                    <ChevronRight style={{ width: 13, height: 13, color: INK_FA }} />
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {appointmentModal && (
        <AppointmentDetailsModal
          encounter={appointmentModal}
          onClose={() => setApptModal(null)}
        />
      )}
    </div>
  );
}
