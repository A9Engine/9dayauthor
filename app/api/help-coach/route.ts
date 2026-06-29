import { NextResponse } from "next/server";
import OpenAI from "openai";

type HelpMessage = {
  role: "user" | "assistant";
  content: string;
};

const pageGuides: Record<string, string> = {
  "1": "New Book Setup: help the author define their book title, audience, tone, book type, and description.",
  "2": "Blueprint: help the author understand, edit, reorder, add, or remove chapters before writing.",
  "3": "Chapters: help the author write chapter content, expand sections, use voice dictation, and continue writing.",
  "4": "Edit Manuscript: help the author review, improve, strengthen, and refine the manuscript.",
  "5": "Additional Pages: help the author create dedication, acknowledgments, about the author, and what comes next pages.",
  "6": "Formatting: help the author choose layout, trim size, fonts, and formatting options.",
  "7": "Finalize Manuscript: help the author export and download the final manuscript files.",
  "8": "Cover Creator: help the author create paperback, hardcover, and Kindle cover assets.",
  "9": "Publish to Amazon: help the author understand the KDP publishing process.",
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const body = await request.json();
    const messages = (body.messages || []) as HelpMessage[];
    const currentStep = String(body.currentStep || "");
    const currentPage = body.currentPage || "9 Day Author";

    const pageContext =
      pageGuides[currentStep] ||
      `Current page: ${currentPage}. Help the user understand how to use this part of 9 Day Author.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content: `
You are the 9 Day Author Help Coach.

Help users understand how to use the platform. Be practical, concise, and specific.
Do not write long essays.
Do not answer unrelated questions.
If the user asks something outside 9 Day Author, gently bring them back to using the platform.

Current page context:
${pageContext}

Answer in short, helpful steps.
          `,
        },
        ...messages,
      ],
    });

    return NextResponse.json({
      reply:
        completion.choices[0]?.message?.content ||
        "I can help you understand what to do on this page.",
    });
  } catch (error) {
    console.error("Help coach error:", error);

    return NextResponse.json(
      { error: "Could not generate help response." },
      { status: 500 }
    );
  }
}