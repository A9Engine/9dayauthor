import { supabaseServer } from "./supabaseServer";

export type ManuscriptSection = {
  type: string;
  title: string;
  content: string;
  sortOrder: number;
};

export type ManuscriptObject = {
  metadata: {
    projectId: string;
    title: string;
    authorName: string;
    bookType: string;
    targetLength: string;
    audience?: string;
    tone?: string;
    description?: string;
  };
  layout: {
    trimSize: "6x9";
    format: "paperback";
    fontFamily: "Georgia";
    fontSize: 22;
    lineSpacing: 276;
  };
  stats: {
    chapterCount: number;
    wordCount: number;
    estimatedPages: number;
  };
  sections: ManuscriptSection[];
};

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export async function buildManuscript(projectId: string): Promise<ManuscriptObject> {
  const { data: project, error: projectError } = await supabaseServer
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
  console.error("PROJECT ERROR:", projectError);
  console.error("PROJECT:", project);

  throw new Error(
    projectError?.message || "Could not load book project."
  );
}

  const { data: chapters, error: chaptersError } = await supabaseServer
    .from("book_chapters")
    .select("*")
    .eq("project_id", projectId)
    .order("chapter_number", { ascending: true });

  if (chaptersError) {
    throw new Error("Could not load chapters.");
  }

  const { data: bookSections, error: sectionsError } = await supabaseServer
    .from("book_sections")
    .select("*")
    .eq("project_id", projectId)
    .eq("include_in_book", true)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    throw new Error("Could not load book sections.");
  }

  const mappedBookSections =
  bookSections?.map((section) => ({
    type: section.section_type,
    title: section.title || "",
    content: section.content || "",
    sortOrder: section.sort_order || 0,
  })) || [];

const frontMatterTypes = [
  "title_page",
  "copyright",
  "dedication",
  "introduction",
];

const backMatterTypes = [
  "acknowledgments",
  "about_author",
  "what_comes_next",
];

const frontMatter = mappedBookSections
  .filter((section) => frontMatterTypes.includes(section.type))
  .sort((a, b) => a.sortOrder - b.sortOrder);

const backMatter = mappedBookSections
  .filter((section) => backMatterTypes.includes(section.type))
  .sort((a, b) => a.sortOrder - b.sortOrder);

const chapterSections =
  chapters?.map((chapter) => ({
    type: "chapter",
    title: `Chapter ${chapter.chapter_number}: ${chapter.title}`,
    content: chapter.content || "",
    sortOrder: 1000 + chapter.chapter_number,
  })) || [];

const sections = [...frontMatter, ...chapterSections, ...backMatter];

  const totalWords = sections.reduce((sum, section) => {
    return sum + countWords(section.content);
  }, 0);

  return {
    metadata: {
      projectId: project.id,
      title: project.title || "Untitled Book",
      authorName: project.author_name || "Author Name",
      bookType: project.book_type || "Nonfiction",
      targetLength: project.target_length || "150 pages",
      audience: project.audience || "",
      tone: project.tone || "",
      description: project.book_description || "",
    },
    layout: {
      trimSize: "6x9",
      format: "paperback",
      fontFamily: "Georgia",
      fontSize: 22,
      lineSpacing: 276,
    },
    stats: {
      chapterCount: chapters?.length || 0,
      wordCount: totalWords,
      estimatedPages: Math.round((totalWords / 275) * 10) / 10,
    },
    sections,
  };
}