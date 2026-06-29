"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const painPoints = [
    {
      source: "KDP Author Forum",
      quote:
        "I uploaded my ebook again and the clickable table of contents still will not work.",
      highlight: "clickable table of contents still will not work.",
    },
    {
      source: "Self Publishing Group",
      quote:
        "I spent more time fixing formatting than actually writing my book.",
      highlight: "fixing formatting",
    },
    {
      source: "Indie Author Community",
      quote:
        "My hardcover cover wrap keeps getting rejected and I cannot figure out the sizing.",
      highlight: "cover wrap keeps getting rejected",
    },
  ];

  const steps = [
  {
    title: "New Book Setup",
    description: "Define your book title, audience, tone, and publishing goals."
  },
  {
    title: "AI Book Blueprint",
    description: "Generate multiple book directions and choose the strongest concept."
  },
  {
    title: "Chapters",
    description: "Build your manuscript chapter by chapter with AI assistance."
  },
  {
    title: "Edit & Manuscript Review",
    description: "Review content, strengthen weak sections, and refine your writing."
  },
  {
    title: "Additional Pages",
    description: "Create your dedication, acknowledgments, about the author page, and more."
  },
  {
    title: "Formatting",
    description: "Transform your manuscript into a professionally formatted book."
  },
  {
    title: "Cover Creator",
    description: "Design your paperback, hardcover, and ebook covers."
  },
  {
    title: "Export & Download",
    description: "Generate print-ready and Kindle-ready files for publishing."
  },
  {
    title: "Publish to Amazon",
    description: "Follow the guided KDP publishing process and launch your book."
  },
];


  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#050505] text-white">
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-[#050505]">
        <header className="relative z-30 mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <a href="/" className="flex flex-col items-center text-center">
              <img
                src="/9dayauthor-logo.svg"
                alt="9 Day Author"
                className="h-auto w-[185px] max-w-full object-contain sm:w-[190px]"
              />
              <span className="mt-1 text-center text-xs font-medium text-white/60 lg:text-center">
                From Idea to Amazon Author
              </span>
            </a>

            <nav className="hidden items-center justify-center gap-8 text-sm font-bold text-white/70 lg:flex">
              <a href="#how" className="transition hover:text-white">
                How It Works
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#why" className="transition hover:text-white">
                Why Us
              </a>
              <a href="#pricing" className="transition hover:text-white">
                Pricing
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="hidden rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/75 transition hover:text-white lg:block"
              >
                Log In
              </a>

              <a
                href="/signup"
                className="hidden rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-bold text-black shadow-lg shadow-[#d4af37]/20 sm:block"
              >
                Get Started
              </a>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
                aria-label="Open menu"
              >
                <div className="space-y-1.5">
                  <div className="h-[2px] w-6 rounded-full bg-white" />
                  <div className="h-[2px] w-6 rounded-full bg-white" />
                  <div className="h-[2px] w-6 rounded-full bg-white" />
                </div>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0d0d0d]/95 p-5 backdrop-blur-xl lg:hidden">
              <nav className="flex flex-col gap-4 text-base font-semibold text-white/85">
                <a onClick={() => setMobileMenuOpen(false)} href="#how">
                  How It Works
                </a>
                <a onClick={() => setMobileMenuOpen(false)} href="#features">
                  Features
                </a>
                <a onClick={() => setMobileMenuOpen(false)} href="#why">
                  Why Us
                </a>
                <a onClick={() => setMobileMenuOpen(false)} href="#pricing">
                  Pricing
                </a>
              </nav>

              <a
                href="/signup"
                className="mt-5 flex items-center justify-center rounded-xl bg-[#d4af37] px-5 py-4 text-sm font-bold text-black"
              >
                Start Your Book
              </a>
            </div>
          )}
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 pb-14 pt-0 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-12 lg:pb-28 lg:pt-10">
          {/* IMAGE FIRST ON MOBILE */}
          <div className="relative order-first -mt-4 flex min-w-0 items-center justify-center pb-0 pt-0 lg:order-none lg:mt-0 lg:py-12">
            <img
              src="/book-mockup-hero.png"
              alt="Hardcover, Kindle, and paperback book preview"
              loading="eager"
              decoding="async"
              className="w-full max-w-[390px] object-contain drop-shadow-[0_25px_80px_rgba(0,0,0,0.65)] sm:max-w-[560px]"
            />
          </div>

          {/* TEXT */}
          <div className="min-w-0">
            <div className="mb-5 inline-flex max-w-full rounded-full border border-[#d4af37]/30 bg-white/8 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f5d76e] sm:text-xs">
              #1 Book Creation Platform
            </div>

            <h1 className="max-w-3xl text-[44px] font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              From Idea to{" "}
              <span className="text-[#d4af37]">Amazon Author</span> in 9 Days.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
              Turn your story, knowledge, or life experience into a
              professionally formatted paperback, hardcover, and Kindle-ready
              book without the formatting headaches.
            </p>

            <div className="mt-8 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
              {[
                "Write in a voice that sounds like you",
                "Track real book progress as you write",
                "Create professional covers with real typography",
                "Export paperback, hardcover, and ebook files",
                "Get guided Amazon KDP publishing steps",
                "Unlimited books with one annual membership",
              ].map((item) => (
                <div key={item} className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-xs font-black text-black">
                    ✓
                  </span>
                  <span className="min-w-0">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="/signup"
                className="rounded-2xl bg-[#d4af37] px-7 py-4 text-center text-base font-black text-black shadow-2xl shadow-[#d4af37]/25 transition hover:scale-[1.02]"
              >
                Start Your Book Now →
              </a>

              <div className="text-sm text-white/60">
                One membership. Unlimited books. Cancel anytime.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI VOICE WRITING */}
      <section
        id="features"
        className="relative w-full overflow-hidden bg-[#050505] px-5 py-16 text-white sm:px-8 lg:py-24"
      >
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[140px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="min-w-0">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200 sm:text-xs">
              🎙️ Voice To Text
            </div>

            <h2 className="max-w-3xl text-[40px] font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
              Talk Naturally and{" "}
              <span className="text-[#d4af37]">Watch Your Book</span> Appear in
              Real Time
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
              Speak your ideas, stories, lessons, and experiences out loud. 9
              Day Author turns your voice into a structured, publish-ready book
              with live progress tracking and AI coaching.
            </p>

            <div className="mt-8 space-y-5">
              {[
                ["🎤", "Voice To Text", "Speak naturally and see your words appear instantly."],
                ["✨", "AI Structures Your Ideas", "Our AI organizes your content into chapters and sections."],
                ["📘", "Live Page Tracking", "Watch your estimated page count grow while you write."],
                ["🎯", "Smart Chapter Coaching", "Get feedback when a chapter needs more detail or expansion."],
                ["☁️", "Amazon Ready", "Paperback, hardcover, and Kindle-ready exports included."],
              ].map(([icon, title, text]) => (
                <div key={title} className="flex min-w-0 gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-500/25 bg-white/5 text-2xl">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-1 leading-7 text-white/60">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-purple-500/25 bg-[#0b0812] p-5 shadow-2xl shadow-purple-950/40 sm:p-7 lg:p-8">
            <div className="mb-6 flex min-w-0 items-center justify-between gap-4 border-b border-white/10 pb-5">
              <img
                src="/9dayauthor-logo.svg"
                alt="9 Day Author"
                className="h-auto w-[170px] max-w-full object-contain"
              />
              <div className="shrink-0 rounded-full border border-green-400/30 bg-green-500/15 px-4 py-2 text-sm font-bold text-green-300">
                ✓ Saved
              </div>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-4">
              {[
                ["Words", "2,847"],
                ["Est. Pages", "7.2"],
                ["Chapter Goal", "12"],
                ["Book Progress", "58%"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                    {label}
                  </div>
                  <div className="mt-3 text-3xl font-black">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 w-full overflow-hidden rounded-3xl border border-purple-500/20 bg-black/25 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-200">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                Live Voice Input
              </div>

              <div className="mt-6 flex h-20 w-full items-center gap-1 overflow-hidden">
                {Array.from({ length: 38 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 shrink-0 rounded-full bg-purple-400"
                    style={{
                      height: `${20 + ((i * 17) % 50)}px`,
                    }}
                  />
                ))}
              </div>

              <div className="mt-6 space-y-4 text-xl leading-9 text-white/85 sm:text-2xl">
                <p>
                  That was the moment{" "}
                  <span className="rounded bg-purple-700/70 px-2">
                    everything
                  </span>{" "}
                  changed.
                </p>
                <p>I realized I was not here just to survive...</p>
                <p>I was here to build something that would outlive me.</p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/15 text-xl">
                    ⏺️
                  </div>
                  <div>
                    <div className="text-lg font-black">00:01:37</div>
                    <div className="text-white/45">Recording...</div>
                  </div>
                </div>

                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold">
                  Finish Recording
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-3xl">⚡</div>
                <div className="mt-3 text-xl font-black">10X Faster</div>
                <p className="mt-2 text-white/55">
                  Create in minutes what used to take hours.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-3xl">🔒</div>
                <div className="mt-3 text-xl font-black">Private & Secure</div>
                <p className="mt-2 text-white/55">
                  Your ideas are encrypted and always yours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP + PAIN POINTS */}
      <section id="why" className="w-full overflow-hidden bg-[#f7f4ed] px-5 py-14 text-black sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 grid gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-2xl shadow-black/10 md:grid-cols-4">
            {[
              ["🚀", "Go from idea to author in 9 days"],
              ["⏱️", "Save hours of formatting frustration"],
              ["📘", "Paperback, hardcover, and Kindle-ready"],
              ["🏆", "Create unlimited books with one annual membership"],
            ].map(([icon, text]) => (
              <div key={text} className="flex min-w-0 items-center gap-4 p-3">
                <div className="shrink-0 text-3xl">{icon}</div>
                <div className="min-w-0 font-bold leading-snug">{text}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              What Authors Are{" "}
              <span className="text-[#b91c1c] underline decoration-[#d4af37] decoration-4 underline-offset-4">
                Frustrated About
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-black/60">
              Real self-publishing pain points inspired the way 9 Day Author was
              built.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painPoints.map((item) => (
              <div
                key={item.quote}
                className="min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-xl shadow-black/5"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-bold text-black/70">
                    {item.source}
                  </div>
                  <div className="rounded-full bg-[#fff1b8] px-3 py-1 text-xs font-bold">
                    Public complaint
                  </div>
                </div>
                <p className="break-words text-xl font-semibold leading-8 sm:text-lg">
  “
                  {item.quote.split(item.highlight)[0]}
                  <mark className="rounded bg-[#ffe680] px-1">
                    {item.highlight}
                  </mark>
                  {item.quote.split(item.highlight)[1]}
                  ”
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
<section
  id="how"
  className="w-full overflow-hidden bg-white px-5 py-20 text-black sm:px-8"
>
  <div className="mx-auto w-full max-w-7xl">
   <div className="text-center">
  <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
    9 Guided Steps
  </h2>

  <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-black/60">
    Plan, write, format, export, and publish your book with one clear workflow.
  </p>
</div>

    <div className="mt-12 grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
       <div
  key={step.title}
  className="min-w-0 rounded-3xl border border-black/10 bg-[#faf8f1] p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
>
  <div className="space-y-2">
    <div className="shrink-0 text-sm font-black tracking-[0.16em] text-[#b38b16]">
  STEP {index + 1}
</div>

    <h3 className="text-lg font-black sm:text-xl">
      {step.title}
    </h3>
  </div>

  <p className="mt-4 leading-7 text-black/60">
    {step.description}
  </p>
</div>
      ))}
    </div>
  </div>
</section>

      {/* FEATURES */}
      <section className="w-full overflow-hidden bg-[#050505] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="text-center text-4xl font-black sm:text-5xl">
            Everything You Need.{" "}
            <span className="text-[#d4af37]">All in One System.</span>
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Writing System", "Brainstorm, outline, draft, and expand chapters in your own voice."],
              ["Page Tracking", "See estimated pages and identify thin chapters before it is too late."],
              ["Cover Creator", "Generate artwork or upload your own images with real font overlays."],
              ["Formatting Engine", "Create clean manuscript layouts for print and ebook publishing."],
              ["KDP Guidance", "Follow clear steps for Amazon publishing, ISBN choices, and exports."],
              ["Unlimited Books", "Create as many books as you want during your annual membership."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="min-w-0 rounded-3xl border border-white/10 bg-white/8 p-6"
              >
                <h3 className="text-xl font-black text-[#d4af37]">{title}</h3>
                <p className="mt-3 leading-7 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
<section
  id="pricing"
  className="w-full overflow-hidden bg-[#f7f4ed] px-5 py-20 text-black sm:px-8"
>
  <div className="mx-auto w-full max-w-4xl text-center">
    <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
      Start Your Book Today
    </h2>


    <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-black/60">
  Everything you need to go from idea to published book inside one guided
  system. Unlimited books. One simple annual membership.
</p>

<div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-[2rem] border border-black/10 bg-white p-8 shadow-2xl shadow-black/10">
  <div className="text-sm font-black uppercase tracking-[0.2em] text-[#b38b16]">
    Founding Author Pricing
  </div>

  <div className="mt-3 text-sm font-bold text-red-600">
    Limited to the first 50 Founding Authors
  </div>

  <div className="mt-6">
    <div className="text-6xl font-black">
      $49
      <span className="ml-1 text-2xl font-medium text-black/50">
        /year
      </span>
    </div>

    <div className="mt-3 flex flex-col items-center">
  <div className="text-lg">
    <span className="text-black/45">
      Regular Price:
    </span>

    <span
  className="ml-2 text-black/40"
  style={{ textDecoration: "line-through" }}
>
  $99/year
</span>
  </div>

  <div
  className="mt-2 font-bold"
  style={{ color: "#16a34a" }}
>
  Save 50%
</div>
</div>
  </div>

  <div className="mt-5 rounded-2xl border border-[#d4af37]/25 bg-[#fff8df] px-5 py-4 text-sm font-bold leading-6 text-black/70">
    Founding members are locked in at $49/year. After the first 50 members,
    pricing increases to $99/year.
  </div>

  <div className="mt-8 space-y-3 text-left">
    {[
      "Unlimited books",
      "Paperback, hardcover, and Kindle-ready workflow",
      "Voice-to-book writing system",
      "Guided 9-day author path",
      "Cover creation system",
      "Formatting and export guidance",
      "Amazon KDP publishing checklist",
    ].map((item) => (
      <div key={item} className="flex min-w-0 gap-3">
        <span className="shrink-0 font-black text-[#d4af37]">✓</span>
        <span className="min-w-0 font-semibold">{item}</span>
      </div>
    ))}
  </div>

  <a
    href="/signup"
    className="mt-8 block w-full rounded-2xl bg-black px-7 py-4 text-center text-lg font-black text-[#d4af37] transition hover:scale-[1.02]"
  >
    Claim Founding Author Access
  </a>

  <p className="mt-4 text-sm leading-6 text-black/45">
    One annual membership. Cancel anytime.
  </p>
</div>
  </div>
</section>
{/* FOOTER */}
<footer className="border-t border-white/10 bg-[#050505] px-5 py-10 text-center text-sm text-white/50 sm:px-8">
  <div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-center justify-center gap-6">
      <Link href="/terms" className="transition hover:text-white">
        Terms of Service
      </Link>

      <Link href="/privacy" className="transition hover:text-white">
        Privacy Policy
      </Link>
    </div>

    <p className="mt-4 max-w-2xl mx-auto text-white/40">
      Questions? Contact us at{" "}
      <a
        href="mailto:support@9dayauthor.com"
        className="font-semibold text-[#d4af37] hover:underline"
      >
        support@9dayauthor.com
      </a>
    </p>

    <p className="mt-4">
      © 2026 9 Day Author. All rights reserved.
    </p>
  </div>
</footer>
    </main>
  );
}