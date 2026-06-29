import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type BookSection = {
  id: string;
  project_id: string;
  section_type: string;
  sort_order: number;
};

const frontMatterTypes = [
  "title_page",
  "copyright",
  "dedication",
  "introduction",
  "table_of_contents",
];

const backMatterTypes = [
  "acknowledgments",
  "about_author",
  "what_comes_next",
];

function isCustomFrontMatter(sectionType: string) {
  return sectionType.startsWith("custom_front_matter");
}

function isCustomBackMatter(sectionType: string) {
  return sectionType.startsWith("custom_back_matter");
}

function getMatterLocation(sectionType: string) {
  if (frontMatterTypes.includes(sectionType) || isCustomFrontMatter(sectionType)) {
    return "front";
  }

  if (backMatterTypes.includes(sectionType) || isCustomBackMatter(sectionType)) {
    return "back";
  }

  return "other";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body?.projectId as string | undefined;
    const orderedSectionIds = Array.isArray(body?.orderedSectionIds)
      ? (body.orderedSectionIds as string[])
      : [];

    if (!projectId || !orderedSectionIds.length) {
      return NextResponse.json(
        { error: "Missing project ID or page order." },
        { status: 400 },
      );
    }

    const { data: sectionsData, error: sectionsError } = await supabaseAdmin
      .from("book_sections")
      .select("id, project_id, section_type, sort_order")
      .eq("project_id", projectId)
      .in("id", orderedSectionIds);

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 500 });
    }

    const sections = (sectionsData || []) as BookSection[];

    if (sections.length !== orderedSectionIds.length) {
      return NextResponse.json(
        { error: "Could not find every page in that order." },
        { status: 400 },
      );
    }

    const locations = new Set(sections.map((section) => getMatterLocation(section.section_type)));

    if (locations.size !== 1 || locations.has("other")) {
      return NextResponse.json(
        { error: "Front matter and back matter must be reordered separately." },
        { status: 400 },
      );
    }

    const location = Array.from(locations)[0];
    const baseSortOrder = location === "front" ? 10 : 1010;

    await Promise.all(
      orderedSectionIds.map((sectionId, index) =>
        supabaseAdmin
          .from("book_sections")
          .update({ sort_order: baseSortOrder + index * 10 })
          .eq("id", sectionId)
          .eq("project_id", projectId),
      ),
    );

    const { data: updatedSections, error: updatedError } = await supabaseAdmin
      .from("book_sections")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (updatedError) {
      return NextResponse.json({ error: updatedError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sections: updatedSections || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong saving the page order." },
      { status: 500 },
    );
  }
}
