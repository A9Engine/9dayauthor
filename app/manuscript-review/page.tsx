import { supabaseAdmin } from "../../lib/supabaseAdmin";
import AuthorLayout from "../components/AuthorLayout";
import EditManuscriptClient from "../components/EditManuscriptClient";

export type ManuscriptChapter = {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  description?: string | null;
  reader_outcome?: string | null;
  content: string | null;
  word_count: number | null;
  updated_at: string | null;
};

export type ManuscriptProject = {
  id: string;
  title: string;
  author_name?: string | null;
  book_description?: string | null;
  audience?: string | null;
  tone?: string | null;
  blueprint_output?: unknown;
};

export default async function ManuscriptReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const projectId = params.id;

  if (!projectId) {
    return <div className="p-10 text-2xl font-black">Missing project ID</div>;
  }

  const { data: project } = await supabaseAdmin
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return <div className="p-10 text-2xl font-black">Project not found</div>;
  }

  const { data: chaptersData } = await supabaseAdmin
    .from("book_chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("chapter_number", { ascending: true });

  return (
    <AuthorLayout currentStep={4} projectId={projectId}>
      <EditManuscriptClient
        project={project as ManuscriptProject}
        chapters={(chaptersData || []) as ManuscriptChapter[]}
      />
    </AuthorLayout>
  );
}
