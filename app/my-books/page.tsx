"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type BookProject = {
  id: string;
  title: string;
  author_name: string | null;
  book_type: string | null;
  book_description: string | null;
  status: string | null;
  kindle_cover_url: string | null;
  blueprint_output: {
    summary?: string;
  } | null;
  created_at: string;
};

export default function MyBooksPage() {
  const router = useRouter();

  const [books, setBooks] = useState<BookProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    async function loadBooks() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("book_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);

      setBooks(data || []);
      setIsLoading(false);
    }

    loadBooks();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-black">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-[#050505] p-6 text-white lg:flex lg:flex-col">
          <a href="/dashboard" className="mb-10 block">
            <img
              src="/9dayauthor-logo.png"
              alt="9 Day Author"
              className="h-14 w-auto"
            />
            <p className="mt-1 translate-x-5 text-sm text-white/55">
              From Idea to Amazon Author
            </p>
          </a>

          <a
            href="/new-book"
            className="mb-8 block rounded-2xl bg-[#d4af37] px-5 py-4 text-left font-black text-black"
          >
            + New Book Project
          </a>

          <nav className="space-y-2 text-sm font-semibold text-white/70">
  <a
    href="/dashboard"
    className="block rounded-2xl px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white"
  >
    Dashboard
  </a>

  <a
    href="/my-books"
    className="block rounded-2xl bg-white/12 px-4 py-3 text-white"
  >
    My Books
  </a>

  <div className="my-4 border-t border-white/10 pt-4">
    <a
      href="/settings"
      className="block rounded-2xl px-4 py-3 text-white/60 hover:bg-white/10 hover:text-white"
    >
    - Settings
    </a>
  </div>
</nav>

          <div className="mt-auto pt-12">
  <button
    type="button"
    onClick={handleSignOut}
    disabled={isSigningOut}
    className="mx-auto block rounded-full border border-white/20 bg-black px-6 py-2 text-sm font-bold text-white/75 transition hover:border-white/40 hover:text-white disabled:opacity-50"
  >
    {isSigningOut ? "Signing Out..." : "Sign Out"}
  </button>
</div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505] px-5 py-4 shadow-lg shadow-black/20 lg:hidden">
  <div className="flex items-center gap-4">
    <button
      type="button"
      onClick={() => setMobileMenuOpen((current) => !current)}
      className="rounded-full bg-black px-4 py-3 text-sm font-black text-[#d4af37]"
      aria-label="Open menu"
    >
      ☰
    </button>

    <a href="/dashboard" className="block">
      <img
        src="/9dayauthor-logo.png"
        alt="9 Day Author"
        className="h-11 w-auto"
      />

      <p className="mt-1 translate-x-4 text-xs text-white/55">
        From Idea to Amazon Author
      </p>
    </a>
  </div>

  {mobileMenuOpen ? (
    <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4">
      <a
  href="/dashboard"
  className="block rounded-2xl px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"
>
  Dashboard
</a>

<a
  href="/new-book"
  className="block rounded-2xl px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"
>
  New Book
</a>

<div className="my-3 border-t border-white/10 pt-3">
  <a
    href="/settings"
    className="block rounded-2xl px-4 py-3 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white"
  >
   - Settings
  </a>
</div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="mx-auto mt-4 block rounded-full border border-white/20 bg-black px-6 py-2 text-sm font-bold text-white/75 transition hover:border-white/40 hover:text-white disabled:opacity-50"
      >
        {isSigningOut ? "Signing Out..." : "Sign Out"}
      </button>
    </div>
  ) : null}
</header>

          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
              Your Library
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              My Books
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">
              Open any book project, review its blueprint, or continue writing your
              chapters.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5"
                >
                  <div className="flex gap-5">
                    {book.kindle_cover_url ? (
                      <img
                        src={book.kindle_cover_url}
                        alt={`${book.title} cover`}
                        style={{
                          width: "110px",
                          minWidth: "110px",
                          height: "176px",
                          borderRadius: "14px",
                          objectFit: "cover",
                          border: "1px solid rgba(0,0,0,0.12)",
                          boxShadow: "0 18px 35px rgba(0,0,0,0.18)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "110px",
                          minWidth: "110px",
                          height: "176px",
                          borderRadius: "14px",
                          background:
                            "linear-gradient(135deg, #151326, #d4af37, #2f2416)",
                          border: "1px solid rgba(0,0,0,0.12)",
                          boxShadow: "0 18px 35px rgba(0,0,0,0.18)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px 10px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "white",
                            fontWeight: 900,
                            fontSize: "15px",
                            lineHeight: 1.1,
                          }}
                        >
                          {book.title}
                        </div>

                        <div
                          style={{
                            width: "64px",
                            height: "46px",
                            borderRadius: "10px",
                            background: "rgba(0,0,0,0.38)",
                          }}
                        />

                        <div
                          style={{
                            color: "white",
                            fontWeight: 900,
                            fontSize: "9px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          {book.author_name || "Author"}
                        </div>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-black leading-tight">
                        {book.title}
                      </h2>

                      <p className="mt-2 text-sm text-black/45">
                        By {book.author_name || "Unknown Author"}
                      </p>

                      <p className="mt-5 line-clamp-4 leading-7 text-black/60">
                        {book.blueprint_output?.summary ||
                          book.book_description ||
                          "No description yet."}
                      </p>

                      <div className="mt-6 grid gap-3">
                        <a
                          href={`/chapters?id=${book.id}`}
                          className="rounded-2xl bg-black px-5 py-3 text-center font-black text-[#d4af37] transition hover:-translate-y-0.5"
                        >
                          Open Book
                        </a>

                        <a
                          href={`/book-blueprint?id=${book.id}`}
                          className="rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-3 text-center font-black transition hover:-translate-y-0.5"
                        >
                          View Blueprint
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isLoading ? (
  <div className="mt-10 rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5">
    <h2 className="text-2xl font-black">Loading your books...</h2>

    <p className="mt-3 text-black/60">
      Checking your saved book projects.
    </p>
  </div>
) : !books.length ? (
  <div className="mt-10 rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5">
    <h2 className="text-2xl font-black">No books yet</h2>

    <p className="mt-3 text-black/60">
      Start your first book project and build your author blueprint.
    </p>

    <a
      href="/new-book"
      className="mt-6 inline-block rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-black"
    >
      Create My First Book
    </a>
  </div>
) : null}
          </div>
        </section>
      </div>
    </main>
  );
}