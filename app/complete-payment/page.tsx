"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CompletePaymentPage() {
  const [email, setEmail] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/signup";
        return;
      }

      setEmail(session.user.email || "");
      setIsLoadingUser(false);
    }

    loadUser();
  }, []);

  async function startCheckout() {
    try {
      setIsStartingCheckout(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("Please create an account or log in before subscribing.");
        setIsStartingCheckout(false);
        return;
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setMessage(data.error || "Could not start checkout.");
        setIsStartingCheckout(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong starting checkout.");
      setIsStartingCheckout(false);
    }
  }

  if (isLoadingUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          <div className="rounded-[1.5rem] bg-black py-8">
            <img
              src="/9dayauthor-logo.svg"
              alt="9 Day Author"
              className="mx-auto h-16 w-auto"
            />
          </div>

          <div className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
            Complete Your Membership
          </div>

          <h1 className="mt-4 text-4xl font-black">
            Become a Founding Author
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">
            Your author account has been created successfully.
            Complete your Founding Author Membership to unlock all 9 Day Author features.
          </p>

          <div className="mt-8 rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/10 p-6">
            <div className="text-sm font-black uppercase tracking-[0.16em] text-[#d4af37]">
              Founding Author Membership
            </div>

            <div className="mt-3 text-5xl font-black text-white">
              $49<span className="text-lg text-white/55">/year</span>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Locked-in founding rate for early members. Future members will pay
              the standard annual price.
            </p>
          </div>

          {email ? (
            <p className="mt-5 text-sm text-white/45">
              Account: <span className="font-bold text-white/70">{email}</span>
            </p>
          ) : null}

          {message ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={startCheckout}
            disabled={isStartingCheckout}
            className="mt-8 w-full rounded-2xl bg-[#d4af37] px-6 py-4 text-lg font-black text-black transition hover:scale-[1.02] disabled:opacity-60"
          >
            {isStartingCheckout
              ? "Opening Secure Checkout..."
              : "Complete Payment"}
          </button>

          <p className="mt-5 text-xs leading-5 text-white/35">
            Secure payment powered by Stripe. Your membership renews annually.
          </p>
        </div>
      </div>
    </main>
  );
}