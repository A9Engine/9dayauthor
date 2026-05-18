export default function Home() {
  const painPoints = [
    {
      source: "KDP Author Forum",
      quote:
        "I uploaded my ebook again and the clickable table of contents still will not work.",
      highlight: "TOC still will not work",
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
    "Book idea",
    "Outline",
    "Chapters",
    "Formatting",
    "Cover",
    "Export",
    "Publish",
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#050505]">


        <header className="relative z-20 mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-8 px-5 py-6 sm:px-8">
          <a href="/" className="flex flex-col items-start">
           <img
            src="/9dayauthor-logo.svg"
            alt="9 Day Author"
            className="h-auto w-[190px]"
          />

            <span className="mt-1 translate-x-6 text-xs font-medium text-white/60">
              From idea to Amazon author
            </span>
          </a>

          <nav className="hidden items-center justify-center gap-8 text-sm text-white/75 md:flex">
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

          <div className="ml-auto flex items-center gap-4">
            <a
              href="/login"
              className="hidden rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/75 transition hover:text-white md:block"
            >
              Log In
            </a>

            <a
              href="/signup"
              className="rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-bold text-black shadow-lg shadow-[#d4af37]/20"
            >
              Get Started
            </a>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:pb-28">

          {/* LEFT */}
          <div>
            <div className="mb-6 inline-flex rounded-full border border-[#d4af37]/30 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f5d76e]">
              The guided author system
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              From Idea to{" "}
              <span className="text-[#d4af37]">
                Amazon Author
              </span>{" "}
              in 9 Days.
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
                "One-time $49 access for unlimited books",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-xs font-black text-black">
                    ✓
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="/signup"
                className="rounded-2xl bg-[#d4af37] px-7 py-4 text-center text-base font-black text-black shadow-2xl shadow-[#d4af37]/25 transition hover:scale-[1.03]"
              >
                Start Your Book Now →
              </a>

              <div className="text-sm text-white/60">
                No monthly subscription. One-time founder access.
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex items-center justify-center py-8 lg:py-12">
            <img
              src="/book-mockup-hero.png"
              alt="Hardcover, Kindle, and paperback book preview"
              className="w-full max-w-[620px] object-contain drop-shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
            />
          </div>
        </div>
      </section>

      {/* AI VOICE WRITING SECTION */}
      <section 
      id="features"
      className="relative overflow-hidden bg-[#050505] px-5 py-24 sm:px-8">

        {/* Purple Glow */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[140px]" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">

          {/* LEFT SIDE */}
          <div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
              🎙 AI Voice Writing
            </div>

            <h2 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Talk Naturally and{" "}
              <span className="text-[#d4af37]">
                Watch Your Book
              </span>{" "}
              Appear in Real Time
            </h2>

            <p className="mt-8 max-w-xl text-xl leading-9 text-white/70">
              Speak your ideas, stories, lessons, and experiences out loud.
              9 Day Author turns your voice into a structured,
              publish-ready book with live progress tracking and AI coaching.
            </p>

            <div className="mt-10 space-y-7">

              {[
                [
                  "🎤",
                  "Voice To Text",
                  "Speak naturally and see your words appear instantly.",
                ],
                [
                  "✨",
                  "AI Structures Your Ideas",
                  "Our AI organizes your content into chapters and sections.",
                ],
                [
                  "📘",
                  "Live Page Tracking",
                  "Watch your estimated page count grow while you write.",
                ],
                [
                  "🎯",
                  "Smart Chapter Coaching",
                  "Get feedback when a chapter needs more detail or expansion.",
                ],
                [
                  "☁️",
                  "Amazon Ready",
                  "Paperback, hardcover, and Kindle-ready exports included.",
                ],
              ].map(([icon, title, text]) => (
                <div key={title} className="flex gap-5">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-white/5 text-2xl">
                    {icon}
                  </div>

                  <div>
                    <div className="text-lg font-black text-white">
                      {title}
                    </div>

                    <div className="mt-1 text-white/60 leading-7">
                      {text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative">

            {/* Glow */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-purple-600/10 blur-[100px]" />

            <div className="relative rounded-[2.5rem] border border-purple-500/20 bg-[#0b0b14] p-6 shadow-[0_0_80px_rgba(124,58,237,0.15)]">

              {/* TOP BAR */}
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">

                <div className="flex items-center gap-3">
                  <img
                    src="/9dayauthor-logo.svg"
                    alt="9 Day Author"
                    className="h-auto w-[190px]"
                  />

                </div>

                <div className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">
                  ✓ Saved
                </div>
              </div>

              {/* MAIN GRID */}
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

                {/* MAIN WRITING AREA */}
                <div>

                  <div className="mb-5">
                    <div className="text-sm font-bold uppercase tracking-[0.18em] text-purple-300">
                      Chapter 7
                    </div>

                    <div className="mt-2 text-4xl font-black">
                      The Turning Point
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="grid gap-4 sm:grid-cols-4">

                    {[
                      ["WORDS", "2,847"],
                      ["EST. PAGES", "7.2"],
                      ["CHAPTER GOAL", "12"],
                      ["BOOK PROGRESS", "58%"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                      >
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                          {label}
                        </div>

                        <div className="mt-3 text-3xl font-black">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* LIVE TRANSCRIPT */}
                  <div className="mt-6 rounded-3xl border border-purple-500/20 bg-black/30 p-6">

                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-purple-500" />

                      <div className="font-bold text-purple-300">
                        Live Voice Input
                      </div>
                    </div>

                    {/* WAVE */}
                    <div className="mb-6 flex h-20 items-center gap-1 overflow-hidden">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-purple-500"
                          style={{
                            height: `${Math.max(
                              12,
                              Math.abs(Math.sin(i * 0.45)) * 70
                            )}px`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="space-y-5 text-xl leading-10 text-white/85">
                      <p>
                        That was the moment{" "}
                        <span className="rounded bg-purple-500/30 px-2 py-1 text-purple-200">
                          everything changed.
                        </span>
                      </p>

                      <p>
                        I realized I was not here just to survive...
                      </p>

                      <p>
                        I was here to build something that would outlive me.
                      </p>

                      <p>
                        That decision set me on a path that I never could have imagined...
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between">

                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-2xl">
                          ⏺
                        </div>

                        <div>
                          <div className="font-black">
                            00:01:37
                          </div>

                          <div className="text-white/45">
                            Recording...
                          </div>
                        </div>
                      </div>

                      <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10">
                        Finish Recording
                      </button>
                    </div>
                  </div>
                </div>

                {/* SIDEBAR */}
                <div className="space-y-5">

                  {/* BOOK */}
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center gap-5">

                      <img
                        src="/book-mockup-hero.png"
                        alt="Book"
                        className="w-24 object-contain"
                      />

                      <div>
                        <div className="text-2xl font-black">
                          Your Book
                        </div>

                        <div className="mt-2 text-white/55">
                          Est. 320 Pages
                        </div>

                        <div className="text-white/55">
                          Non Fiction
                        </div>

                        <button className="mt-5 rounded-xl border border-white/10 bg-black px-4 py-2 text-sm font-bold transition hover:bg-white/10">
                          View Book
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CHAPTER OUTLINE */}
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">

                    <div className="mb-5 text-2xl font-black">
                      Chapter Outline
                    </div>

                    <div className="space-y-3">

                      {[
                        ["1", "The Beginning", "8.4"],
                        ["2", "The Foundation", "11.2"],
                        ["3", "The Challenge", "10.5"],
                        ["4", "The Decision", "9.1"],
                        ["5", "The Journey", "12.3"],
                        ["6", "The Breakthrough", "10.8"],
                        ["7", "The Turning Point", "7.2 / 12"],
                      ].map(([num, title, pages]) => (
                        <div
                          key={title}
                          className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                            num === "7"
                              ? "bg-purple-500/20 border border-purple-500/30"
                              : "bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                                num === "7"
                                  ? "bg-purple-500 text-white"
                                  : "bg-green-500 text-black"
                              }`}
                            >
                              {num}
                            </div>

                            <div className="font-semibold">
                              {title}
                            </div>
                          </div>

                          <div className="text-sm text-white/50">
                            {pages} pages
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM STRIP */}
              <div className="mt-8 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-4">

                {[
                  ["⚡", "10X Faster", "Create in minutes what used to take hours."],
                  ["🧠", "AI Powered", "Advanced AI understands context and meaning."],
                  ["🔒", "Private & Secure", "Your ideas are encrypted and always yours."],
                  ["🏆", "Publish With Confidence", "From first draft to Amazon ready in 9 days."],
                ].map(([icon, title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="text-3xl">
                      {icon}
                    </div>

                    <div className="mt-4 text-lg font-black">
                      {title}
                    </div>

                    <div className="mt-2 leading-7 text-white/55">
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="bg-[#f7f4ed] px-5 py-14 text-black sm:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-16 grid gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-2xl shadow-black/10 md:grid-cols-4">
            {[
              ["🚀", "Go from idea to author in 9 days"],
              ["⏱️", "Save hours of formatting frustration"],
              ["📘", "Paperback, hardcover, and Kindle-ready"],
              ["🏆", "Create unlimited books for one price"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-4 p-3">
                <div className="text-3xl">{icon}</div>

                <div className="font-bold leading-snug">
                  {text}
                </div>
              </div>
            ))}
          </div>

          <div id="why" className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              What Authors Are{" "}
              <span className="text-[#b91c1c] underline decoration-[#d4af37] decoration-4 underline-offset-4">
                Frustrated About
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-black/60">
              Real self-publishing pain points inspired the way 9 Day Author is
              built.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painPoints.map((item) => (
              <div
                key={item.quote}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl shadow-black/5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="text-sm font-bold text-black/70">
                    {item.source}
                  </div>

                  <div className="rounded-full bg-[#fff1b8] px-3 py-1 text-xs font-bold">
                    Public complaint
                  </div>
                </div>

                <p className="text-lg font-semibold leading-8">
                  “{item.quote.replace(item.highlight, "")}
                  <mark className="rounded bg-[#ffe680] px-1">
                    {item.highlight}
                  </mark>
                  ”
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
  id="pricing"
  className="bg-[#f7f4ed] px-5 py-20 text-black sm:px-8"
>
  <div className="mx-auto max-w-4xl text-center">
    <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
      Founder Access
    </h2>

    <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-black/60">
      One-time access to the complete 9 Day Author system.
      No monthly subscription. No complicated pricing.
    </p>

    <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-black/10 bg-white p-8 shadow-2xl shadow-black/10">
      <div className="text-sm font-black uppercase tracking-[0.2em] text-[#b38b16]">
        One-time payment
      </div>

      <div className="mt-4 text-6xl font-black">$49</div>

      <div className="mt-2 text-black/55">
        Founder access price
      </div>

      <div className="mt-8 space-y-3 text-left">
        {[
          "Unlimited books",
          "Paperback, hardcover, and Kindle-ready workflow",
          "Guided 9-day author path",
          "Voice-to-book writing system",
          "Formatting and export guidance",
          "Amazon KDP publishing checklist",
        ].map((item) => (
          <div key={item} className="flex gap-3">
            <span className="font-black text-[#d4af37]">✓</span>
            <span className="font-semibold">{item}</span>
          </div>
        ))}
      </div>

     <a
      href="/signup"
      className="mt-8 block w-full rounded-2xl bg-black px-7 py-4 text-center text-lg font-black text-[#d4af37] transition hover:scale-[1.02]"
    >
      Start Your Book Tonight
    </a>
    </div>
  </div>
</section>
    </main>
  );
}