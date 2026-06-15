import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { sectionId, title, content } = await req.json();

    if (!sectionId) {
      return NextResponse.json(
        { error: "Missing sectionId." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("book_sections")
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong updating the section." },
      { status: 500 }
    );
  }
}