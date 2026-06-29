import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanChapterText(value: string | null | undefined) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { chapterId } = await req.json();

    if (!chapterId) {
      return NextResponse.json({ error: "Missing chapterId" }, { status: 400 });
    }

    const { data: chapter, error } = await supabaseAdmin
      .from("book_chapters")
      .select("*")
      .eq("id", chapterId)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const content = cleanChapterText(chapter.content);

    if (!content) {
      return NextResponse.json({ issues: [] });
    }

    const prompt = `
You are the AI Chapter Editor inside 9 Day Author.

Your job is to help a first-time author improve ONE chapter using a guided accept/skip workflow.

IMPORTANT RULES:
- Review this chapter only.
- Do NOT compare it to other chapters.
- Focus on sentence-level and paragraph-level improvements.
- Preserve the author's voice.
- Be conservative unless the sentence is clearly awkward, unclear, repetitive, or grammatically wrong.
- Return changes that can be applied by replacing an exact original text snippet with a suggested replacement.
- The "original" field MUST be an exact substring copied from the chapter.
- Do not invent text that is not in the chapter.
- Avoid tiny style preferences unless they genuinely improve clarity.
- Maximum 12 issues.

Look for:
- grammar
- spelling
- clarity
- readability
- awkward phrasing
- unnecessary repetition inside the chapter
- passive/weak wording
- weak transitions
- overly long sentences

Return valid JSON only with this exact structure:

{
  "issues": [
    {
      "type": "grammar | spelling | clarity | readability | repetition | transition | style",
      "original": "exact original text from the chapter",
      "suggestion": "replacement text",
      "reason": "short plain-English reason"
    }
  ]
}

Chapter ${chapter.chapter_number}: ${chapter.title}

${content.slice(0, 45000)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert book editor. Return clean valid JSON only. Suggestions must use exact original snippets from the user's text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.25,
      response_format: { type: "json_object" },
    });

    const contentJson = completion.choices[0]?.message?.content;

    if (!contentJson) {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(contentJson);
    const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];

    const issues = rawIssues
      .filter((issue: any) => {
        return (
          typeof issue?.original === "string" &&
          typeof issue?.suggestion === "string" &&
          issue.original.trim() &&
          issue.suggestion.trim() &&
          content.includes(issue.original)
        );
      })
      .slice(0, 12)
      .map((issue: any, index: number) => ({
        id: `issue-${index + 1}`,
        type: String(issue.type || "clarity"),
        original: issue.original,
        suggestion: issue.suggestion,
        reason: String(issue.reason || "Suggested improvement."),
      }));

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Chapter review failed:", error);
    return NextResponse.json({ error: "Chapter review failed" }, { status: 500 });
  }
}
