"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleForgotPassword() {
    if (!email) {
      setMessage("Enter your email first, then click Forgot Password.");
      return;
    }

    setIsResetting(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setIsResetting(false);
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
    setIsResetting(false);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-start justify-center pt-12 lg:pt-16">
       <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-start">
          <div>
            <a href="/">
              <img
                src="/9dayauthor-logo.png"
                alt="9 Day Author"
                className="h-14 w-auto"
              />
            </a>

            <div className="mt-10 inline-flex rounded-full border border-[#d4af37]/30 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f5d76e]">
              Author Workspace
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight sm:text-6xl">
              Welcome back to your book.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
              Log in to continue your chapters, review your blueprint, and keep
              moving toward Amazon ready.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
            <h2 className="text-3xl font-black">Log In</h2>

            <p className="mt-2 text-white/55">
              Access your saved books and continue writing.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                  placeholder="Your password"
                />
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetting}
                className="text-sm font-bold text-[#d4af37] transition hover:opacity-80 disabled:opacity-50"
              >
                {isResetting ? "Sending reset email..." : "Forgot password?"}
              </button>

              {message ? (
                <div className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm font-bold text-[#f5d76e]">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[#d4af37] px-6 py-4 text-lg font-black text-black transition hover:scale-[1.02] disabled:opacity-60"
              >
                {isLoading ? "Logging In..." : "Log In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/55">
              New here?{" "}
              <a href="/signup" className="font-black text-[#d4af37]">
                Create your account
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}