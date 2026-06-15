"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import DeleteBookButton from "../components/DeleteBookButton";

type BookProject = {
  id: string;
  created_at: string;
  title: string;
  author_name: string | null;
  book_type: string | null;
  target_length: string | null;
  book_description: string | null;
  blueprint_output: any;
  status: string | null;
  user_id: string | null;
};

type Chapter = {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  word_count: number | null;
  updated_at: string | null;
};

function getTargetPages(targetLength?: string | null) {
  const match = String(targetLength || "").match(/\d+/);
  return match ? Number(match[0]) : 150;
}

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();

  const [books, setBooks] = useState<BookProject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: booksData, error: booksError } = await supabase
        .from("book_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (booksError) {
        console.error(booksError);
        setIsLoading(false);
        return;
      }

      const userBooks = booksData || [];
      setBooks(userBooks);

      const projectIds = userBooks.map((book) => book.id);

      if (!projectIds.length) {
        setChapters([]);
        setIsLoading(false);
        return;
      }

      const { data: chaptersData, error: chaptersError } = await supabase
        .from("book_chapters")
        .select("*")
        .in("project_id", projectIds)
        .order("chapter_number", { ascending: true });

      if (chaptersError) {
        console.error(chaptersError);
      }

      setChapters(chaptersData || []);
      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  const enrichedBooks = books.map((book) => {
    const bookChapters = chapters.filter(
      (chapter) => chapter.project_id === book.id
    );

    function countWords(text?: string | null) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0;
}

const totalWords = bookChapters.reduce(
  (sum, chapter) => sum + countWords(chapter.content),
  0
);

    const estimatedPages = Number((totalWords / 275).toFixed(1));
    const targetPages = getTargetPages(book.target_length);
    const progress = Math.min(
      100,
      Math.round((estimatedPages / targetPages) * 100)
    );

    const completedChapters = bookChapters.filter((chapter) => {
      const words = countWords(chapter.content);

      return words / 275 >= targetPages / Math.max(bookChapters.length, 1);
    }).length;

    const latestChapter =
      [...bookChapters].sort((a, b) => {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bDate - aDate;
      })[0] || bookChapters[0];

    return {
      ...book,
      chapters: bookChapters,
      totalWords,
      estimatedPages,
      targetPages,
      progress,
      completedChapters,
      latestChapter,
    };
  });

  const totalBooks = enrichedBooks.length;
  const totalWords = enrichedBooks.reduce((sum, book) => sum + book.totalWords, 0);
  const totalPages = Math.round(totalWords / 275);
  const averageProgress = totalBooks
    ? Math.round(
        enrichedBooks.reduce((sum, book) => sum + book.progress, 0) / totalBooks
      )
    : 0;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10 text-black">
        <h1 className="text-3xl font-black">Loading dashboard...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-black">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-[#050505] p-6 text-white lg:flex lg:flex-col">
          <a href="/dashboard" className="mb-10 block">
            <img src="/9dayauthor-logo.png" alt="9 Day Author" className="h-14 w-auto" />
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
            <a href="/dashboard" className="block rounded-2xl bg-white/12 px-4 py-3 text-white">
              Dashboard
            </a>

            <a
              href="/my-books"
              className="block rounded-2xl px-4 py-3 text-[#d4af37] underline underline-offset-4 hover:bg-white/10"
            >
              My Books
            </a>

            <a href="/new-book" className="block rounded-2xl px-4 py-3 hover:bg-white/10">
              New Book
            </a>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505] px-5 py-4 shadow-lg shadow-black/20 sm:px-8 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <a href="/dashboard">
                <img src="/9dayauthor-logo.png" alt="9 Day Author" className="h-11 w-auto" />
              </a>

              <div className="flex items-center gap-2">
                <a
                  href="/my-books"
                  className="rounded-xl border border-[#d4af37]/40 bg-black px-4 py-2 text-sm font-black text-[#d4af37]"
                >
                  My Books
                </a>

                <a
                  href="/new-book"
                  className="rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-bold text-black"
                >
                  + New Book
                </a>
              </div>
            </div>
          </header>

          <div className="w-full px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
              Welcome back
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Author Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-8 text-black/60">
              Manage your books, continue writing, review blueprints, and track your manuscript progress.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Books Created", String(totalBooks)],
                ["Total Words", totalWords.toLocaleString()],
                ["Estimated Pages", String(totalPages)],
                ["Complete", `${averageProgress}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-black/10 bg-white p-5 shadow-lg shadow-black/5">
                  <div className="text-sm font-semibold text-black/45">{label}</div>
                  <div className="mt-2 text-2xl font-black">{value}</div>
                </div>
              ))}
            </div>

            <section className="mt-10 rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b38a2f]">
                    My Books
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-black">
                    Continue Building Your Library
                  </h2>

                  <p className="mt-2 max-w-xl text-black/60">
                    Open any saved project and continue from the exact stage you left off.
                  </p>
                </div>

                <a href="/new-book" className="w-fit rounded-2xl bg-black px-5 py-4 text-sm font-black text-[#d4af37]">
                  + Start New Book
                </a>
              </div>

              {!enrichedBooks.length ? (
                <div className="mt-8 rounded-[2rem] border border-dashed border-black/15 bg-[#faf8f1] p-8 text-center">
                  <h3 className="text-2xl font-black">No books yet</h3>
                  <p className="mx-auto mt-3 max-w-xl text-black/60">
                    Start your first book project and generate your author blueprint.
                  </p>
                  <a href="/new-book" className="mt-6 inline-block rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-black">
                    Create My First Book
                  </a>
                </div>
              ) : (
                <div className="mt-8 grid gap-5 xl:grid-cols-2">
                  {enrichedBooks.map((book) => (
                    <div key={book.id} className="rounded-[2rem] border border-black/10 bg-[#faf8f1] p-5 shadow-lg shadow-black/5">
                      <h3 className="text-2xl font-black leading-tight">{book.title}</h3>

                      <p className="mt-2 text-sm text-black/45">
                        By {book.author_name || "Unknown Author"}
                      </p>

                      <p className="mt-5 line-clamp-3 leading-7 text-black/60">
                        {book.blueprint_output?.summary ||
                          book.book_description ||
                          "No description yet."}
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-4">
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                            Words
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {book.totalWords.toLocaleString()}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                            Pages Written
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {book.estimatedPages} / {book.targetPages}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                            Chapters Completed
                          </div>
                          <div className="mt-1 text-xl font-black">
                            {book.completedChapters} / {book.chapters.length}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full rounded-full bg-[#d4af37]"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>

                      <div className="mt-3 flex justify-between gap-3 text-sm text-black/45">
                        <span>{book.progress}% complete</span>
                        <span>
                          Last worked on{" "}
                          {formatDate(book.latestChapter?.updated_at || book.created_at)}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <a
                          href={`/chapters?id=${book.id}`}
                          className="rounded-2xl bg-black px-5 py-4 text-center text-sm font-black text-[#d4af37]"
                        >
                          Continue Writing
                        </a>

                        <a
                          href={`/book-blueprint?id=${book.id}`}
                          className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-center text-sm font-black"
                        >
                          View Blueprint
                        </a>
                      </div>

                      <div className="mt-4">
                        <DeleteBookButton projectId={book.id} bookTitle={book.title} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}