import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type StructureChapter = {
  id?: string;
  chapter_number?: number;
  title?: string;
  description?: string;
  reader_outcome?: string;
};

function isExistingChapterId(value: unknown) {
  return (
    typeof value === "string" &&
    !value.startsWith("new-") &&
    !value.startsWith("blueprint-")
  );
}

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { data: project, error: fetchError } = await supabaseAdmin
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

    const { error: updateError } = await supabaseAdmin
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

export async function PUT(req: Request) {
  try {
    const { projectId, blueprint, chapters } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json(
        { error: "At least one chapter is required." },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("book_projects")
      .select("id, user_id, blueprint_output")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const cleanedChapters = chapters.map((chapter: StructureChapter, index: number) => ({
      id: chapter.id,
      chapter_number: index + 1,
      title: String(chapter.title || `Chapter ${index + 1}`).trim(),
      description: String(chapter.description || "").trim(),
      reader_outcome: String(chapter.reader_outcome || "").trim(),
    }));

    const existingBlueprint =
      blueprint && typeof blueprint === "object"
        ? blueprint
        : project.blueprint_output && typeof project.blueprint_output === "object"
        ? project.blueprint_output
        : {};

    const nextBlueprint = {
      ...existingBlueprint,
      recommended_chapter_count: cleanedChapters.length,
      chapters: cleanedChapters.map((chapter) => ({
        title: chapter.title,
        description: chapter.description,
        reader_outcome: chapter.reader_outcome,
      })),
    };

    const { error: blueprintError } = await supabaseAdmin
      .from("book_projects")
      .update({
        blueprint_output: nextBlueprint,
        status: "blueprint_created",
      })
      .eq("id", projectId);

    if (blueprintError) {
      console.error(blueprintError);
      return NextResponse.json(
        { error: "Could not save blueprint structure." },
        { status: 500 }
      );
    }

    const { data: existingChapters, error: existingError } = await supabaseAdmin
      .from("book_chapters")
      .select("id")
      .eq("project_id", projectId);

    if (existingError) {
      console.error(existingError);
      return NextResponse.json(
        { error: "Could not read existing chapters." },
        { status: 500 }
      );
    }

    const existingIds = new Set((existingChapters || []).map((chapter) => chapter.id));
    const submittedExistingIds = new Set(
      cleanedChapters
        .filter((chapter) => isExistingChapterId(chapter.id) && existingIds.has(chapter.id))
        .map((chapter) => chapter.id as string)
    );

    const idsToDelete = [...existingIds].filter((id) => !submittedExistingIds.has(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("book_chapters")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.error(deleteError);
        return NextResponse.json(
          { error: "Could not delete removed chapters." },
          { status: 500 }
        );
      }
    }

    const savedChapters = [];

    for (const chapter of cleanedChapters) {
      if (isExistingChapterId(chapter.id) && existingIds.has(chapter.id)) {
        const { data, error } = await supabaseAdmin
          .from("book_chapters")
          .update({
            chapter_number: chapter.chapter_number,
            title: chapter.title,
            description: chapter.description,
            reader_outcome: chapter.reader_outcome,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chapter.id)
          .select("id, chapter_number, title, description, reader_outcome")
          .single();

        if (error || !data) {
          console.error(error);
          return NextResponse.json(
            { error: "Could not update chapter structure." },
            { status: 500 }
          );
        }

        savedChapters.push(data);
        continue;
      }

      const { data, error } = await supabaseAdmin
        .from("book_chapters")
        .insert({
          user_id: project.user_id,
          project_id: projectId,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          description: chapter.description,
          reader_outcome: chapter.reader_outcome,
          content: "",
          status: "draft",
        })
        .select("id, chapter_number, title, description, reader_outcome")
        .single();

      if (error || !data) {
        console.error(error);
        return NextResponse.json(
          { error: "Could not create chapter structure." },
          { status: 500 }
        );
      }

      savedChapters.push(data);
    }

    savedChapters.sort((a, b) => a.chapter_number - b.chapter_number);

    return NextResponse.json({
      success: true,
      blueprint: nextBlueprint,
      chapters: savedChapters,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong saving book structure." },
      { status: 500 }
    );
  }
}
