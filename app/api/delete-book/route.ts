import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID." },
        { status: 400 }
      );
    }

    const { error: chapterDeleteError } = await supabaseAdmin
      .from("book_chapters")
      .delete()
      .eq("project_id", projectId);

    if (chapterDeleteError) {
      console.error(chapterDeleteError);

      return NextResponse.json(
        { error: "Could not delete book chapters." },
        { status: 500 }
      );
    }

    const { error: projectDeleteError } = await supabaseAdmin
      .from("book_projects")
      .delete()
      .eq("id", projectId);

    if (projectDeleteError) {
      console.error(projectDeleteError);

      return NextResponse.json(
        { error: "Could not delete book project." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong deleting this book." },
      { status: 500 }
    );
  }
}