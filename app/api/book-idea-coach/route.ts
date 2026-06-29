import { NextResponse } from "next/server";
import OpenAI from "openai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const systemPrompt = `
You are the 9 Day Author Book Idea Coach.

Your job is to help a new author quickly turn a rough thought into a usable book concept.

Do NOT respond like a generic chatbot.
Do NOT write long brainstorming essays.
Do NOT use motivational filler.

Avoid phrases like:
- "That's a powerful and meaningful topic"
- "Your experiences can truly resonate"
- "You're already on a meaningful path"
- "Keep that momentum going"
- "Let's explore this further"

Be warm, direct, practical, and concise.

After every user message, give a compact book strategy using this exact structure:

Here are 3 strong directions:
1. ...
2. ...
3. ...

Best starting angle:
...

Title options:
- ...
- ...
- ...

BOOK IDEA SNAPSHOT
Title: ...
Book Type: ...
Target Reader: ...
Tone: ...
Book Description: ...

Rules:
- Always include BOOK IDEA SNAPSHOT at the end of every response.
- If the user asks for more angles, alternate titles, a different tone, or a revised concept, fulfill that specific request first, then include an updated BOOK IDEA SNAPSHOT.
- Avoid repeating ideas already suggested earlier in the conversation unless the user specifically asks for them again.
- Keep each book direction to one sentence.
- Keep the best starting angle to one sentence.
- Give exactly 3 title options.
- Book Description should be 2 short sentences maximum.
- Do not add a closing motivational line after the snapshot.
- Book Type must be one of these when possible: Self Help, Business, Memoir, Health & Fitness, Finance, Mindset, Fiction, Other.
- Tone must be one of these when possible: Professional, Inspirational, Conversational, Bold, Educational, Story Driven.
- If the user gives a sensitive life topic, handle it with care and respect, but still stay concise.
- Your goal is to help them move forward and fill the project form, not keep them in endless brainstorming.
`;

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
    const messages = (body.messages || []) as ChatMessage[];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 450,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Here are 3 strong directions:\n1. A personal story-based book about your experience.\n2. A practical guide for readers facing the same challenge.\n3. A reflective memoir connecting lessons from the past to growth today.\n\nBest starting angle:\nBegin with the central life experience or lesson you most want readers to understand.\n\nTitle options:\n- Finding the Story Within\n- Lessons from the Life I Lived\n- The Path That Shaped Me\n\nBOOK IDEA SNAPSHOT\nTitle: Finding the Story Within\nBook Type: Memoir\nTarget Reader: Readers navigating personal growth, identity, or major life transitions.\nTone: Story Driven\nBook Description: This memoir explores a defining life experience and the lessons that came from it. It helps readers feel understood while offering reflection, perspective, and hope.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Book idea coach error:", error);

    return NextResponse.json(
      { error: "Could not generate book idea coaching response." },
      { status: 500 }
    );
  }
}
