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
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden">

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <a href="/" className="flex flex-col items-start">
  <img
    src="/9dayauthor-logo.png"
    alt="9 Day Author"
    className="h-12 w-auto sm:h-14"
  />
  <span className="mt-1 translate-x-6 text-xs font-medium text-white/60">
    From idea to Amazon author
  </span>
</a>

          <nav className="hidden items-center gap-8 text-sm text-white/75 md:flex">
            <a href="#how">How It Works</a>
            <a href="#features">Features</a>
            <a href="#why">Why Us</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <a
            href="#pricing"
            className="rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-bold text-black shadow-lg shadow-[#d4af37]/20"
          >
            Get Started
          </a>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:pb-28">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-[#d4af37]/30 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f5d76e]">
              The guided author system
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
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
                href="#pricing"
                className="rounded-2xl bg-[#d4af37] px-7 py-4 text-center text-base font-black text-black shadow-2xl shadow-[#d4af37]/25"
              >
                Start Your Book Now →
              </a>
              <div className="text-sm text-white/60">
                No monthly subscription. One-time founder access.
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-[#191919] to-[#050505] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                      Live Book Preview
                    </div>
                    <div className="mt-1 text-2xl font-black">
                      Your Book Title
                    </div>
                  </div>
                  <div className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-black">
                    Day 4
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.75fr_1fr]">
                  <div className="rounded-xl border border-[#d4af37]/30 bg-[linear-gradient(135deg,#111,#2b2108)] p-4 shadow-xl">
                    <div className="mb-16 text-center text-2xl font-black uppercase leading-tight tracking-wide">
                      Your
                      <br />
                      Book
                      <br />
                      Title
                    </div>
                    <div className="h-24 rounded-lg bg-gradient-to-t from-[#d4af37]/30 to-transparent" />
                    <div className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-white/70">
                      Your Name
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="text-sm text-white/55">Progress</div>
                      <div className="mt-1 text-3xl font-black">58%</div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-[58%] rounded-full bg-[#d4af37]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/10 p-4">
                        <div className="text-xs text-white/55">Words</div>
                        <div className="mt-1 font-black">38,540</div>
                      </div>
                      <div className="rounded-xl bg-white/10 p-4">
                        <div className="text-xs text-white/55">Pages</div>
                        <div className="mt-1 font-black">132 / 220</div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="text-xs text-white/55">Next Step</div>
                      <div className="mt-1 font-bold">
                        Expand Chapter 7 to stay on pace.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ed] px-5 py-14 text-black sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="-mt-24 mb-16 grid gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-2xl shadow-black/10 md:grid-cols-4">
            {[
              ["🚀", "Go from idea to author in 9 days"],
              ["⏱️", "Save hours of formatting frustration"],
              ["📘", "Paperback, hardcover, and Kindle-ready"],
              ["🏆", "Create unlimited books for one price"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-4 p-3">
                <div className="text-3xl">{icon}</div>
                <div className="font-bold leading-snug">{text}</div>
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

          <div className="mt-12 grid gap-8 rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <div>
              <h3 className="text-3xl font-black sm:text-4xl">
                That’s Exactly Why We Built This.
              </h3>
              <p className="mt-4 text-lg leading-8 text-black/65">
                9 Day Author is not just an AI writing box. It is a guided
                publishing system that helps you create, format, design, and
                prepare your book for Amazon.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  "Know your estimated page count while you write",
                  "Fix thin chapters before the end",
                  "Create covers with real professional typography",
                  "Generate Kindle-ready structure and TOC",
                  "Follow a clear publishing path step by step",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <span className="font-black text-[#d4af37]">✓</span>
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-[#faf8f1] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-black/50">
                    Your Book Journey
                  </div>
                  <div className="text-2xl font-black">Chapter Progress</div>
                </div>
                <div className="rounded-full bg-[#111] px-4 py-2 text-sm font-bold text-white">
                  58%
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
                      i < 5
                        ? "border-green-300 bg-green-50 text-green-700"
                        : i === 5
                          ? "border-[#d4af37] bg-[#fff4c4] text-black"
                          : "border-black/10 bg-white text-black/35"
                    }`}
                  >
                    {i < 5 ? "✓" : i + 1}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl bg-white p-6 shadow-lg">
                <div className="text-center text-sm font-bold text-[#d4af37]">
                  Chapter 6
                </div>
                <h4 className="mt-2 text-center text-2xl font-black">
                  Building the Turning Point
                </h4>
                <p className="mx-auto mt-4 max-w-md text-center leading-7 text-black/60">
                  You are in the sweet spot. Add one personal story and one
                  practical lesson to keep this chapter on pace.
                </p>
                <div className="mt-5 h-2 rounded-full bg-black/10">
                  <div className="h-2 w-[64%] rounded-full bg-[#d4af37]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="bg-white px-5 py-20 text-black sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              The 9 Day Author Path
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-black/60">
              One guided step each day. No guessing. No scattered tools. No
              publishing overwhelm.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-black/10 bg-[#faf8f1] p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-black text-[#d4af37]">
                  {index + 1}
                </div>
                <h3 className="text-xl font-black">{step}</h3>
                <p className="mt-3 leading-7 text-black/60">
                  Complete the next focused step and watch your book move closer
                  to Amazon-ready.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="bg-[#050505] px-5 py-20 text-white sm:px-8"
      >
        <div className="mx-auto max-w-7xl">
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
              ["Unlimited Books", "Pay once and create as many books as you want."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-white/8 p-6"
              >
                <h3 className="text-xl font-black text-[#d4af37]">{title}</h3>
                <p className="mt-3 leading-7 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f7f4ed] px-5 py-20 text-black sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Founder Access
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-black/60">
            One-time access to the complete 9 Day Author system. No monthly
            subscription. No complicated pricing.
          </p>

          <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-black/10 bg-white p-8 shadow-2xl shadow-black/10">
            <div className="text-sm font-black uppercase tracking-[0.2em] text-[#b38b16]">
              One-time payment
            </div>
            <div className="mt-4 text-6xl font-black">$49</div>
            <div className="mt-2 text-black/55">Founder access price</div>

            <div className="mt-8 space-y-3 text-left">
              {[
                "Unlimited books",
                "Paperback, hardcover, and Kindle-ready workflow",
                "Guided 9-day author path",
                "Cover creation system",
                "Formatting and export guidance",
                "Amazon KDP publishing checklist",
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="font-black text-[#d4af37]">✓</span>
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <button className="mt-8 w-full rounded-2xl bg-black px-7 py-4 text-lg font-black text-[#d4af37]">
              Start Your Book Tonight
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}