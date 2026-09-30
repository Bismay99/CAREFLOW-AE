"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Mic, ClipboardList, FileText, User, LogOut,
  Activity, Shield, Accessibility, Clock, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

/* ─── Navigation Data ────────────────────────────────────────────────── */
const NAV = [
  { label: "Home", items: [
    { href: "/patient/dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  ]},
  { label: "Consultation", items: [
    { href: "/patient/intake",        label: "Pre-Consultation",icon: Mic },
    { href: "/patient/reports",       label: "Health Reports",  icon: ClipboardList },
    { href: "/patient/documents",     label: "Documents",       icon: FileText },
  ]},
  { label: "Health", items: [
    { href: "/patient/health-record", label: "Health Record",   icon: Activity },
    { href: "/patient/timeline",      label: "Timeline",        icon: Clock },
  ]},
  { label: "Account", items: [
    { href: "/patient/profile",       label: "Profile",         icon: User },
    { href: "/patient/privacy",       label: "Privacy",         icon: Shield },
    { href: "/patient/accessibility", label: "Accessibility",   icon: Accessibility },
  ]},
];

const MOB = [
  { href: "/patient/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/patient/intake",    label: "Intake",  icon: Mic },
  { href: "/patient/documents", label: "Docs",    icon: FileText },
  { href: "/patient/reports",   label: "Reports", icon: ClipboardList },
  { href: "/patient/profile",   label: "Profile", icon: User },
];

/* ─── Sidebar Animated Background ───────────────────────────────────── */
function SidebarAnimatedBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>

      {/* ── Radial glow blobs (atmospheric lighting) ── */}
      <div style={{
        position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)",
        width: 190, height: 190, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.13) 0%, transparent 70%)",
        filter: "blur(22px)",
        animation: "sb-blob-1 11s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "38%", left: "15%",
        width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 70%)",
        filter: "blur(20px)",
        animation: "sb-blob-2 15s ease-in-out infinite 2.5s",
      }} />
      <div style={{
        position: "absolute", top: "68%", left: "55%",
        width: 140, height: 140, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.09) 0%, transparent 70%)",
        filter: "blur(18px)",
        animation: "sb-blob-1 18s ease-in-out infinite 5s",
      }} />

      {/* ── Vertical ambient glow sweep (deep blue → cyan drift) ── */}
      <div style={{
        position: "absolute", left: "50%", width: 190, height: 240, borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(34,211,238,0.11) 0%, transparent 70%)",
        transform: "translateX(-50%)",
        filter: "blur(34px)",
        animation: "sb-glow-sweep 24s ease-in-out infinite",
      }} />

      {/* ── Tiny floating particle dots ── */}
      {([
        { top: "14%", left: "16%", sz: 3, dl: "0s",   dur: "9s"  },
        { top: "32%", left: "82%", sz: 2, dl: "3.2s",  dur: "11s" },
        { top: "50%", left: "10%", sz: 3, dl: "6.8s",  dur: "10s" },
        { top: "65%", left: "75%", sz: 2, dl: "1.5s",  dur: "13s" },
        { top: "83%", left: "40%", sz: 3, dl: "4.5s",  dur: "8s"  },
      ] as const).map((d, i) => (
        <div key={`dot-${i}`} style={{
          position: "absolute", top: d.top, left: d.left,
          width: d.sz, height: d.sz, borderRadius: "50%",
          background: "rgba(255,255,255,0.85)",
          animation: `sb-dot-float ${d.dur} ease-in-out infinite`,
          animationDelay: d.dl,
        }} />
      ))}

      {/* ── Floating medical plus (+) symbols ── */}
      {([
        { top: "10%",  left: "12%",  sz: 14, op: 0.12, dur: "20s", dl: "0s",   rot: "5deg"  },
        { top: "28%",  left: "78%",  sz: 11, op: 0.10, dur: "26s", dl: "3s",   rot: "-4deg" },
        { top: "48%",  left: "18%",  sz: 13, op: 0.11, dur: "22s", dl: "7s",   rot: "3deg"  },
        { top: "64%",  left: "70%",  sz: 10, op: 0.09, dur: "30s", dl: "5s",   rot: "-6deg" },
        { top: "88%",  left: "25%",  sz: 12, op: 0.10, dur: "24s", dl: "2s",   rot: "4deg"  },
      ] as const).map((d, i) => (
        <div key={`cross-${i}`} style={{
          position: "absolute", top: d.top, left: d.left, opacity: d.op,
          animation: `${i % 2 === 0 ? "float-cross" : "float-cross-2"} ${d.dur} ease-in-out infinite`,
          animationDelay: d.dl,
          transform: `rotate(${d.rot})`,
        }}>
          <svg width={d.sz} height={d.sz} viewBox="0 0 24 24" fill="white">
            <rect x="9" y="2" width="6" height="20" rx="3" />
            <rect x="2" y="9" width="20" height="6" rx="3" />
          </svg>
        </div>
      ))}

      {/* ── Faint curved wave lines (mid sidebar) ── */}
      <svg
        viewBox="0 0 210 130"
        fill="none"
        style={{
          position: "absolute", top: "30%", left: 0, width: "100%", height: 130,
          animation: "sb-wave-drift 17s ease-in-out infinite",
        }}
      >
        <path d="M-5 45 Q52 18 105 45 T218 45"
          stroke="rgba(255,255,255,0.55)" strokeWidth="0.75" />
        <path d="M-5 65 Q52 38 105 65 T218 65"
          stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        <path d="M-5 28 Q52 6 105 28 T218 28"
          stroke="rgba(34,211,238,0.38)" strokeWidth="0.6" />
      </svg>

      {/* ── Second faint wave (lower section) ── */}
      <svg
        viewBox="0 0 210 100"
        fill="none"
        style={{
          position: "absolute", top: "58%", left: 0, width: "100%", height: 100,
          animation: "sb-wave-drift 21s ease-in-out infinite 4s",
        }}
      >
        <path d="M-5 50 Q52 25 105 50 T218 50"
          stroke="rgba(255,255,255,0.30)" strokeWidth="0.65" />
        <path d="M-5 68 Q52 44 105 68 T218 68"
          stroke="rgba(34,211,238,0.25)" strokeWidth="0.5" />
      </svg>

      {/* ── Occasional ripple pulse (bottom quarter) ── */}
      <div style={{
        position: "absolute", bottom: "22%", left: "50%", transform: "translateX(-50%)",
        width: 40, height: 40,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.22)",
          animation: "sb-ripple 6s ease-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.14)",
          animation: "sb-ripple 6s ease-out infinite 2s",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.10)",
          animation: "sb-ripple 6s ease-out infinite 4s",
        }} />
      </div>

    </div>
  );
}

/* ─── Sidebar ECG Line (lower portion) ──────────────────────────────── */
function SbEcg() {
  return (
    <svg viewBox="0 0 170 26" fill="none"
      style={{ width: "100%", height: 20 }}
      aria-hidden>
      {/* Shadow / glow path */}
      <path
        d="M0 13 L28 13 L34 13 L39 2 L44 24 L49 6 L54 18 L59 13 L87 13 L93 13 L98 2 L103 24 L108 6 L113 18 L118 13 L170 13"
        stroke="rgba(34,211,238,0.18)" strokeWidth="3" strokeLinecap="round"
        filter="url(#ecgBlur)"
      />
      {/* Main ECG line */}
      <path
        d="M0 13 L28 13 L34 13 L39 2 L44 24 L49 6 L54 18 L59 13 L87 13 L93 13 L98 2 L103 24 L108 6 L113 18 L118 13 L170 13"
        stroke="rgba(34,211,238,0.58)" strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray="400" strokeDashoffset="400"
        style={{ animation: "ecg-line 3.6s ease-in-out infinite" }}
      />
      <defs>
        <filter id="ecgBlur" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
    </svg>
  );
}

/* ─── Sidebar Bottom Decor (Heart + ECG Arms + Leaves) ──────────────── */
function SbDecor() {
  return (
    <div style={{ position: "relative", height: 56, width: "100%" }} aria-hidden>

      {/* Left leaf */}
      <svg viewBox="0 0 36 60" fill="none"
        style={{ position: "absolute", left: 8, bottom: 4, width: 24, height: 42, opacity: 0.72 }}>
        <path d="M18 56C18 56 3 42 3 26C3 12 10 3 18 3C26 3 33 12 33 26C33 42 18 56 18 56Z"
          fill="rgba(52,211,153,0.26)" stroke="rgba(52,211,153,0.52)" strokeWidth="1" />
        <line x1="18" y1="56" x2="18" y2="10"
          stroke="rgba(52,211,153,0.36)" strokeWidth="1" strokeLinecap="round" />
        <line x1="18" y1="40" x2="10" y2="28"
          stroke="rgba(52,211,153,0.22)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="18" y1="30" x2="26" y2="20"
          stroke="rgba(52,211,153,0.22)" strokeWidth="0.8" strokeLinecap="round" />
      </svg>

      {/* Left ECG arm */}
      <svg viewBox="0 0 64 16" fill="none"
        style={{ position: "absolute", left: 34, bottom: 26, width: 46, height: 16 }}>
        <path d="M0 8 L14 8 L18 2 L22 14 L26 4 L30 11 L34 8 L64 8"
          stroke="rgba(34,211,238,0.68)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Center heart — with double-beat pulse animation */}
      <div style={{
        position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)",
      }}>
        {/* Outer ripple ring */}
        <div style={{
          position: "absolute", inset: -8, borderRadius: "50%",
          border: "1px solid rgba(147,51,234,0.20)",
          animation: "sb-ripple 4s ease-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147,51,234,0.14) 0%, transparent 70%)",
          filter: "blur(6px)",
          animation: "sb-blob-1 5s ease-in-out infinite",
        }} />

        {/* Heart circle */}
        <div
          className="sb-heart-beat"
          style={{
            position: "relative",
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#9333EA,#EC4899)",
            boxShadow: "0 0 16px 5px rgba(147,51,234,0.45), 0 2px 8px rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="white">
            <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.25 3 11.81 3.88 12 5C12.19 3.88 13.75 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14.5 12 21 12 21Z" />
          </svg>
        </div>
      </div>

      {/* Right ECG arm */}
      <svg viewBox="0 0 64 16" fill="none"
        style={{ position: "absolute", right: 34, bottom: 26, width: 46, height: 16 }}>
        <path d="M0 8 L30 8 L34 2 L38 14 L42 4 L46 11 L50 8 L64 8"
          stroke="rgba(34,211,238,0.68)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Right leaf */}
      <svg viewBox="0 0 36 60" fill="none"
        style={{ position: "absolute", right: 8, bottom: 4, width: 24, height: 42, opacity: 0.58, transform: "scaleX(-1)" }}>
        <path d="M18 56C18 56 3 42 3 26C3 12 10 3 18 3C26 3 33 12 33 26C33 42 18 56 18 56Z"
          fill="rgba(52,211,153,0.22)" stroke="rgba(52,211,153,0.46)" strokeWidth="1" />
        <line x1="18" y1="56" x2="18" y2="10"
          stroke="rgba(52,211,153,0.30)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ─── Full-viewport Fixed Page Background ────────────────────────────── */
function PageBackground() {
  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
    }}>
      {/* Base gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(150deg,#DAF0F9 0%,#E8F7FD 20%,#F0FAFE 45%,#E4F5FB 70%,#EBF7FC 100%)",
      }} />

      {/* Ambient glows */}
      <div style={{
        position: "absolute", top: -80, left: 140, width: 560, height: 560, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(186,230,253,0.55) 0%,transparent 65%)",
        animation: "bg-glow-breathe 14s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: -60, right: 0, width: 580, height: 580, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(165,243,252,0.48) 0%,transparent 65%)",
        animation: "bg-glow-breathe 17s ease-in-out infinite 4s",
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "40%", width: 420, height: 420, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(224,242,254,0.35) 0%,transparent 65%)",
        animation: "bg-glow-breathe 12s ease-in-out infinite 7s",
      }} />

      {/* Floating crosses LEFT */}
      {([
        { top: "6%",  left: "1.2%",  sz: 36, op: 0.45, dur: "18s", dl: "0s",   a: "float-cross" },
        { top: "26%", left: "0.8%",  sz: 26, op: 0.35, dur: "22s", dl: "3s",   a: "float-cross-2" },
        { top: "50%", left: "1.5%",  sz: 30, op: 0.38, dur: "19s", dl: "6s",   a: "float-cross" },
        { top: "74%", left: "0.9%",  sz: 22, op: 0.32, dur: "25s", dl: "1.5s", a: "float-cross-2" },
      ] as const).map((d, i) => (
        <div key={`cl${i}`} style={{
          position: "absolute", top: d.top, left: d.left,
          animation: `${d.a} ${d.dur} ease-in-out infinite`,
          animationDelay: d.dl, opacity: d.op,
        }}>
          <svg width={d.sz} height={d.sz} viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="20" rx="3" fill="#38BDF8" />
            <rect x="2" y="9" width="20" height="6" rx="3" fill="#38BDF8" />
          </svg>
        </div>
      ))}

      {/* Floating crosses RIGHT */}
      {([
        { top: "18%", right: "1.2%", sz: 30, op: 0.40, dur: "20s", dl: "2s",  a: "float-cross" },
        { top: "42%", right: "0.8%", sz: 24, op: 0.32, dur: "16s", dl: "5s",  a: "float-cross-2" },
        { top: "68%", right: "1.5%", sz: 28, op: 0.36, dur: "23s", dl: "9s",  a: "float-cross" },
      ] as const).map((d, i) => (
        <div key={`cr${i}`} style={{
          position: "absolute", top: d.top, right: d.right,
          animation: `${d.a} ${d.dur} ease-in-out infinite`,
          animationDelay: d.dl, opacity: d.op,
        }}>
          <svg width={d.sz} height={d.sz} viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="20" rx="3" fill="#38BDF8" />
            <rect x="2" y="9" width="20" height="6" rx="3" fill="#38BDF8" />
          </svg>
        </div>
      ))}

      {/* Heart badge top-right */}
      <div style={{
        position: "absolute", top: 16, right: 22,
        animation: "bg-heart-pulse 4.5s ease-in-out infinite",
      }}>
        <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "absolute", inset: -18, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(165,243,252,0.55) 0%,transparent 68%)",
          }} />
          <svg viewBox="0 0 100 100" style={{ width: 90, height: 90, filter: "drop-shadow(0 6px 18px rgba(34,211,238,0.40))" }}>
            <path d="M50 86 C50 86 11 59 11 34 C11 19 22 9 35 9 C42 9 47 13 50 17 C53 13 58 9 65 9 C78 9 89 19 89 34 C89 59 50 86 50 86 Z"
              fill="url(#hGrad)" stroke="rgba(255,255,255,0.90)" strokeWidth="2.5" />
            <path d="M18 50 L34 50 L40 34 L46 62 L52 38 L57 52 L61 50 L82 50"
              fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.92" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Botanical leaves bottom-left */}
      <div style={{
        position: "absolute", bottom: -24, left: 170,
        animation: "bg-leaf-sway 10s ease-in-out infinite", opacity: 0.55,
      }}>
        <svg viewBox="0 0 220 240" fill="none" style={{ width: 220, height: 240 }}>
          <path d="M45 200 C45 200 12 148 20 95 C27 58 55 32 85 32 C107 32 126 46 132 66 C146 104 124 168 45 200 Z" fill="url(#bLf1)" />
          <path d="M80 215 C80 215 118 182 155 160 C190 140 215 142 215 155 C215 172 198 192 178 204 C150 222 110 224 80 215 Z" fill="url(#bLf2)" />
          <line x1="45" y1="200" x2="92" y2="50" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="80" y1="215" x2="178" y2="162" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="bLf1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="bLf2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.78" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top-right wave ribbon */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: "52%", height: 240, opacity: 0.32,
        animation: "bg-wave-drift 15s ease-in-out infinite",
      }}>
        <svg viewBox="0 0 640 220" fill="none" style={{ width: "100%", height: "100%" }}>
          <path d="M60 80 Q210 10 400 95 T640 42 L640 0 L0 0 Z" fill="url(#tw1)" />
          <path d="M0 125 Q220 52 440 135 T640 92" fill="none" stroke="rgba(56,189,248,0.38)" strokeWidth="1.5" />
          <defs>
            <linearGradient id="tw1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.14" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom-right wave */}
      <div style={{
        position: "absolute", bottom: 0, right: 0, width: "46%", height: 210, opacity: 0.34,
        animation: "bg-wave-drift 18s ease-in-out infinite 3s",
      }}>
        <svg viewBox="0 0 520 200" fill="none" style={{ width: "100%", height: "100%" }}>
          <path d="M0 148 Q188 72 352 140 T520 88 L520 200 L0 200 Z" fill="url(#bw1)" />
          <defs>
            <linearGradient id="bw1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.26" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ECG sweep mid-right */}
      <div style={{
        position: "absolute", top: "32%", right: -24, width: 460, height: 60, opacity: 0.35,
        animation: "ecg-draw-slow 10s linear infinite",
      }}>
        <svg viewBox="0 0 460 60" fill="none" style={{ width: "100%", height: "100%" }}>
          <path
            d="M0 30 L110 30 L125 30 L136 10 L147 52 L158 16 L169 44 L180 30 L300 30 L315 30 L326 10 L337 52 L348 16 L359 44 L370 30 L460 30"
            fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="900" strokeDashoffset="900"
          />
        </svg>
      </div>
    </div>
  );
}

/* ─── Patient Layout ─────────────────────────────────────────────────── */
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/login"); };
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const name     = user?.full_name ?? user?.email ?? "Patient";
  const initials = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0].toUpperCase()).join("");

  /* ── Sidebar JSX ── */
  const Sidebar = (
    <div
      className="flex flex-col h-full relative overflow-hidden select-none"
      style={{
        background: "linear-gradient(180deg,#091E34 0%,#0B3060 18%,#0A52A0 38%,#0879C4 55%,#0891B2 68%,#07B0D0 82%,#22D3EE 100%)",
        boxShadow: "4px 0 28px rgba(6,28,50,0.38)",
      }}
    >
      {/* ══ ANIMATED BACKGROUND LAYER ══ */}
      <SidebarAnimatedBg />

      {/* ══ WORDMARK ══ */}
      <div className="flex items-center gap-2 px-3.5 py-3.5 border-b border-white/10 shrink-0 relative z-10">
        {/* Logo icon — subtle init glow + hover scale */}
        <div
          className="sb-logo-icon w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/25"
          style={{ background: "rgba(255,255,255,0.14)" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12L6 12L9 5L12 19L15 9L18 12L21 12" />
          </svg>
        </div>
        <span className="font-bold text-white text-[13.5px] tracking-tight leading-none">
          CareFlow AI
        </span>
        <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border border-white/20 text-white/90 ml-auto"
          style={{ background: "rgba(255,255,255,0.14)" }}>
          Patient
        </span>
        <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-white/40 ml-0.5" />
      </div>

      {/* ══ NAVIGATION ══ */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto no-scrollbar min-h-0 relative z-10"
        aria-label="Patient">
        {NAV.map((group, gi) => (
          <div key={group.label} className={gi === 0 ? "mb-1.5" : "mt-4 mb-1.5"}>
            {/* Group label */}
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 px-2 mb-1 select-none">
              {group.label}
            </p>

            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const act = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={act ? "page" : undefined}
                    /* sb-nav-link enables CSS micro-interactions (icon slide + text brighten) */
                    className={`sb-nav-link ${act ? "sb-nav-active" : ""} flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[12.5px] relative overflow-hidden no-underline`}
                    style={{
                      fontWeight: act ? 600 : 500,
                      color: act ? "#FFFFFF" : "rgba(255,255,255,0.68)",
                      background: act
                        ? "linear-gradient(90deg,rgba(255,255,255,0.22),rgba(255,255,255,0.10))"
                        : "transparent",
                      border: act ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                      boxShadow: act ? "0 2px 10px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                      transition: "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
                    }}
                  >
                    {/* Active shimmer sweep */}
                    {act && (
                      <span
                        aria-hidden
                        className="absolute inset-0 pointer-events-none rounded-[10px]"
                        style={{
                          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)",
                          animation: "nav-shimmer 4s ease infinite",
                        }}
                      />
                    )}

                    {/* Icon wrapper — sb-nav-icon enables slide-right on hover */}
                    <span className="sb-nav-icon" style={{ display: "flex", flexShrink: 0 }}>
                      <Icon
                        aria-hidden
                        className="w-3.5 h-3.5"
                        style={{
                          color: act ? "rgba(125,242,255,0.95)" : "rgba(255,255,255,0.60)",
                          transition: "color 200ms ease",
                        }}
                      />
                    </span>

                    {/* Label — sb-nav-text enables brightening on hover */}
                    <span className="sb-nav-text flex-1 leading-none">{label}</span>

                    {act && (
                      <ChevronRight
                        aria-hidden
                        className="w-3 h-3 shrink-0"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ══ ECG LINE + HEART + LEAVES ══ */}
      <div className="relative z-10 px-2.5 pt-0.5 shrink-0" aria-hidden>
        <SbEcg />
        <SbDecor />
      </div>

      {/* ══ PROFILE + SIGN OUT ══ */}
      <div className="shrink-0 p-2.5 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-2 px-1 mb-2">

          {/* Avatar — sb-avatar-glow adds the breathing cyan glow */}
          <div
            className="sb-avatar-glow shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg,#06B6D4,#0884AB)",
              border: "2px solid rgba(255,255,255,0.32)",
              cursor: "default",
              transition: "transform 250ms ease",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(1.03)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = ""}
            aria-hidden
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold text-white leading-tight truncate m-0">
              {name}
            </p>
            {user?.email && (
              <p className="text-[9.5px] text-white/50 m-0 truncate leading-snug">
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/62 border border-white/14 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.05)",
            transition: "background 180ms ease, color 180ms ease, border-color 180ms ease",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(220,38,38,0.22)";
            el.style.color = "rgba(252,165,165,1)";
            el.style.borderColor = "rgba(239,68,68,0.38)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(255,255,255,0.05)";
            el.style.color = "";
            el.style.borderColor = "rgba(255,255,255,0.14)";
          }}
        >
          <LogOut aria-hidden className="w-3.5 h-3.5 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed full-viewport healthcare atmospheric background */}
      <PageBackground />

      <div className="flex min-h-screen w-full" style={{ position: "relative", zIndex: 1 }}>

        {/* Desktop Sidebar */}
        <aside
          className="desktop-sidebar-only hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30"
          style={{ width: 210 }}
          aria-label="Patient navigation"
        >
          {Sidebar}
        </aside>

        {/* Mobile Header */}
        <div
          className="mobile-header-only flex md:hidden fixed top-0 left-0 right-0 z-20 h-14 px-4 items-center justify-between"
          style={{
            background: "linear-gradient(90deg,#091E34,#0891B2)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 2px 12px rgba(9,30,52,0.30)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="sb-logo-icon w-7 h-7 rounded-lg flex items-center justify-center border border-white/20"
              style={{ background: "rgba(255,255,255,0.14)" }}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12L6 12L9 5L12 19L15 9L18 12L21 12" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">CareFlow AI</span>
          </div>
          <button onClick={handleLogout} aria-label="Sign out"
            className="p-1.5 text-white/75 hover:text-red-300 cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Bottom Nav */}
        <nav
          className="mobile-nav-only flex md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-white/10"
          style={{ background: "linear-gradient(90deg,#091E34,#0891B2)" }}
          aria-label="Mobile navigation"
        >
          {MOB.map(({ href, label, icon: Icon }) => {
            const isAct = isActive(href);
            return (
              <Link key={href} href={href} aria-current={isAct ? "page" : undefined}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 no-underline transition-colors"
                style={{ color: isAct ? "#22D3EE" : "rgba(255,255,255,0.60)" }}>
                <Icon className="w-4 h-4" />
                <span className="text-[9.5px] font-medium">{label}</span>
                <span className="rounded-full bg-[#22D3EE] transition-all duration-200"
                  style={{ width: isAct ? 4 : 0, height: isAct ? 4 : 0 }} />
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main
          className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0"
          style={{ position: "relative", zIndex: 10 }}
        >
          <div className="md:ml-[210px]">
            <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-5 lg:px-6 py-5">
              {children}
            </div>
          </div>
        </main>

      </div>
    </>
  );
}
