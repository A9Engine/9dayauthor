import Link from "next/link";
import AuthorLayout from "../components/AuthorLayout";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type SearchParams = { id?: string | string[] } | Promise<{ id?: string | string[] }>;

async function resolveSearchParams(searchParams: SearchParams) {
  return await Promise.resolve(searchParams);
}

function getProjectId(params: { id?: string | string[] }) {
  const value = params?.id;
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function PublishAmazonPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await resolveSearchParams(searchParams);
  const projectId = getProjectId(params);

  let project: {
    title: string | null;
    author_name: string | null;
    compiled_trim_size: string | null;
  } | null = null;

  if (projectId) {
    const { data } = await supabaseAdmin
      .from("book_projects")
      .select("title, author_name, compiled_trim_size")
      .eq("id", projectId)
      .single();

    project = data;
  }

  const bookTitle = project?.title?.trim() || "your book";
  const trimSize = project?.compiled_trim_size
    ? project.compiled_trim_size.replace("x", " x ")
    : "your selected trim size";

  const checklist = [
    "Final print-ready manuscript PDF downloaded",
    "Paperback cover downloaded from Cover Creator",
    "Hardcover cover downloaded if you plan to publish hardcover",
    "Kindle/eBook cover downloaded if you plan to publish Kindle",
    "Book title, description, keywords, and categories prepared",
    "Amazon KDP previewer reviewed before publishing",
  ];

  const kdpSteps = [
    {
      title: "Log in to Amazon KDP",
      body: "Go to your KDP Bookshelf and choose Paperback, Hardcover, or Kindle eBook.",
    },
    {
      title: "Enter your book details",
      body: "Add your title, author name, description, keywords, categories, language, and publishing rights information.",
    },
    {
      title: "Choose your print settings",
      body: `Use the same trim size you selected in 9 Day Author${trimSize ? ` (${trimSize})` : ""}. If you change trim size, regenerate the manuscript and cover first.`,
    },
    {
      title: "Upload your manuscript PDF",
      body: "Use the final print-ready PDF from Finalize Manuscript.",
    },
    {
      title: "Upload the matching cover file",
      body: "Use the paperback, hardcover, or Kindle cover exported from Cover Creator.",
    },
    {
      title: "Review Amazon's previewer",
      body: "Check every warning, page count, table of contents, cover alignment, and Chapter 1 placement.",
    },
    {
      title: "Set pricing and submit",
      body: "Choose territories, royalty options, pricing, then submit your book for Amazon review.",
    },
  ];

  const mistakes = [
    "Uploading a cover that does not match the selected trim size or page count.",
    "Changing trim size inside KDP without regenerating your manuscript and cover.",
    "Skipping Amazon previewer warnings.",
    "Forgetting to review the title page, copyright page, table of contents, and Chapter 1 placement.",
    "Publishing before saving your final files somewhere safe.",
  ];

  const newBookHref = "/new-book";

  return (
    <AuthorLayout currentStep={9} projectId={projectId}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
       <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white pt-6 shadow-xl shadow-black/5">
          <div className="bg-gradient-to-br from-[#fff7dc] via-white to-[#f7f4ed] px-8 py-9 sm:px-12 sm:py-12">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
              Step 9 of 9
            </div>

            <h1 className="mt-6 max-w-4xl pl-1 text-4xl font-black tracking-tight sm:text-6xl">
              🎉 Congratulations!
            </h1>

            <p className="mt-5 max-w-3xl pl-1 text-lg leading-8 text-black/65">
              Your manuscript, cover files, and publishing assets are ready. You are now ready to publish {bookTitle === "your book" ? "your book" : <span className="font-black text-black">{bookTitle}</span>} on Amazon KDP.
            </p>

          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
            <p className="text-sm font-black uppercase leading-6 tracking-[0.18em] text-[#b38b16]">
              Publishing Checklist
            </p>

            <h2 className="mt-3 text-3xl font-black">Before you open KDP</h2>

            <div className="mt-6 space-y-3">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-black/10 bg-[#faf8f3] p-4 text-sm font-bold leading-6 text-black/70"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#d4af37]/30 bg-[#fff8df] p-5 text-sm font-bold leading-6 text-black/65">
              ⚠️ If Amazon shows a trim size, page count, or cover-size warning, return to 9 Day Author, regenerate the matching file, and upload again.
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
            <p className="text-sm font-black uppercase leading-6 tracking-[0.18em] text-[#b38b16]">
              Amazon KDP Steps
            </p>

            <h2 className="mt-3 text-3xl font-black">Publish your book</h2>

            <div className="mt-6 space-y-4">
              {kdpSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-black/10 bg-[#faf8f3] p-5"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b38b16]">
                      Step {index + 1}
                    </p>

                    <h3 className="mt-2 text-lg font-black">{step.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-black/60">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase leading-6 tracking-[0.18em] text-[#b38b16]">
                Common KDP Mistakes
              </p>

              <h2 className="mt-3 text-3xl font-black">Avoid these before publishing</h2>

              <div className="mt-6 space-y-3">
                {mistakes.map((mistake) => (
                  <div
                    key={mistake}
                    className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-800"
                  >
                    ⚠️ {mistake}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[#faf8f3] px-8 py-9 sm:px-9 sm:py-10">
              <p className="text-sm font-black uppercase leading-6 tracking-[0.18em] text-[#b38b16]">
                Final Reminder
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight">Review everything once inside Amazon.</h2>

              <p className="mt-4 text-base leading-8 text-black/65">
                9 Day Author prepares your files, but Amazon KDP has the final previewer. Before clicking publish, review the PDF preview, cover alignment, pricing, categories, keywords, and book description carefully.
              </p>

              <a
                href="https://kdp.amazon.com"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-black transition hover:-translate-y-0.5"
              >
                Open Amazon KDP
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-green-200 bg-green-50 p-7 text-center shadow-xl shadow-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
            ★
          </div>

          <h2 className="mt-5 text-3xl font-black">Ready for your next book?</h2>

          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-black/65">
            When this book is submitted to Amazon, start your next idea and keep your momentum going.
          </p>

          <Link
            href={newBookHref}
            className="mt-6 inline-flex rounded-2xl bg-green-600 px-7 py-4 font-black text-white transition hover:-translate-y-0.5 hover:bg-green-700"
          >
            Start Your Next Book Now
          </Link>
        </section>
      </main>
    </AuthorLayout>
  );
}
