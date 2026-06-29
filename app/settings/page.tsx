"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthorLayout from "../components/AuthorLayout";
import { supabase } from "../../lib/supabase";

type Profile = {
  email: string | null;
  plan: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPlan(plan?: string | null) {
  if (!plan) return "Free";
  if (plan === "founding_author") return "Founding Author";

  return plan
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "email, plan, subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        setErrorMessage("Could not load account settings.");
      }

      setProfile(data || null);
      setIsLoading(false);
    }

    loadSettings();
  }, [router]);

  async function handleManageBilling() {
    setErrorMessage("");
    setIsOpeningPortal(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      setIsOpeningPortal(false);
      setErrorMessage("Please log in again to manage billing.");
      return;
    }

    const response = await fetch("/api/create-customer-portal-session", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.url) {
      setIsOpeningPortal(false);
      setErrorMessage(result.error || "Could not open billing portal.");
      return;
    }

    window.location.href = result.url;
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <AuthorLayout>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
          Account Settings
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">Settings</h1>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">
          Manage your account, membership, billing, and subscription details.
        </p>

        <div className="mt-10 rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
          {isLoading ? (
            <p className="font-semibold text-black/60">Loading settings...</p>
          ) : (
            <>
              <h2 className="text-2xl font-black">Account</h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#faf8f3] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                    Email
                  </div>
                  <div className="mt-2 font-black">
                    {profile?.email || "Not available"}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#faf8f3] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                    Plan
                  </div>
                  <div className="mt-2 font-black">
                    {formatPlan(profile?.plan)}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#faf8f3] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                    Status
                  </div>
                  <div className="mt-2 font-black capitalize">
                    {profile?.subscription_status || "inactive"}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#faf8f3] p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                    Access Until
                  </div>
                  <div className="mt-2 font-black">
                    {formatDate(profile?.current_period_end)}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-[#d4af37]/25 bg-[#fff8df] p-6">
                <h2 className="text-2xl font-black">Membership & Billing</h2>

                <p className="mt-3 leading-7 text-black/60">
                  Use the billing portal to update your payment method, view
                  invoices, or cancel your membership. If you cancel, you should
                  keep access until the end of your current paid membership
                  period.
                </p>

                <button
                  type="button"
                  onClick={handleManageBilling}
                  disabled={isOpeningPortal || !profile?.stripe_customer_id}
                  className="mt-6 rounded-2xl bg-black px-6 py-4 font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isOpeningPortal
                    ? "Opening Billing Portal..."
                    : "Manage Billing"}
                </button>

                {!profile?.stripe_customer_id ? (
                  <p className="mt-4 text-sm font-semibold text-black/45">
                    Billing management becomes available after an active
                    membership is connected.
                  </p>
                ) : null}
              </div>

              <div className="mt-8 rounded-3xl border border-black/10 bg-[#faf8f3] p-6">
                <h2 className="text-2xl font-black">Account Actions</h2>

                <p className="mt-3 leading-7 text-black/60">
                  Sign out of your account on this device.
                </p>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {errorMessage}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AuthorLayout>
  );
}