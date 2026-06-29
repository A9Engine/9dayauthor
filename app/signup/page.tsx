"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanDisplayName = displayName.trim() || cleanFirstName;
    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: cleanFirstName,
          last_name: cleanLastName,
          display_name: cleanDisplayName,
          full_name: fullName,
          name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          email: email.trim(),
          first_name: cleanFirstName,
          last_name: cleanLastName,
          display_name: cleanDisplayName,
          full_name: fullName,
          terms_accepted_at: new Date().toISOString(),
        })
        .eq("id", data.user.id);
    }

    router.push("/complete-payment");
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
              Start Your Book
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight sm:text-6xl">
              Create your author workspace.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
              Save your books, continue chapters, track progress, and build
              toward Amazon ready step by step.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
            <h2 className="text-3xl font-black">Create Account</h2>

            <p className="mt-2 text-white/55">
              Start your first book project in minutes.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                    First Name
                  </label>

                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                    Last Name
                  </label>

                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                  Display Name
                </label>

                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#d4af37]"
                  placeholder="Name shown inside 9 Day Author"
                />

                <p className="mt-2 text-sm text-white/40">
                  This is the name shown in your workspace. If left blank, we’ll
                  use your first name.
                </p>
              </div>

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

                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 pr-20 text-white outline-none transition focus:border-[#d4af37]"
                    placeholder="Create a password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#d4af37]"
                  >
                    {showPassword ? "Hide" : "View"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                  Confirm Password
                </label>

                <div className="relative mt-2">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 pr-20 text-white outline-none transition focus:border-[#d4af37]"
                    placeholder="Confirm your password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#d4af37]"
                  >
                    {showConfirmPassword ? "Hide" : "View"}
                  </button>
                </div>

                {confirmPassword && password !== confirmPassword ? (
                  <p className="mt-2 text-sm font-bold text-red-300">
                    Passwords do not match.
                  </p>
                ) : null}
              </div>

              <label className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/65">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0"
                />

                <span>
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="font-bold text-[#d4af37] underline underline-offset-4"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-[#d4af37] underline underline-offset-4"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {message ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[#d4af37] px-6 py-4 text-lg font-black text-black transition hover:scale-[1.02] disabled:opacity-60"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/55">
              Already have an account?{" "}
              <a href="/login" className="font-black text-[#d4af37]">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}