import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from("book_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const blueprint = project.blueprint_output;

    if (!blueprint?.chapters || !Array.isArray(blueprint.chapters)) {
      return NextResponse.json(
        { error: "No blueprint chapters found" },
        { status: 400 }
      );
    }

    const chapterRows = blueprint.chapters.map(
      (
        chapter: {
          title?: string;
          description?: string;
          reader_outcome?: string;
        },
        index: number
      ) => ({
        project_id: projectId,
        chapter_number: index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        description: chapter.description || "",
        reader_outcome: chapter.reader_outcome || "",
        status: "draft",
      })
    );

    const { error: insertError } = await supabase
      .from("book_chapters")
      .insert(chapterRows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chapters_created: chapterRows.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}