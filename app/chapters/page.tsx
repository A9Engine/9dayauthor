import { supabaseAdmin } from "../../lib/supabaseAdmin";
import ChapterWorkspace from "../components/ChapterWorkspace";
import AuthorLayout from "../components/AuthorLayout";

type PageProps = {
  searchParams: Promise<{
    id?: string;
    chapterId?: string;
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
  const initialChapterId = params.chapterId;

  if (!projectId) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Missing project ID</h1>
      </main>
    );
  }

  const { data: project } = await supabaseAdmin
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { data: existingChapters } = await supabaseAdmin
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
        user_id: project.user_id,
        project_id: projectId,
        chapter_number: index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        description: chapter.description || "",
        reader_outcome: chapter.reader_outcome || "",
        status: "draft",
      })
    );

    await supabaseAdmin.from("book_chapters").insert(generatedRows);

    const { data: refreshedChapters } = await supabaseAdmin
      .from("book_chapters")
      .select("*")
      .eq("project_id", projectId)
      .order("chapter_number", { ascending: true });

    chapters = refreshedChapters || [];
  }

  const activeChapter = chapters[0];

  return (
    <AuthorLayout
  currentStep={3}
  projectId={projectId}
>

       <div className="w-full overflow-x-hidden">
  <ChapterWorkspace
    projectTitle={project?.title || "Untitled Book"}
    targetLength={project?.target_length || ""}
    chapters={chapters}
    initialChapterId={initialChapterId}
  />
</div>
    </AuthorLayout>
  );
}