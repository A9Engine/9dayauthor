import { supabase } from "../../lib/supabase";
import ChapterWorkspace from "../components/ChapterWorkspace";

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  reader_outcome: string;
  content: string;
  status: string;
};

export default async function ChaptersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const projectId = params.id;

  if (!projectId) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Missing project ID</h1>
      </main>
    );
  }

  const { data: project } = await supabase
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { data: existingChapters } = await supabase
    .from("book_chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("chapter_number", { ascending: true });

  let chapters: Chapter[] = existingChapters || [];

  if (!chapters.length && project?.blueprint_output?.chapters) {
    const generatedRows = project.blueprint_output.chapters.map(
      (
        chapter: {
          title?: string;
          description?: string;
          reader_outcome?: string;
        },
        index: number
      ) => ({
        project_id: projectId,
        chapter_number: index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        description: chapter.description || "",
        reader_outcome: chapter.reader_outcome || "",
        status: "draft",
      })
    );

    await supabase.from("book_chapters").insert(generatedRows);

    const { data: refreshedChapters } = await supabase
      .from("book_chapters")
      .select("*")
      .eq("project_id", projectId)
      .order("chapter_number", { ascending: true });

    chapters = refreshedChapters || [];
  }

  const activeChapter = chapters[0];

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
            <div className="hidden rounded-full border border-[#d4af37]/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d4af37] sm:block">
              Step 3 of 9
            </div>

            <a
              href="/dashboard"
              className="rounded-full bg-[#d4af37] px-4 py-2 text-sm font-black text-black transition hover:opacity-90"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <a
            href={`/book-blueprint?id=${projectId}`}
            className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-black/60 shadow-sm transition hover:-translate-y-0.5 hover:text-black"
        >
            ← Back to Blueprint
        </a>
        </div>

        <ChapterWorkspace
        projectTitle={project?.title || "Untitled Book"}
        chapters={chapters}
        />
    </main>
  );
}