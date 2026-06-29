export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-12 text-black sm:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-xl shadow-black/5">
        <a href="/" className="text-sm font-bold text-[#b38b16]">
          ← Back to 9 Day Author
        </a>

        <h1 className="mt-6 text-4xl font-black">Privacy Policy</h1>
        <p className="mt-3 text-sm text-black/50">Last updated: June 24, 2026</p>

        <div className="mt-8 space-y-6 leading-8 text-black/70">
          <p>
            This Privacy Policy explains how 9 Day Author collects, uses, and
            protects information when you use our website and platform.
          </p>

          <h2 className="text-2xl font-black text-black">1. Information We Collect</h2>
          <p>
            We may collect account information such as your name, email address,
            payment status, book project details, prompts, manuscripts, uploaded
            files, and usage information related to the platform.
          </p>

          <h2 className="text-2xl font-black text-black">2. How We Use Information</h2>
          <p>
            We use your information to provide the platform, save your projects,
            process payments, improve the service, communicate with you, and support
            your account.
          </p>

          <h2 className="text-2xl font-black text-black">3. Payment Processing</h2>
          <p>
            Payments are processed through Stripe. We do not store full credit card
            numbers on our servers.
          </p>

          <h2 className="text-2xl font-black text-black">4. AI Processing</h2>
          <p>
            Some features may send your prompts, project details, or writing inputs
            to AI service providers in order to generate outlines, drafts, feedback,
            or publishing guidance.
          </p>

          <h2 className="text-2xl font-black text-black">5. Data Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect user
            information, but no online service can guarantee absolute security.
          </p>

          <h2 className="text-2xl font-black text-black">6. Your Content</h2>
          <p>
            You retain ownership of the book projects, manuscripts, and content you
            create using 9 Day Author.
          </p>

          <h2 className="text-2xl font-black text-black">7. Contact</h2>
          <p>
            Privacy questions can be sent to{" "}
            <a className="font-bold text-[#b38b16]" href="mailto:support@9dayauthor.com">
              support@9dayauthor.com
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}