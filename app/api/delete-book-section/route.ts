import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const protectedFrontMatterTypes = [
  "title_page",
  "copyright",
  "dedication",
  "introduction",
  "table_of_contents",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sectionId = body?.sectionId as string | undefined;

    if (!sectionId) {
      return NextResponse.json({ error: "Missing section ID." }, { status: 400 });
    }

    const { data: section, error: lookupError } = await supabaseAdmin
      .from("book_sections")
      .select("id, section_type")
      .eq("id", sectionId)
      .single();

    if (lookupError || !section) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    if (protectedFrontMatterTypes.includes(section.section_type)) {
      return NextResponse.json(
        { error: "Standard front matter pages cannot be removed." },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("book_sections")
      .delete()
      .eq("id", sectionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong removing the page." },
      { status: 500 },
    );
  }
}
