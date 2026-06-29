import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(value: string | null | undefined) {
  return String(value || "chapter")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function splitParagraphs(value: string | null | undefined) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const chapterId = url.searchParams.get("chapterId");

  if (!chapterId) {
    return Response.json({ error: "Missing chapterId" }, { status: 400 });
  }

  const { data: chapter, error } = await supabaseAdmin
    .from("book_chapters")
    .select("*")
    .eq("id", chapterId)
    .single();

  if (error || !chapter) {
    return Response.json({ error: "Chapter not found" }, { status: 404 });
  }

  const paragraphs = splitParagraphs(chapter.content);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1260,
              bottom: 1440,
              left: 1260,
            },
          },
        },
        children: [
          new Paragraph({
            text: `Chapter ${chapter.chapter_number}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
          }),
          new Paragraph({
            text: chapter.title || `Chapter ${chapter.chapter_number}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 420 },
          }),
          ...paragraphs.map(
            (paragraph) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph,
                    font: "Georgia",
                    size: 24,
                  }),
                ],
                spacing: { after: 260, line: 360 },
                indent: { firstLine: 360 },
              })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `chapter-${chapter.chapter_number}-${safeFilename(chapter.title)}.docx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
