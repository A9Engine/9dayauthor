import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

export async function POST(req: Request) {
  try {
    const { chapterId, finalContent } = await req.json();

    if (!chapterId) {
      return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });
    }

    if (typeof finalContent !== "string") {
      return NextResponse.json({ error: "Missing finalContent" }, { status: 400 });
    }

    const wordCount = countWords(finalContent);

    const { error } = await supabaseAdmin
      .from("book_chapters")
      .update({
        content: finalContent,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chapterId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, wordCount });
  } catch (error) {
    console.error("Apply chapter edits failed:", error);
    return NextResponse.json({ error: "Apply chapter edits failed" }, { status: 500 });
  }
}
