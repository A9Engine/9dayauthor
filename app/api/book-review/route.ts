import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wordCount(value: string | null | undefined) {
  const text = String(value || "").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("book_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: chaptersData, error: chaptersError } = await supabaseAdmin
      .from("book_chapters")
      .select("chapter_number,title,description,reader_outcome,content,word_count")
      .eq("project_id", projectId)
      .order("chapter_number", { ascending: true });

    if (chaptersError) {
      return NextResponse.json({ error: chaptersError.message }, { status: 500 });
    }

    const chapters = chaptersData || [];

    if (!chapters.length) {
      return NextResponse.json({ error: "No chapters found" }, { status: 400 });
    }

    const manuscriptContext = chapters
      .map((chapter: any) => {
        const content = String(chapter.content || "");
        return `
Chapter ${chapter.chapter_number}: ${chapter.title}
Word count: ${chapter.word_count || wordCount(content)}
Blueprint direction: ${chapter.description || "Not provided"}
Reader outcome: ${chapter.reader_outcome || "Not provided"}
Opening excerpt:
${content.slice(0, 1800)}

Ending excerpt:
${content.slice(-1800)}
`;
      })
      .join("\n\n---\n\n")
      .slice(0, 55000);

    const prompt = `
You are the AI Book Editor inside 9 Day Author.

IMPORTANT:
- This is a whole-book review, not a grammar check.
- Do NOT critique sentence-level grammar or spelling here.
- Chapter-level grammar and clarity are handled separately by AI Chapter Editor.
- Focus on macro editing: structure, pacing, repetition across chapters, chapter order, transitions, missing examples, and whether the book fulfills its promise.
- Be direct but encouraging for a first-time author.

Project Title: ${project.title}
Author: ${project.author_name || "Not provided"}
Target Reader: ${project.audience || "Not provided"}
Book Description: ${project.book_description || "Not provided"}
Tone: ${project.tone || "Not provided"}

Return valid JSON only with this exact structure:

{
  "overallScore": 82,
  "structureScore": 80,
  "pacingScore": 78,
  "consistencyScore": 85,
  "publishingReadiness": "A short plain-English readiness label",
  "summary": "A 3-5 sentence overview of the manuscript's current macro-level readiness.",
  "strongestChapters": ["Chapter 1 - reason", "Chapter 7 - reason"],
  "chaptersNeedingAttention": ["Chapter 3 - reason", "Chapter 9 - reason"],
  "repeatedIdeas": ["Repeated idea and where it appears"],
  "transitionNotes": ["Transition issue or improvement"],
  "recommendedNextActions": ["Specific next action", "Specific next action"]
}

Use scores from 0 to 100.

Manuscript excerpts:
${manuscriptContext}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert developmental book editor. Return clean valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const review = JSON.parse(content);

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Book review failed:", error);
    return NextResponse.json({ error: "Book review failed" }, { status: 500 });
  }
}
