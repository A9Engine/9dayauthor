import { supabaseAdmin } from "../../lib/supabaseAdmin";
import AuthorLayout from "../components/AuthorLayout";
import CoverCreatorWorkspace from "../components/CoverCreatorWorkspace";

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

function estimatePageCountFromTargetLength(targetLength: unknown) {
  const parsedTargetLength =
    typeof targetLength === "number"
      ? targetLength
      : typeof targetLength === "string"
      ? Number(targetLength)
      : 0;

  if (!Number.isFinite(parsedTargetLength) || parsedTargetLength <= 0) {
    return 150;
  }

  return Math.max(24, Math.ceil(parsedTargetLength / 275));
}

export default async function CoverCreatorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const projectId = params.id;

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

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Project not found</h1>
      </main>
    );
  }

  const { data: chapters } = await supabaseAdmin
    .from("book_chapters")
    .select("word_count, content")
    .eq("project_id", projectId)
    .order("chapter_number", { ascending: true });

  const totalChapterWords =
    chapters?.reduce((total, chapter) => {
      if (typeof chapter.word_count === "number" && chapter.word_count > 0) {
        return total + chapter.word_count;
      }

      if (typeof chapter.content === "string" && chapter.content.trim()) {
        return total + chapter.content.trim().split(/\s+/).length;
      }

      return total;
    }, 0) || 0;

  const fallbackEstimatedPageCount =
    totalChapterWords > 0
      ? Math.max(24, Math.ceil(totalChapterWords / 275) + 12)
      : estimatePageCountFromTargetLength(project.target_length);

  const compiledPageCount =
    typeof project.compiled_page_count === "number" &&
    project.compiled_page_count > 0
      ? project.compiled_page_count
      : null;

  const finalPageCount = compiledPageCount || fallbackEstimatedPageCount;

  const { data: savedCoverSettings } = await supabaseAdmin
    .from("book_cover_settings")
    .select(`
      cover_format,
      trim_size,
      paper_type,
      page_count,
      title,
      subtitle,
      author_name,
      spine_title,
      spine_author,
      back_cover_text,
      background_image_url,
      image_scale,
      image_x,
      image_y,
      image_fit_mode,
      show_guides,
      panel_styles,
      cover_layers
    `)
    .eq("project_id", projectId)
    .maybeSingle();

  const projectData = {
    id: project.id,
    title: project.title || "Untitled Book",
    author_name: project.author_name || "Author Name",
    estimatedPageCount: finalPageCount,
    officialPageCount: compiledPageCount,
    hasFinalizedManuscript: Boolean(compiledPageCount),
    compiledTrimSize: project.compiled_trim_size || "6x9",
    compiledFormat: project.compiled_format || "paperback",
    compiledAt: project.compiled_at || null,
    book_type: project.book_type || null,
  };

  return (
    <AuthorLayout currentStep={8} projectId={projectId}>
      <CoverCreatorWorkspace
        projectData={projectData}
        savedCoverSettings={savedCoverSettings}
      />
    </AuthorLayout>
  );
}