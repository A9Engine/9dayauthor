"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { supabase } from "../../lib/supabase";
import HelpCoach from "./HelpCoach";

type StepItem = {
  step: number;
  label: string;
  href: string;
  requiresProject: boolean;
};

const steps: StepItem[] = [
  { step: 1, label: "New Book", href: "/new-book", requiresProject: false },
  { step: 2, label: "Blueprint", href: "/book-blueprint", requiresProject: true },
  { step: 3, label: "Chapters", href: "/chapters", requiresProject: true },
  { step: 4, label: "Edit Manuscript", href: "/manuscript-review", requiresProject: true },
  { step: 5, label: "Additional Pages", href: "/book-sections", requiresProject: true },
  { step: 6, label: "Formatting", href: "/formatting", requiresProject: true },
  { step: 7, label: "Finalize Manuscript", href: "/export-download", requiresProject: true },
  { step: 8, label: "Cover Creator", href: "/cover-creator", requiresProject: true },
  { step: 9, label: "Publish to Amazon", href: "/publish-amazon", requiresProject: true },
];

export default function AuthorLayout({
  children,
  currentStep,
  projectId,
}: {
  children: ReactNode;
  currentStep?: number;
  projectId?: string;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  function buildHref(href: string, requiresProject: boolean) {
    if (!requiresProject) return href;
    if (!projectId) return "#";
    return `${href}?id=${projectId}`;
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      setMobileMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  }

  function SignOutButton() {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="mx-auto mt-6 block rounded-full border border-white/20 bg-black px-6 py-2 text-sm font-bold text-white/75 transition hover:border-white/40 hover:text-white disabled:opacity-50"
      >
        {isSigningOut ? "Signing Out..." : "Sign Out"}
      </button>
    );
  }

  function WorkflowNav() {
    return (
      <nav className="space-y-2">
        <Link
          href="/my-books"
          prefetch={true}
          onClick={closeMobileMenu}
          className="block rounded-2xl px-4 py-3 text-sm font-black text-[#d4af37] underline decoration-[#d4af37]/60 underline-offset-4 transition hover:bg-white/10"
        >
          My Books
        </Link>

        <Link
          href="/dashboard"
          prefetch={true}
          onClick={closeMobileMenu}
          className="block rounded-2xl px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          Dashboard
        </Link>

        {steps.map((item) => {
          const isActive = currentStep === item.step;
          const isDisabled = item.requiresProject && !projectId;
          const href = buildHref(item.href, item.requiresProject);

          if (isDisabled) {
            return (
              <div
                key={item.label}
                title="Create or open a book project first."
                aria-disabled="true"
                style={{
                  color: "rgba(255,255,255,0.22)",
                  opacity: 0.45,
                  cursor: "not-allowed",
                }}
                className="block rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.16)" }} className="text-xs">
                    {item.step}
                  </span>
                </div>
              </div>
            );
          }

          const navClassName = `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
  isActive
    ? "bg-white/12 text-white"
    : "text-white/70 hover:bg-white/10 hover:text-white"
}`;

const navContent = (
  <div className="flex items-center justify-between">
    <span>{item.label}</span>
    <span className="text-xs text-white/35">{item.step}</span>
  </div>
);

if (item.href === "/cover-creator") {
  return (
    <a
      key={item.label}
      href={href}
      onClick={closeMobileMenu}
      className={navClassName}
    >
      {navContent}
    </a>
  );
}

return (
  <Link
    key={item.label}
    href={href}
    prefetch={false}
    onClick={closeMobileMenu}
    className={navClassName}
  >
    {navContent}
  </Link>
);
        })}
       <div className="mt-6 border-t border-white/10 pt-4">

  <Link
    href="/settings"
    prefetch={true}
    onClick={closeMobileMenu}
    className="ml-4 block rounded-2xl px-4 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
  >
    Settings
  </Link>

  <button
    type="button"
    onClick={() => {
      console.log("Help clicked");
      setHelpOpen(true);
    }}
    className="mt-1 ml-4 block w-full cursor-pointer rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
  >
    Help
  </button>

</div>
      </nav>
    );
  }

  function ProgressBox() {
    return (
      <div className="mt-8 rounded-3xl border border-[#d4af37]/25 bg-[#d4af37]/10 p-5">
        <div className="text-sm text-white/55">Current Progress</div>

        <div className="mt-2 text-3xl font-black text-[#d4af37]">
          {currentStep || 1}/9
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#d4af37]"
            style={{ width: `${((currentStep || 1) / 9) * 100}%` }}
          />
        </div>

        <p className="mt-5 text-sm leading-6 text-white/60">
          Build your manuscript step by step and move from idea to published author.
        </p>
      </div>
    );
  }

  function SidebarContent() {
    return (
      <>
        <Link href="/dashboard" prefetch={true} onClick={closeMobileMenu} className="mb-10 block">
          <img
            src="/9dayauthor-logo.png"
            alt="9 Day Author"
            className="h-14 w-auto"
          />

          <p className="mt-1 translate-x-5 text-sm text-white/55">
            From Idea to Amazon Author
          </p>
        </Link>

        <Link
          href="/new-book"
          prefetch={true}
          onClick={closeMobileMenu}
          className="mb-8 block rounded-2xl bg-[#d4af37] px-5 py-4 text-left font-black text-black transition hover:-translate-y-0.5 hover:bg-[#e6c24a]"
        >
          + New Book Project
        </Link>

        <WorkflowNav />

        {!projectId && currentStep !== 1 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-black text-white">
              No active book selected
            </div>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Open a saved project from the dashboard to unlock the book workflow.
            </p>
          </div>
        ) : null}

        <ProgressBox />
        <SignOutButton />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-black">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-[#050505] p-6 text-white lg:flex lg:flex-col">
          <SidebarContent />
        </aside>

        {mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-[9999999] bg-black/55 lg:hidden"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                setMobileMenuOpen(false);
              }
            }}
          >
            <aside
              onPointerDown={(event) => event.stopPropagation()}
              className="absolute left-0 top-0 z-[10000000] flex h-[100dvh] w-[86vw] max-w-[360px] flex-col bg-[#050505] text-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#050505] p-5">
                <img
                  src="/9dayauthor-logo.png"
                  alt="9 Day Author"
                  className="h-12 w-auto"
                />

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <Link
                  href="/new-book"
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-6 block rounded-2xl bg-[#d4af37] px-5 py-4 text-left font-black text-black"
                >
                  + New Book Project
                </Link>

                <WorkflowNav />

                {!projectId && currentStep !== 1 ? (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-black text-white">
                      No active book selected
                    </div>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Open a saved project from the dashboard to unlock the book workflow.
                    </p>
                  </div>
                ) : null}

                <ProgressBox />
                <SignOutButton />
              </div>
            </aside>
          </div>
        ) : null}

        <section className={`min-w-0 flex-1 ${mobileMenuOpen ? "pointer-events-none" : ""}`}>
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505] px-5 py-4 shadow-lg shadow-black/20 lg:hidden">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="rounded-full bg-black px-4 py-3 text-sm font-black text-[#d4af37]"
                aria-label="Open menu"
              >
                ☰
              </button>

              <Link href="/dashboard" prefetch={true} className="block">
                <img
                  src="/9dayauthor-logo.png"
                  alt="9 Day Author"
                  className="h-11 w-auto"
                />

                <p className="mt-1 translate-x-4 text-xs text-white/55">
                  From Idea to Amazon Author
                </p>
              </Link>
            </div>
          </header>

          <div className="relative">
            {mobileMenuOpen ? (
              <button
                type="button"
                aria-label="Close menu"
                onPointerDown={closeMobileMenu}
                className="fixed inset-0 z-40 bg-transparent lg:hidden"
              />
            ) : null}

            <div className={mobileMenuOpen ? "hidden lg:block" : ""}>
              {children}
            </div>
          </div>
        </section>
<HelpCoach
  currentStep={currentStep}
  projectId={projectId}
  isOpen={helpOpen}
  onOpenChange={setHelpOpen}
/>
      </div>
    </main>
  );
}