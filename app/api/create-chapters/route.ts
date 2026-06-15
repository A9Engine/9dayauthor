import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";


export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const { data: project, error: fetchError } = await supabaseAdmin
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

    const { data: existingChapters } = await supabaseAdmin
      .from("book_chapters")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);

    if (existingChapters && existingChapters.length > 0) {
      return NextResponse.json({
        success: true,
        chapters_created: 0,
        message: "Chapters already exist",
      });
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
        user_id: project.user_id,
        project_id: projectId,
        chapter_number: index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        description: chapter.description || "",
        reader_outcome: chapter.reader_outcome || "",
        status: "draft",
      })
    );

    const { error: insertError } = await supabaseAdmin
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