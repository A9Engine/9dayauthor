import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

function cleanPrompt(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OpenAI API key." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const prompt = cleanPrompt(body.prompt);
    const title = cleanPrompt(body.title);
    const genre = cleanPrompt(body.genre);
    const coverFormat = cleanPrompt(body.coverFormat);
    const trimSize = cleanPrompt(body.trimSize);

    if (prompt.length < 8) {
      return NextResponse.json(
        {
          error:
            "Please enter a more descriptive background prompt before generating cover art.",
        },
        { status: 400 }
      );
    }

    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

    const backgroundPrompt = [
      "Create professional book cover background artwork only.",
      "This image will sit underneath real editable title and author text in a publishing app.",
      "Do not include any text, words, letters, numbers, logos, signatures, watermarks, book titles, subtitles, or author names.",
      "No typography of any kind.",
      "No readable symbols.",
      "Leave natural open visual space where title text can be placed later.",
      title ? `Book title context for mood only: ${title}.` : "",
      genre ? `Genre or style direction: ${genre}.` : "",
      coverFormat ? `Cover format context: ${coverFormat}.` : "",
      trimSize ? `Trim size context: ${trimSize}.` : "",
      `User visual direction: ${prompt}`,
      "High quality, polished, commercial book cover background, dramatic composition, clean professional artwork.",
    ]
      .filter(Boolean)
      .join(" ");

    const response = await openai.images.generate({
      model: imageModel,
      prompt: backgroundPrompt,
      size: "1024x1536",
      n: 1,
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    const imageUrl = response.data?.[0]?.url;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: "Image generation completed, but no image was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageBase64,
      imageUrl,
      imageDataUrl: imageBase64
        ? `data:image/png;base64,${imageBase64}`
        : imageUrl,
    });
  } catch (error: unknown) {
    console.error("Cover background generation error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong generating the cover background.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}