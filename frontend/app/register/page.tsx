"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, UserPlus, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth.store";
import { register, login, getMe } from "@/services/auth.service";
import { ApiError, storeToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "patient",
      });

      // Auto login after registration
      const tokenResp = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      storeToken(tokenResp.access_token);
      const user = await getMe(tokenResp.access_token);
      setAuth(tokenResp.access_token, user);

      // Redirect to onboarding to complete profile
      router.push("/patient/onboarding");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      if (err instanceof ApiError) {
        if (err.status === 400 && err.detail?.toLowerCase().includes("already registered")) {
          setError("An account with this email address already exists. Please sign in instead.");
        } else {
          setError(err.detail || "Registration failed. Please try again.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to connect to the clinical server. Please check your network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0D1117] text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0D5C75] flex items-center justify-center text-white border border-[#0D5C75]/60 shadow-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">CareFlow AI</h1>
            <p className="text-xs text-slate-400">Patient Portal Registration</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-surface)] text-[var(--ink-900)] rounded-lg border border-[var(--ink-200)] shadow-[var(--shadow-md)] p-8 sm:p-10 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--clinical-light)] text-[var(--clinical)] mb-2 border border-[var(--clinical-mid)]">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[var(--ink-900)]">Create Patient Account</h2>
            <p className="text-xs text-[var(--ink-500)]">
              Register to access automated pre-consultation intake and clinical records.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-md border border-[var(--status-error-bd)] bg-[var(--status-error-bg)] text-xs text-[var(--status-error-fg)] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-[var(--ink-800)] mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs p-3 rounded-md border border-[var(--ink-200)] bg-[var(--bg-surface)] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-[var(--clinical)] focus:ring-1 focus:ring-[var(--clinical)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--ink-800)] mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full text-xs p-3 rounded-md border border-[var(--ink-200)] bg-[var(--bg-surface)] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-[var(--clinical)] focus:ring-1 focus:ring-[var(--clinical)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--ink-800)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-xs p-3 pr-10 rounded-md border border-[var(--ink-200)] bg-[var(--bg-surface)] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-[var(--clinical)] focus:ring-1 focus:ring-[var(--clinical)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-700)] cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2 cursor-pointer">
              <span>Create Account</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-[var(--ink-200)]">
            <p className="text-xs text-[var(--ink-500)]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[var(--clinical)] hover:text-[var(--clinical-dark)] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
