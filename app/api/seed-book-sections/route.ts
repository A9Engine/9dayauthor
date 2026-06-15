import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const defaultSections = [
  { section_type: "title_page", title: "Title Page", sort_order: 1, page_count_estimate: 1 },
  { section_type: "copyright", title: "Copyright Page", sort_order: 2, page_count_estimate: 1 },
  { section_type: "dedication", title: "Dedication", sort_order: 3, page_count_estimate: 1 },
  { section_type: "introduction", title: "Introduction", sort_order: 5, page_count_estimate: 2 },
  { section_type: "acknowledgments", title: "Acknowledgments", sort_order: 900, page_count_estimate: 1 },
  { section_type: "about_author", title: "About the Author", sort_order: 901, page_count_estimate: 1 },
  { section_type: "what_comes_next", title: "What Comes Next", sort_order: 902, page_count_estimate: 1 },
];

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("book_projects")
      .select("id, title, author_name, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

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

    const { error } = await supabaseAdmin
      .from("book_sections")
      .upsert(rows, {
        onConflict: "project_id,section_type",
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong seeding book sections." },
      { status: 500 }
    );
  }
}