import { supabaseAdmin } from "../../lib/supabaseAdmin";
import AuthorLayout from "../components/AuthorLayout";

type Chapter = {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  word_count: number | null;
  updated_at: string | null;
};

function getWordCount(chapter: Chapter) {
  if (chapter.word_count) return chapter.word_count;

  return chapter.content?.trim().split(/\s+/).length || 0;
}

export default async function ManuscriptReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const projectId = params.id;

  if (!projectId) {
    return (
      <div className="p-10 text-2xl font-black">
        Missing project ID
      </div>
    );
  }

  const { data: project } = await supabaseAdmin
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return (
      <div className="p-10 text-2xl font-black">
        Project not found
      </div>
    );
  }

  const { data: chaptersData } = await supabaseAdmin
    .from("book_chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("chapter_number", { ascending: true });

  const chapters: Chapter[] = chaptersData || [];

  const totalWords = chapters.reduce(
    (sum, chapter) => sum + getWordCount(chapter),
    0
  );

  const estimatedPages = Math.round(totalWords / 275);

  const completedChapters = chapters.filter(
    (chapter) => getWordCount(chapter) >= 1200
  ).length;

  const thinChapters = chapters.filter(
    (chapter) => getWordCount(chapter) < 1200
  );

  return (
            <AuthorLayout
        currentStep={4}
        projectId={projectId}
        >
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
              Manuscript Review
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-tight">
              {project.title}
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-black/60">
              Review your manuscript structure, chapter depth, pacing,
              and overall progress before moving into formatting.
            </p>
          </div>

          <a
            href={`/formatting?id=${projectId}`}
            className="rounded-2xl bg-black px-6 py-4 text-center text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5"
          >
            Continue to Formatting
          </a>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Words", totalWords.toLocaleString()],
            ["Estimated Pages", String(estimatedPages)],
            ["Total Chapters", String(chapters.length)],
            [
              "Completed Chapters",
              `${completedChapters}/${chapters.length}`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg shadow-black/5"
            >
              <div className="text-sm font-semibold text-black/45">
                {label}
              </div>

              <div className="mt-3 text-3xl font-black">
                {value}
              </div>
            </div>
          ))}
        </div>

        {thinChapters.length ? (
          <div className="mt-10 rounded-[2rem] border border-[#d4af37]/30 bg-[#fff8e6] p-6">
            <div className="text-lg font-black text-[#7a5a16]">
              Chapters Needing Expansion
            </div>

            <p className="mt-2 max-w-3xl leading-7 text-[#7a5a16]/80">
              Some chapters are currently thin and may need more
              development before publishing.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {thinChapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`/chapters?id=${projectId}&chapterId=${chapter.id}`}
                  className="rounded-full border border-[#d4af37]/30 bg-white px-4 py-2 text-sm font-bold text-[#7a5a16] transition hover:bg-[#fff3cf]"
                >
                  Chapter {chapter.chapter_number}: {chapter.title}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 xl:grid-cols-2">
          {chapters.map((chapter) => {
            const words = getWordCount(chapter);
            const estimatedChapterPages = Math.max(
              1,
              Math.round(words / 275)
            );

            return (
              <div
                key={chapter.id}
                className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg shadow-black/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-[#b38b16]">
                      Chapter {chapter.chapter_number}
                    </div>

                    <h2 className="mt-2 text-2xl font-black leading-tight">
                      {chapter.title}
                    </h2>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      words >= 1200
                        ? "bg-green-100 text-green-700"
                        : "bg-[#fff2c7] text-[#7a5a16]"
                    }`}
                  >
                    {words >= 1200 ? "Healthy" : "Needs More Depth"}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-[#faf8f1] p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                      Words
                    </div>

                    <div className="mt-1 text-xl font-black">
                      {words.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#faf8f1] p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                      Pages
                    </div>

                    <div className="mt-1 text-xl font-black">
                      {estimatedChapterPages}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#faf8f1] p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                      Status
                    </div>

                    <div className="mt-1 text-sm font-black">
                      {words >= 1200 ? "Strong" : "Expand"}
                    </div>
                  </div>
                </div>

                <p className="mt-6 line-clamp-5 leading-7 text-black/60">
                  {chapter.content ||
                    "No chapter content written yet."}
                </p>

                <div className="mt-6">
                  <a
                    href={`/chapters?id=${projectId}&chapterId=${chapter.id}`}
                    className="inline-flex rounded-2xl bg-black px-5 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5"
                  >
                    Continue Writing
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthorLayout>
  );
}