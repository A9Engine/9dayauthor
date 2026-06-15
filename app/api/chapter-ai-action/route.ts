import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildPrompt(action: string) {
  switch (action) {
    case "expand":
    case "expandIdeas":
      return `
Expand the selected writing naturally.

Rules:
- Do NOT use em dashes
- Do NOT sound like AI
- Do NOT overwrite the author's original work
- Add depth, clarity, examples, and useful detail
- Keep the author's voice
- Use grounded, human language
- Return only the suggested text
`;

    case "add_emotion":
    case "addEmotion":
      return `
Add emotional depth to the selected writing.

Rules:
- Do NOT use em dashes
- Do NOT make it melodramatic
- Add believable vulnerability, tension, reflection, or honesty
- Keep the author's voice
- Do NOT rewrite everything
- Return only the suggested text
`;

    case "generate_outline":
    case "generateOutline":
      return `
You are an elite nonfiction developmental editor helping an author continue writing their book.

Your job is NOT to create a generic outline.

Your job is to identify what THIS chapter still needs in order to become a compelling, emotionally engaging chapter that fits the rest of the manuscript.

Use the current manuscript as the primary voice sample.

If the current chapter has little or no manuscript content, use the previous chapter voice sample to match the author’s tone, rhythm, emotional style, and book direction.

If the manuscript contains personal experiences, themes, stories, emotional threads, or repeated ideas, build from those instead of inventing generic examples.

If there is limited manuscript content, infer tone from the chapter title, chapter direction, and reader outcome.

The book should feel authentic, human, reflective, and transformational.

Rules:
- Match the author's voice and emotional tone.
- Think like an experienced developmental editor, not a teacher.
- Help the author continue writing THIS specific book.
- Do NOT generate advice that could apply equally to any book.
- Do NOT invent generic placeholder examples when manuscript-specific suggestions are possible.- Do NOT suggest topics unrelated to the chapter direction.
- Do NOT introduce concepts that have not been established by the manuscript.
- Do NOT sound academic.
- Do NOT sound corporate.
- Do NOT sound like ChatGPT.
- Do NOT use Markdown symbols.
- Do NOT use ### headings.
- Do NOT use Roman numerals.
- Do NOT use numbered lists.
- Do NOT use bold formatting.
- Avoid generic examples such as:
  - "a health scare"
  - "job loss"
  - "a sudden move"
  - "someone you know"
  - "historical examples"
  - "case studies"
  unless those topics already appear in the author's manuscript.
- Avoid phrases such as:
  - "psychological impact"
  - "define"
  - "explore the concept of"
  - "time management"
  unless they clearly fit the author's existing writing.

The reader should feel that the suggestions came from an editor who deeply understands the manuscript.

Book Continuity Rules:

- Use the previous chapter titles, directions, excerpts, and endings to understand the reader journey before suggesting what this chapter needs.
- When referencing previous chapters, be specific. Mention the actual prior chapter title, theme, phrase, struggle, or emotional lesson when possible.
- Avoid vague continuity phrases like "the previous chapter's theme" unless you also explain the specific theme.
- Do not say "perhaps" unless the manuscript does not provide enough context.
- If the previous chapters provide enough context, make confident editorial suggestions instead of generic possibilities.
- Analyze the voice, themes, stories, and lessons established in previous chapters.
- Treat this book as a cohesive manuscript, not a collection of independent chapters.
- Identify ideas introduced earlier that should be reinforced, challenged, expanded, or evolved.
- Suggest moments that create emotional continuity throughout the book.
- Avoid repeating lessons that were already fully explored in earlier chapters.
- If previous chapters contain specific stories, struggles, metaphors, or frameworks, consider how they could be revisited from a deeper perspective.
- The reader should feel as though each chapter naturally builds upon the last.

Return the response using EXACTLY this format:

What This Chapter Still Needs
- Explain what emotional or narrative elements would strengthen the chapter.

Moments to Explore
- Suggest 3 to 5 specific memories, stories, reflections, or scenes the author could include.
- For each moment, explain why it belongs in this chapter.
- Whenever possible, connect the moment to a specific prior chapter, theme, phrase, struggle, or insight.

Questions Worth Answering
- Provide 3 to 5 questions the author could answer to deepen the chapter.

Reader Transformation
- Explain how this chapter moves the reader forward from where the previous chapter left them.
- Describe the emotional and practical shift the reader should experience before entering the next chapter.

How This Chapter Could End
- Suggest a satisfying emotional ending that naturally transitions into the next chapter.

Return only the response.
`;

    case "continue_writing":
    case "continueWriting":
      return `
Continue the writing naturally from where it leaves off.

Rules:
- Do NOT use em dashes
- Do NOT repeat what is already written
- Match the author's tone
- Keep it grounded and human
- Return only the continuation
`;

    default:
      return "Help the author improve this chapter naturally.";
  }
}

export async function POST(req: Request) {
  try {
    const {
      action,
      chapterTitle,
      chapterDescription,
      readerOutcome,
      content,
      selectedText,
      previousChapterContent,
    } = await req.json();

    const systemPrompt = buildPrompt(action);
    const workingText = selectedText?.trim() || content?.trim() || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: action === "generate_outline" ? 0.5 : 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `
Chapter Title:
${chapterTitle || "Untitled Chapter"}

Chapter Direction:
${chapterDescription || "No chapter direction provided."}

Reader Outcome:
${readerOutcome || "No reader outcome provided."}

Current Chapter Manuscript:
${content?.slice(-8000) || "No current chapter content yet."}

Previous Chapter Voice Sample:
${previousChapterContent?.slice(-12000) || "No previous chapter content available."}

Text to Work On:
${workingText || "No selected text provided."}
`,
        },
      ],
    });

    const suggestionText = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      suggestionText,
      output: suggestionText,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "AI generation failed." },
      { status: 500 }
    );
  }
}