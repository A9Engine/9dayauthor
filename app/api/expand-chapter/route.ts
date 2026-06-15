import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { chapterId, currentContent } = await req.json();

    if (!chapterId) {
      return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });
    }

    const { data: chapter, error: chapterError } = await supabaseAdmin
      .from("book_chapters")
      .select("*")
      .eq("id", chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("book_projects")
      .select("*")
      .eq("id", chapter.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Book project not found" }, { status: 404 });
    }

    const prompt = `
You are an elite nonfiction book editor and developmental writing coach.

The author is writing a book titled:
${project.title}

Book description:
${project.book_description || "Not provided"}

Target reader:
${project.audience || "Not provided"}

Writing tone:
${project.tone || "Not provided"}

Current chapter:
Chapter ${chapter.chapter_number}: ${chapter.title}

Chapter direction:
${chapter.description || "Not provided"}

Reader outcome:
${chapter.reader_outcome || "Not provided"}

Current draft content:
${currentContent || chapter.content || "The author has not written much yet."}

Task:
Expand the author's current chapter content with more depth, clarity, examples, and useful detail.

Rules:
- Preserve the author's original tone and wording style.
- Expand the ideas naturally without sounding overly polished or theatrical.
- Avoid sounding like generic AI-generated writing.
- Do not overuse em dashes.
- Avoid excessive dramatic narration or motivational language.
- Avoid repetitive sentence patterns.
- Write more like a strong human writer and editor, not a cinematic storyteller.
- Keep the prose grounded, clear, and believable.
- Add meaningful depth, examples, observations, and clarity.
- Preserve some imperfections and natural rhythm.
- Use varied sentence lengths.
- Do not constantly restate the same emotional idea.
- Avoid phrases that feel overly inspirational or cliché.
- Do not include markdown headings unless truly necessary.
- Return only the improved chapter text.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional nonfiction book editor. Return only the improved chapter text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const expandedText = completion.choices[0]?.message?.content;

    if (!expandedText) {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expandedText,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}