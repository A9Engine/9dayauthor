"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    setMessage("Password updated. Redirecting to login...");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          <a href="/">
            <img
              src="/9dayauthor-logo.png"
              alt="9 Day Author"
              className="h-14 w-auto"
            />
          </a>

          <h1 className="mt-8 text-4xl font-black">Reset Password</h1>

          <p className="mt-3 text-white/55">
            Enter your new password below.
          </p>

          <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                New Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                placeholder="New password"
              />
            </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                Confirm Password
              </label>

              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                placeholder="Confirm password"
              />
            </div>

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
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}