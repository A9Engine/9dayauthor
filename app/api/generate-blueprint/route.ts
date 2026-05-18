import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { data: project, error: fetchError } = await supabase
      .from("book_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const prompt = `
You are an elite nonfiction book strategist helping a first-time author turn their idea into a clear book blueprint.

Use the details below.

Book Title:
${project.title}

Author:
${project.author_name || "Not provided"}

Book Type:
${project.book_type || "Not provided"}

Target Length:
${project.target_length || "Not provided"}

Target Reader:
${project.audience || "Not provided"}

Book Description:
${project.book_description || "Not provided"}

Writing Tone:
${project.tone || "Not provided"}

Create a professional book blueprint.

Return valid JSON only with this exact structure:

{
  "summary": "A compelling 2 to 4 sentence summary of the book.",
  "core_promise": "The main transformation or outcome the reader gets from the book.",
  "target_reader_profile": "A clear description of who this book is for.",
  "positioning_angle": "How this book should be positioned so it feels valuable and clear.",
  "recommended_chapter_count": 12,
  "chapters": [
    {
      "title": "Chapter title",
      "description": "Short chapter description",
      "reader_outcome": "What the reader should understand or feel after this chapter"
    }
  ]
}

Recommend the best chapter count for this book based on its target length, book type, and story structure.

Use between 9 and 17 chapters.

For shorter books, use fewer chapters.
For deeper memoirs, business books, or books over 200 pages, use more chapters if it improves the reading experience.

Do not force 9 chapters unless 9 truly fits the book.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an elite nonfiction book strategist. You return clean valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(content);

    const { error: updateError } = await supabase
      .from("book_projects")
      .update({
        blueprint_output: parsed,
        status: "blueprint_created",
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save blueprint" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      blueprint: parsed,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}