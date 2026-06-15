import { supabaseAdmin } from "../../lib/supabaseAdmin";
import AuthorLayout from "../components/AuthorLayout";
import FormattingWorkspace from "../components/FormattingWorkspace";

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  word_count: number | null;
};

type BookSection = {
  id: string;
  section_type: string;
  title: string;
  content: string | null;
  sort_order: number;
  include_in_book: boolean;
  page_count_estimate: number;
};

const defaultSections = [
  {
    section_type: "title_page",
    title: "Title Page",
    sort_order: 1,
    page_count_estimate: 1,
  },
  {
    section_type: "copyright",
    title: "Copyright Page",
    sort_order: 2,
    page_count_estimate: 1,
  },
  {
    section_type: "dedication",
    title: "Dedication",
    sort_order: 3,
    page_count_estimate: 1,
  },
  {
  section_type: "table_of_contents",
  title: "Contents",
  sort_order: 4,
  page_count_estimate: 2,
},
{
  section_type: "introduction",
  title: "Introduction",
  sort_order: 5,
  page_count_estimate: 2,
},
  {
    section_type: "acknowledgments",
    title: "Acknowledgments",
    sort_order: 900,
    page_count_estimate: 1,
  },
  {
    section_type: "about_author",
    title: "About the Author",
    sort_order: 901,
    page_count_estimate: 1,
  },
  {
    section_type: "what_comes_next",
    title: "What Comes Next",
    sort_order: 902,
    page_count_estimate: 1,
  },
];

export default async function FormattingPage({ searchParams }: PageProps) {
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

  const { data: existingSections } = await supabaseAdmin
    .from("book_sections")
    .select("*")
    .eq("project_id", projectId);

  if (!existingSections?.length) {
    const rows = defaultSections.map((section) => ({
      project_id: project.id,
      user_id: project.user_id,
      section_type: section.section_type,
      title: section.title,
      sort_order: section.sort_order,
      page_count_estimate: section.page_count_estimate,
      include_in_book: true,
      content:
        section.section_type === "title_page"
          ? `${project.title}\n\n${project.author_name || ""}`
          : "",
    }));

    await supabaseAdmin.from("book_sections").insert(rows);
  }

  const { data: sectionsData } = await supabaseAdmin
    .from("book_sections")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  const { data: chaptersData } = await supabaseAdmin
    .from("book_chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("chapter_number", { ascending: true });

  const chapters: Chapter[] = chaptersData || [];
  const sections: BookSection[] = sectionsData || [];

  const targetPagesMatch = String(project.target_length || "").match(/\d+/);

  const targetPages = targetPagesMatch ? Number(targetPagesMatch[0]) : 150;

  return (
    <AuthorLayout currentStep={6} projectId={projectId}>
      <FormattingWorkspace
        projectId={projectId}
        title={project.title || "Untitled Book"}
        authorName={project.author_name || "Unknown Author"}
        targetPages={targetPages}
        chapters={chapters}
        sections={sections}
      />
    </AuthorLayout>
  );
}