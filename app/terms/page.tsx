export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-12 text-black sm:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-xl shadow-black/5">
        <a href="/" className="text-sm font-bold text-[#b38b16]">
          ← Back to 9 Day Author
        </a>

        <h1 className="mt-6 text-4xl font-black">Terms of Service</h1>
        <p className="mt-3 text-sm text-black/50">Last updated: June 24, 2026</p>

        <div className="mt-8 space-y-6 leading-8 text-black/70">
          <p>
            Welcome to 9 Day Author. By using this website and platform, you agree
            to these Terms of Service.
          </p>

          <h2 className="text-2xl font-black text-black">1. Use of the Platform</h2>
          <p>
            9 Day Author helps users plan, write, format, and prepare book projects
            for publishing. You are responsible for reviewing, editing, and verifying
            all content before publishing or distributing it.
          </p>

          <h2 className="text-2xl font-black text-black">2. User Content</h2>
          <p>
            You retain ownership of the book ideas, manuscripts, prompts, and other
            content you create or upload. You are responsible for ensuring your
            content does not violate copyright, trademark, privacy, or other laws.
          </p>

          <h2 className="text-2xl font-black text-black">3. AI-Generated Content</h2>
          <p>
            The platform may use AI to assist with writing, brainstorming,
            formatting, and guidance. AI-generated content may contain errors and
            should be reviewed carefully before use.
          </p>

          <h2 className="text-2xl font-black text-black">4. Payments and Subscriptions</h2>
          <p>
            Paid access is billed annually unless otherwise stated. Subscription
            management, payment processing, cancellations, and invoices may be
            handled through Stripe.
          </p>

          <h2 className="text-2xl font-black text-black">5. Refunds</h2>
          <p>
            Refund requests may be reviewed on a case-by-case basis. 9 Day Author
            reserves the right to approve or deny refund requests at its discretion.
          </p>

          <h2 className="text-2xl font-black text-black">6. No Publishing Guarantee</h2>
          <p>
            9 Day Author provides tools and guidance, but does not guarantee Amazon
            KDP approval, book sales, rankings, reviews, income, or publishing
            outcomes.
          </p>

          <h2 className="text-2xl font-black text-black">7. Account Termination</h2>
          <p>
            We may suspend or terminate accounts that misuse the platform, violate
            these terms, or attempt to disrupt the service.
          </p>

          <h2 className="text-2xl font-black text-black">8. Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a className="font-bold text-[#b38b16]" href="mailto:support@9dayauthor.com">
              support@9dayauthor.com
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}