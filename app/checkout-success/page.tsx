import Link from "next/link";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type CheckoutSuccessPageProps = {
  searchParams?: Promise<{ session_id?: string }> | { session_id?: string };
};

function getFirstName(name?: string | null) {
  if (name?.trim()) return name.trim().split(" ")[0];
  return "Author";
}

function formatRenewalDate(timestamp?: number | null) {
  if (!timestamp) return "Available in your billing account";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const sessionId = resolvedSearchParams.session_id;

  let firstName = "Author";
  let membershipName = "Founding Author Membership";
  let renewalDate = "Available in your billing account";

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "line_items.data.price.product"],
      });

      const userId = session.metadata?.user_id || null;

      let profileName: string | null = null;
      let profileEmail: string | null = null;

      if (userId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("first_name, full_name, display_name, current_period_end")
          .eq("id", userId)
          .single();

        profileName =
  profile?.first_name ||
  profile?.full_name?.split(" ")[0] ||
  profile?.display_name ||
  null;

  if (profile?.current_period_end) {
  renewalDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(profile.current_period_end));
}
      }

      firstName = getFirstName(profileName);

      const lineItem = session.line_items?.data?.[0];
      const product = lineItem?.price?.product as any;

      if (product?.name?.includes("Founding Author")) {
        membershipName = "Founding Author Membership";
      } else if (product?.name) {
        membershipName = product.name;
      }

      const subscription = session.subscription as any;

      if (
  renewalDate === "Available in your billing account" &&
  subscription?.current_period_end
) {
  renewalDate = formatRenewalDate(Number(subscription.current_period_end));
}
    } catch (error) {
      console.error("Checkout success page error:", error);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-10 text-black sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5">
          <div className="mb-8 rounded-[1.5rem] bg-black py-8">
            <img
              src="/9dayauthor-logo.svg"
              alt="9 Day Author"
              className="mx-auto h-16 w-auto"
            />
          </div>

          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
            Welcome to 9 Day Author
          </div>

          <h1 className="mt-4 text-4xl font-black">
            Welcome, {firstName}.
          </h1>

          <p className="mt-6 text-lg leading-8 text-black/60">
            Your 9 Day Author membership is active. You can now create, write,
            format, design covers, export, and publish your books.
          </p>

          <div className="mt-8 grid gap-4 rounded-2xl bg-[#f7f4ed] p-6 text-left sm:grid-cols-2">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-black/45">
                Membership
              </div>
              <div className="mt-2 text-lg font-black">{membershipName}</div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-black/45">
                Renews
              </div>
              <div className="mt-2 text-lg font-black">{renewalDate}</div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-black p-6 text-left text-white">
            <h2 className="text-lg font-black text-[#d4af37]">Next Steps</h2>

            <ul className="mt-4 space-y-2 text-white/75">
              <li>✓ Create your first book project</li>
              <li>✓ Build your AI Book Blueprint</li>
              <li>✓ Write your chapters</li>
              <li>✓ Design your cover</li>
              <li>✓ Export your finished book</li>
              <li>✓ Publish to Amazon KDP</li>
            </ul>
          </div>

          <Link
            href="/dashboard"
            prefetch={true}
            className="mt-8 inline-flex rounded-2xl bg-black px-8 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5"
          >
            Go To Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}