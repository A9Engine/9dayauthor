import { NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TableOfContents,
  TextRun,
} from "docx";
import { buildManuscript } from "../../../lib/buildManuscript";

const PAGE_SIZE_6X9 = {
  width: 8640,
  height: 12960,
};

const STANDARD_MARGINS = {
  top: 720,
  bottom: 720,
  left: 900,
  right: 720,
};

const BACK_MATTER_TYPES = ["acknowledgments", "about_author", "what_comes_next"];

function splitParagraphs(content: string) {
  if (!content) return [];

  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function pageFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: "Georgia",
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function bodyParagraph(text: string, isFirstParagraph = false) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: {
      before: 0,
      after: 180,
      line: 276,
    },
    indent: {
      firstLine: isFirstParagraph ? 0 : 360,
    },
    children: [
      new TextRun({
        text,
        font: "Georgia",
        size: 22,
        color: "000000",
      }),
    ],
  });
}

function sectionHeading(
  title: string,
  useHeadingStyle = false,
  isChapter = false
) {
  return new Paragraph({
    heading: useHeadingStyle ? HeadingLevel.HEADING_1 : undefined,
    alignment: AlignmentType.CENTER,
    spacing: {
      before: isChapter ? 480 : 240,
      after: isChapter ? 240 : 160,
    },
    children: [
      new TextRun({
        text: title,
        font: "Georgia",
        size: isChapter ? 36 : 28,
        bold: true,
        color: "000000",
      }),
    ],
  });
}

function makeDocxSection(children: any[], showFooter = true) {
  return {
    properties: {
      page: {
        size: PAGE_SIZE_6X9,
        margin: STANDARD_MARGINS,
      },
    },
    ...(showFooter
      ? {
          footers: {
            default: pageFooter(),
          },
        }
      : {}),
    children,
  };
}

function buildTextSection({
  title,
  content,
  useHeadingStyle,
  isChapter,
}: {
  title: string;
  content: string;
  useHeadingStyle: boolean;
  isChapter: boolean;
}) {
  const children: Paragraph[] = [
    sectionHeading(title, useHeadingStyle, isChapter),
  ];

  splitParagraphs(content).forEach((paragraph, index) => {
    children.push(bodyParagraph(paragraph, index === 0));
  });

  return children;
}

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }

    const manuscript = await buildManuscript(projectId);

    const preTocMatter = manuscript.sections.filter(
      (section) =>
        section.type === "copyright" || section.type === "dedication"
    );

    const introduction = manuscript.sections.filter(
      (section) => section.type === "introduction"
    );

    const chapters = manuscript.sections.filter(
      (section) => section.type === "chapter"
    );

    const backMatter = manuscript.sections.filter((section) =>
      BACK_MATTER_TYPES.includes(section.type)
    );

    const sectionsArray: any[] = [];

    sectionsArray.push(
      makeDocxSection(
        [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2880, after: 288 },
            children: [
              new TextRun({
                text: manuscript.metadata.title,
                font: "Georgia",
                size: 48,
                bold: true,
                color: "000000",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 144, after: 1440 },
            children: [
              new TextRun({
                text: manuscript.metadata.authorName,
                font: "Georgia",
                size: 24,
                color: "000000",
              }),
            ],
          }),
        ],
        false
      )
    );

    preTocMatter.forEach((section) => {
      sectionsArray.push(
        makeDocxSection(
          buildTextSection({
            title: section.title,
            content: section.content,
            useHeadingStyle: false,
            isChapter: false,
          }),
          true
        )
      );
    });

    sectionsArray.push(
      makeDocxSection(
        [
          new TableOfContents("Contents", {
            hyperlink: false,
            headingStyleRange: "1-1",
          }),
        ],
        true
      )
    );

    introduction.forEach((section) => {
      sectionsArray.push(
        makeDocxSection(
          buildTextSection({
            title: section.title,
            content: section.content,
            useHeadingStyle: true,
            isChapter: false,
          }),
          true
        )
      );
    });

    chapters.forEach((section) => {
      sectionsArray.push(
        makeDocxSection(
          buildTextSection({
            title: section.title,
            content: section.content,
            useHeadingStyle: true,
            isChapter: true,
          }),
          true
        )
      );
    });

    backMatter.forEach((section) => {
      sectionsArray.push(
        makeDocxSection(
          buildTextSection({
            title: section.title,
            content: section.content,
            useHeadingStyle: true,
            isChapter: false,
          }),
          true
        )
      );
    });

    const doc = new Document({
      sections: sectionsArray,
    });

    const buffer = await Packer.toBuffer(doc);

    const fileName = `${manuscript.metadata.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_manuscript.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("DOCX EXPORT ERROR:", error);

    return NextResponse.json(
      {
        error: "Could not generate DOCX export.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}