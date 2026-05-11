export default function DashboardPage() {
  const chapters = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-black">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-[#050505] p-6 text-white lg:flex lg:flex-col">
          <a href="/" className="mb-10 block">
            <img src="/9dayauthor-logo.png" alt="9 Day Author" className="h-14 w-auto" />
            <p className="mt-2 translate-x-5 text-xs text-white/55">
              From idea to Amazon author
            </p>
          </a>

          <button className="mb-8 rounded-2xl bg-[#d4af37] px-5 py-4 text-left font-black text-black">
            + New Book Project
          </button>

          <nav className="space-y-2 text-sm font-semibold text-white/70">
            {["Dashboard", "My Books", "Outline", "Chapters", "Formatting", "Cover Creator", "Export & Download", "Publish to Amazon"].map((item, index) => (
              <div
                key={item}
                className={`rounded-2xl px-4 py-3 ${
                  index === 0 ? "bg-white/12 text-white" : "hover:bg-white/8 hover:text-white"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-[#d4af37]/25 bg-[#d4af37]/10 p-5">
            <div className="text-sm text-white/55">You’re on</div>
            <div className="mt-1 text-xl font-black text-[#d4af37]">Founder Access</div>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Unlimited books. One-time access. Build your author legacy.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505] px-5 py-4 shadow-lg shadow-black/20 sm:px-8 lg:hidden">
            <div className="flex items-center justify-between">
              <a href="/">
                <img src="/9dayauthor-logo.png" alt="9 Day Author" className="h-11 w-auto" />
              </a>
              <button className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-[#d4af37]">
                Menu
              </button>
            </div>
          </header>

          <div className="w-full px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
                Welcome back
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                The Freedom Blueprint
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-black/60">
                How to design a life of time, wealth, and purpose.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Target Length", "75,000 words"],
                  ["Current Progress", "38,540 words"],
                  ["Estimated Pages", "132 / 220"],
                  ["Completion", "58%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-black/10 bg-white p-5 shadow-lg shadow-black/5">
                    <div className="text-sm font-semibold text-black/45">{label}</div>
                    <div className="mt-2 text-2xl font-black">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_320px]">
              <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b38a2f]">
                      Your Book Journey
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-black">Keep Going.</h2>
                    <p className="mt-2 max-w-xl text-black/60">
                      You’re building something real. Watch your manuscript grow chapter by chapter.
                    </p>
                  </div>

                  <div className="w-fit rounded-full bg-[#f6f2e8] px-4 py-2 text-sm font-semibold text-[#7a5a16]">
                    Day 5 of 9
                  </div>
                </div>

                <div className="mt-8 overflow-x-auto">
                  <div className="flex w-max items-center gap-3">
                    {chapters.map((chapter, index) => {
                      const completed = index < 4;
                      const current = index === 4;

                      return (
                        <div key={chapter} className="flex items-center gap-3">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-black transition-all ${
                              completed
                                ? "border-green-200 bg-green-50 text-green-700"
                                : current
                                ? "border-[#d4af37] bg-[#fff8e6] text-[#7a5a16]"
                                : "border-black/10 bg-[#f8f8f8] text-black/30"
                            }`}
                          >
                            {completed ? "✓" : chapter}
                          </div>

                          {index !== 8 && (
                            <div className={`h-[2px] w-5 ${index < 4 ? "bg-green-300" : "bg-black/10"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_280px]">
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-[#e8dfcf] bg-[#fdfbf7] p-6 shadow-inner md:p-10">
                    <div className="grid gap-10 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7a5a16]">
                          Current Chapter
                        </p>
                        <h3 className="mt-4 text-4xl font-black leading-tight text-black">
                          Chapter 5
                        </h3>
                        <h4 className="mt-3 text-2xl font-bold text-black">
                          Building Momentum
                        </h4>
                        <p className="mt-5 text-lg leading-8 text-black/65">
                          This is the chapter where your story starts feeling real.
                          Your ideas are turning into a finished manuscript.
                        </p>

                        <div className="mt-8 space-y-3">
                          {["Clarify the turning point", "Add emotional detail", "Expand your main lesson", "Strengthen the chapter ending"].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-black/75">
                              <div className="h-2 w-2 rounded-full bg-[#d4af37]" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        <button className="mt-10 rounded-2xl bg-black px-7 py-4 text-sm font-bold text-white transition hover:opacity-90">
                          Continue Writing
                        </button>
                      </div>

                      <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">
                          Coming Up Next
                        </p>
                        <div className="mt-8">
                          <p className="text-lg font-semibold text-black/40">Chapter 6</p>
                          <h3 className="mt-2 text-3xl font-black leading-tight text-black/70">
                            The Breakthrough Moment
                          </h3>
                          <p className="mt-5 leading-7 text-black/45">
                            This next chapter will focus on the transformation,
                            realization, or breakthrough that changes everything.
                          </p>
                        </div>

                        <div className="mt-10 rounded-2xl border border-black/10 bg-[#faf7f1] p-5">
                          <p className="text-sm font-semibold text-black/55">AI Guidance</p>
                          <p className="mt-2 text-sm leading-6 text-black/55">
                            Based on your previous chapters, this transition keeps
                            your pacing strong and helps build emotional momentum.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b38a2f]">
                        Today’s Focus
                      </p>
                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-5xl font-black text-black">1,250</p>
                          <p className="mt-2 text-black/55">words written today</p>
                        </div>
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#d4af37] text-xl font-black text-[#7a5a16]">
                          62%
                        </div>
                      </div>

                      <button className="mt-6 w-full rounded-2xl bg-[#d4af37] px-5 py-4 font-bold text-black transition hover:opacity-90">
                        Add More Writing
                      </button>
                    </div>

                    <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b38a2f]">
                        Manuscript Progress
                      </p>
                      <div className="mt-6">
                        <div className="h-3 overflow-hidden rounded-full bg-black/5">
                          <div className="h-full w-[58%] rounded-full bg-[#d4af37]" />
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm text-black/55">
                          <span>38,540 words</span>
                          <span>58% complete</span>
                        </div>
                      </div>
                      <div className="mt-8 rounded-2xl bg-[#faf7f1] p-5">
                        <p className="text-sm leading-7 text-black/60">
                          “The hardest part is no longer starting. It’s realizing how close you are to finishing.”
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
                <div className="rounded-[2rem] bg-[#0a0a0a] p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#d4af37]">
                    Your Book
                  </p>

                  <div className="mt-6 flex justify-center">
                    <div className="w-[180px] rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-[#1c1c1c] to-black p-5 shadow-2xl">
                      <div className="flex h-[260px] flex-col justify-between rounded-[1rem] border border-[#d4af37]/30 bg-gradient-to-b from-[#1b1b1b] to-[#050505] p-5">
                        <p className="text-center text-2xl font-black leading-tight tracking-tight">
                          THE
                          <br />
                          FREEDOM
                          <br />
                          BLUEPRINT
                        </p>

                        <div>
                          <div className="mx-auto h-[1px] w-16 bg-[#d4af37]/40" />
                          <p className="mt-4 text-center text-sm tracking-[0.25em] text-[#d4af37]">
                            ALEX SMITH
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="mt-8 w-full rounded-2xl bg-[#d4af37] px-5 py-4 font-bold text-black transition hover:opacity-90">
                    View Book Preview
                  </button>
                </div>

                <div className="mt-6 rounded-[2rem] bg-[#faf7f1] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7a5a16]">
                    Estimated Final Length
                  </p>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-5xl font-black text-black">220</p>
                      <p className="mt-1 text-black/55">projected pages</p>
                    </div>

                    <div className="rounded-full bg-[#fff1c7] px-4 py-2 text-sm font-bold text-[#7a5a16]">
                      KDP Ready
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
                <h3 className="text-xl font-black">Recent Activity</h3>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Chapter 5 updated</span>
                    <span className="text-black/40">2 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Added 1,250 words</span>
                    <span className="text-black/40">3 hours ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outline revised</span>
                    <span className="text-black/40">Yesterday</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
                <h3 className="text-xl font-black">Quick Actions</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-4">
                  {[
                    ["Outline", "View and edit"],
                    ["Cover Creator", "Design cover"],
                    ["Export", "Download files"],
                    ["Publish", "Amazon guide"],
                  ].map(([title, text]) => (
                    <button key={title} className="rounded-2xl border border-black/10 bg-[#faf8f1] p-4 text-left">
                      <div className="font-black">{title}</div>
                      <div className="mt-1 text-sm text-black/45">{text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}