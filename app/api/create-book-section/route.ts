import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type BookSection = {
  id: string;
  project_id: string;
  section_type: string;
  title: string;
  content: string | null;
  sort_order: number;
  page_count_estimate?: number | null;
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

function isFrontMatter(section: BookSection) {
  return frontMatterTypes.includes(section.section_type) || isCustomFrontMatter(section.section_type);
}

function isBackMatter(section: BookSection) {
  return backMatterTypes.includes(section.section_type) || isCustomBackMatter(section.section_type);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body?.projectId as string | undefined;
    const location = body?.location === "front" ? "front" : "back";

    if (!projectId) {
      return NextResponse.json({ error: "Missing project ID." }, { status: 400 });
    }

    const { data: existingSections, error: existingError } = await supabaseAdmin
      .from("book_sections")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const sections = (existingSections || []) as BookSection[];
    const matchingCustomSections = sections.filter((section) =>
      location === "front"
        ? isCustomFrontMatter(section.section_type)
        : isCustomBackMatter(section.section_type),
    );

    const customNumber = matchingCustomSections.length + 1;
    const sectionTypePrefix = location === "front" ? "custom_front_matter" : "custom_back_matter";
    const sectionType = `${sectionTypePrefix}_${Date.now()}`;
    const baseTitle = location === "front" ? "Custom Front Matter Page" : "Custom Back Matter Page";
    const title = customNumber === 1 ? baseTitle : `${baseTitle} ${customNumber}`;

    const sameMatterSections = sections.filter((section) =>
      location === "front" ? isFrontMatter(section) : isBackMatter(section),
    );

    const defaultBaseSortOrder = location === "front" ? 10 : 1010;
    const highestMatterSortOrder = sameMatterSections.reduce(
      (max, section) => Math.max(max, Number(section.sort_order) || 0),
      defaultBaseSortOrder,
    );

    const { data: section, error } = await supabaseAdmin
      .from("book_sections")
      .insert({
        project_id: projectId,
        section_type: sectionType,
        title,
        content: "",
        sort_order: highestMatterSortOrder + 10,
        page_count_estimate: 1,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.code === "23505"
              ? "Could not add that page. Please try again."
              : error.message,
        },
        { status: 500 },
      );
    }

    const { data: updatedSections } = await supabaseAdmin
      .from("book_sections")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    return NextResponse.json({
      section,
      sections: updatedSections || [section],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong adding the page." },
      { status: 500 },
    );
  }
}
