import { supabaseAdmin } from "../../lib/supabaseAdmin";

function splitParagraphs(value: string | null | undefined) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default async function PrintChapterPage({
  searchParams,
}: {
  searchParams: Promise<{ chapterId?: string; projectId?: string }>;
}) {
  const params = await searchParams;
  const chapterId = params.chapterId;

  if (!chapterId) {
    return <div className="p-10 text-2xl font-black">Missing chapter ID</div>;
  }

  const { data: chapter } = await supabaseAdmin
    .from("book_chapters")
    .select("*")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return <div className="p-10 text-2xl font-black">Chapter not found</div>;
  }

  const paragraphs = splitParagraphs(chapter.content);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-8 text-black print:bg-white print:px-0 print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 !important; padding: 0.75in !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3">
        <a
          href={params.projectId ? `/manuscript-review?id=${params.projectId}` : "/manuscript-review"}
          className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black"
        >
          Back to Edit Manuscript
        </a>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function () {
          var buttons = document.querySelectorAll('[data-print-button]');
          buttons.forEach(function(button){ button.addEventListener('click', function(){ window.print(); }); });
        });
      ` }} />

      <div className="no-print mx-auto mb-6 max-w-3xl text-center">
        <button
          data-print-button
          type="button"
          className="rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37]"
        >
          Print Chapter
        </button>
      </div>

      <article className="print-page mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white p-8 shadow-xl shadow-black/5 sm:p-12">
        <div className="text-center text-sm font-black uppercase tracking-[0.18em] text-[#b38b16] print:text-black">
          Chapter {chapter.chapter_number}
        </div>

        <h1 className="mt-4 text-center font-serif text-4xl font-black leading-tight print:text-3xl">
          {chapter.title || `Chapter ${chapter.chapter_number}`}
        </h1>

        <div className="mt-10 space-y-6 font-serif text-lg leading-9 text-black/80 print:text-[12pt] print:leading-8">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${chapter.id}-${index}`} className="indent-8">
                {paragraph}
              </p>
            ))
          ) : (
            <p>No chapter content written yet.</p>
          )}
        </div>
      </article>
    </main>
  );
}
