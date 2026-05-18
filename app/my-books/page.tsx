import { supabase } from "../../lib/supabase";

export default async function MyBooksPage() {
  const { data: books, error } = await supabase
    .from("book_projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10 text-black">
        <h1 className="text-3xl font-black">Could not load books</h1>
        <p className="mt-3 text-black/60">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-black">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="block">
            <img
              src="/9dayauthor-logo.png"
              alt="9 Day Author"
              className="h-10 w-auto"
            />
            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
              From Idea to Amazon Author
            </div>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/70 transition hover:text-white"
            >
              Dashboard
            </a>

            <a
              href="/new-book"
              className="rounded-full bg-[#d4af37] px-4 py-2 text-sm font-black text-black transition hover:opacity-90"
            >
              + New Book
            </a>
          </div>
        </div>
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
          {(books || []).map((book) => (
            <div
              key={book.id}
              className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#b38b16]">
                    {book.book_type || "Book Project"}
                  </div>

                  <h2 className="mt-2 text-2xl font-black leading-tight">
                    {book.title}
                  </h2>

                  <p className="mt-2 text-sm text-black/45">
                    By {book.author_name || "Unknown Author"}
                  </p>
                </div>

                <div className="rounded-full bg-[#fff2c7] px-3 py-1 text-xs font-bold text-[#7a5a16]">
                  {book.status || "draft"}
                </div>
              </div>

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
                  Continue Writing
                </a>

                <a
                  href={`/book-blueprint?id=${book.id}`}
                  className="rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-3 text-center font-black transition hover:-translate-y-0.5"
                >
                  View Blueprint
                </a>
              </div>
            </div>
          ))}
        </div>

        {!books?.length ? (
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
    </main>
  );
}