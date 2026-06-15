import { supabaseAdmin } from "../../lib/supabaseAdmin";
import AuthorLayout from "../components/AuthorLayout";
import BookSectionsWorkspace from "../components/BookSectionsWorkspace";

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function BookSectionsPage({ searchParams }: PageProps) {
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

  const { data: sectionsData } = await supabaseAdmin
    .from("book_sections")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  return (
    <AuthorLayout currentStep={5} projectId={projectId}>
      <BookSectionsWorkspace
        projectId={projectId}
        title={project.title || "Untitled Book"}
        authorName={project.author_name || "Unknown Author"}
        sections={sectionsData || []}
      />
    </AuthorLayout>
  );
}