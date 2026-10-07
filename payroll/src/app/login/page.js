"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";

const redirects = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  employee: "/employee/dashboard",
};

function LoginIllustration() {
  return (
    <svg
      viewBox="0 0 720 620"
      role=
      
      "img"
      aria-labelledby="login-illustration-title login-illustration-desc"
      className="h-auto w-full max-w-[620px]"
    >
      <title id="login-illustration-title">Payroll and attendance illustration</title>
      <desc id="login-illustration-desc">
        A flat illustration of a team workspace with payroll, attendance, and approval cues.
      </desc>

      <rect width="720" height="620" fill="#271202" rx="40" />
      <circle cx="120" cy="120" r="28" fill="#3e3404" opacity="0.22" />
      <circle cx="610" cy="110" r="18" fill="#6e3c0d" opacity="0.18" />
      <rect x="540" y="68" width="42" height="42" rx="14" fill="#61210a" opacity="0.24" />
      <rect x="92" y="432" width="34" height="34" rx="12" fill="#F5F1EA" opacity="0.22" />
      <circle cx="610" cy="500" r="26" fill="#491804" opacity="0.18" />

      <rect x="72" y="456" width="576" height="18" rx="9" fill="#6e3c0d" opacity="0.35" />

      <rect x="220" y="280" width="274" height="150" rx="26" fill="#3e3404" opacity="0.18" />
      <rect x="194" y="250" width="326" height="34" rx="17" fill="#61210a" />
      <rect x="224" y="288" width="266" height="134" rx="22" fill="#F5F1EA" />
      <rect x="322" y="322" width="68" height="82" rx="10" fill="#271202" />
      <rect x="334" y="334" width="44" height="52" rx="6" fill="#3e3404" />
      <rect x="309" y="408" width="94" height="12" rx="6" fill="#6e3c0d" />
      <rect x="136" y="328" width="118" height="22" rx="11" fill="#F5F1EA" />
      <rect x="134" y="350" width="126" height="18" rx="9" fill="#3e3404" />

      <rect x="250" y="186" width="96" height="104" rx="26" fill="#491804" />
      <circle cx="298" cy="168" r="34" fill="#F5F1EA" />
      <circle cx="286" cy="164" r="4" fill="#271202" />
      <circle cx="310" cy="164" r="4" fill="#271202" />
      <path
        d="M286 178 C293 185, 304 185, 311 178"
        fill="none"
        stroke="#271202"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M268 186 L248 222 L274 238 L284 208 Z" fill="#271202" />
      <path d="M328 186 L350 220 L320 238 L314 208 Z" fill="#271202" />
      <rect x="270" y="238" width="56" height="82" rx="24" fill="#6e3c0d" />
      <rect x="238" y="284" width="122" height="26" rx="13" fill="#3e3404" />

      <rect x="210" y="210" width="18" height="96" rx="9" fill="#271202" />
      <rect x="198" y="294" width="42" height="16" rx="8" fill="#271202" />
      <rect x="358" y="292" width="40" height="18" rx="9" fill="#271202" />
      <circle cx="219" cy="206" r="10" fill="#271202" />
      <circle cx="212" cy="248" r="10" fill="#271202" />
      <circle cx="212" cy="290" r="10" fill="#271202" />
      <circle cx="398" cy="298" r="10" fill="#271202" />

      <rect x="130" y="194" width="90" height="90" rx="24" fill="#3e3404" opacity="0.9" />
      <rect x="148" y="214" width="54" height="50" rx="10" fill="#F5F1EA" />
      <rect x="154" y="206" width="42" height="10" rx="5" fill="#6e3c0d" />
      <rect x="154" y="224" width="42" height="10" rx="5" fill="#3e3404" />
      <rect x="154" y="242" width="28" height="10" rx="5" fill="#271202" />

      <rect x="506" y="176" width="88" height="96" rx="24" fill="#61210a" />
      <rect x="522" y="200" width="56" height="12" rx="6" fill="#3e3404" />
      <rect x="522" y="222" width="56" height="12" rx="6" fill="#F5F1EA" />
      <rect x="522" y="244" width="34" height="12" rx="6" fill="#271202" />
      <circle cx="548" cy="302" r="28" fill="#491804" />
      <circle cx="548" cy="302" r="16" fill="#F5F1EA" />
      <rect x="522" y="294" width="52" height="16" rx="8" fill="#6e3c0d" />

      <rect x="520" y="360" width="74" height="52" rx="18" fill="#491804" />
      <rect x="532" y="348" width="50" height="18" rx="9" fill="#61210a" />
      <rect x="532" y="372" width="50" height="8" rx="4" fill="#F5F1EA" />
      <rect x="532" y="386" width="34" height="8" rx="4" fill="#F5F1EA" />
      <rect x="520" y="412" width="74" height="18" rx="9" fill="#3e3404" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Login failed.");
      }

      const target = redirects[data.role] || "/login";
      router.replace(target);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-pakistan-green px-4 py-8 text-lavender sm:px-6 lg:px-8">
      <div aria-hidden="true" className="absolute inset-0 isolate overflow-hidden">
        <div className="absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(170,174,127,0.22)_0%,rgba(170,174,127,0.08)_45%,rgba(170,174,127,0)_72%)] blur-3xl" />
        <div className="absolute left-[8%] top-[18%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(129,85,155,0.2)_0%,rgba(129,85,155,0.08)_45%,rgba(129,85,155,0)_72%)] blur-3xl" />
        <div className="absolute bottom-[10%] right-[6%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,127,80,0.16)_0%,rgba(255,127,80,0.06)_46%,rgba(255,127,80,0)_76%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <section className="relative hidden items-center justify-center lg:flex">
            <div className="absolute left-10 top-8 h-24 w-24 rounded-full bg-sage/20" />
            <div className="absolute right-6 top-20 h-16 w-16 rounded-2xl bg-coral/25" />
            <div className="absolute bottom-12 left-12 h-20 w-20 rounded-full bg-royal-purple/25" />
            <div className="relative w-full max-w-[620px] rounded-[2rem] border border-sage/20 bg-pakistan-green/90 p-6 shadow-[0_24px_80px_rgba(20,49,9,0.28)] backdrop-blur-sm">
              <LoginIllustration />
            </div>
          </section>

          <section className="mx-auto w-full max-w-[480px]">
            <div className="rounded-[2rem] border border-sage/30 bg-pakistan-green/92 p-7 shadow-[0_24px_80px_rgba(20,49,9,0.35)] backdrop-blur-xl sm:p-9">
              <div className="mb-8 space-y-5">
                <div className="inline-flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-royal-purple text-sm font-semibold text-lavender shadow-lg shadow-black/20">
                    W
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sage">
                      Workora
                    </p>
                    <p className="text-sm text-gray">Payroll and attendance workspace</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-lavender sm:text-[2rem]">
                    Sign in to your workspace
                  </h1>
                  <p className="max-w-sm text-sm leading-6 text-gray">
                    Trusted access for HR, finance, and team operations.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-sage/20 bg-royal-purple/10 px-4 py-3 text-sm text-lavender">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-sage" />
                  <span>Secure sign-in for approved Workora accounts.</span>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-lavender">
                    Email
                  </label>
                  <div className="group flex items-center rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 transition focus-within:border-royal-purple focus-within:ring-4 focus-within:ring-royal-purple/10">
                    <Mail className="mr-3 h-4 w-4 shrink-0 text-sage transition group-focus-within:text-lavender" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent text-lavender outline-none placeholder:text-gray/70"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-lavender">
                    Password
                  </label>
                  <div className="group flex items-center rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 transition focus-within:border-royal-purple focus-within:ring-4 focus-within:ring-royal-purple/10">
                    <Lock className="mr-3 h-4 w-4 shrink-0 text-sage transition group-focus-within:text-lavender" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full bg-transparent text-lavender outline-none placeholder:text-gray/70"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-coral/35 bg-coral/12 px-4 py-3 text-sm leading-6 text-lavender">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-royal-purple px-4 py-3.5 font-semibold text-lavender shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:bg-eminence hover:shadow-xl hover:shadow-black/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? "Signing in..." : "Login"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
