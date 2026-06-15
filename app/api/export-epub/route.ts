import { NextRequest } from "next/server";
import JSZip from "jszip";
import { buildManuscript } from "@/lib/buildManuscript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeXml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function slugify(value: string) {
  return String(value || "section")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderParagraphs(content: string | null | undefined) {
  if (!content) return "";

  return content
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeXml(p.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function shouldInclude(section: any) {
  return section?.type !== "title_page" && section?.type !== "copyright";
}

function getTitle(section: any, manuscript: any, index: number) {
  if (section.type === "introduction") return section.title || "Introduction";
  if (section.type === "chapter") return section.title || `Chapter ${index + 1}`;
  if (section.type === "dedication") return section.title || "Dedication";
  if (section.type === "acknowledgments") return section.title || "Acknowledgments";
  if (section.type === "about_author") return section.title || "About the Author";
  if (section.type === "what_comes_next") return section.title || "What Comes Next";
  return section.title || manuscript.metadata.title || "Section";
}

function createXhtml({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/book.css" />
</head>
<body>
  ${body}
</body>
</html>`;
}

function createNcx({
  bookTitle,
  authorName,
  identifier,
  sectionFiles,
}: {
  bookTitle: string;
  authorName: string;
  identifier: string;
  sectionFiles: any[];
}) {
  const navPoints = [
    {
      id: "navpoint-title",
      label: "Beginning",
      href: "text/title.xhtml",
    },
    {
      id: "navpoint-toc",
      label: "Table of Contents",
      href: "toc.xhtml",
    },
    ...sectionFiles.map((item, index) => ({
      id: `navpoint-${index + 1}`,
      label: item.title,
      href: `text/${item.filename}`,
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(identifier)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>

  <docTitle>
    <text>${escapeXml(bookTitle)}</text>
  </docTitle>

  <docAuthor>
    <text>${escapeXml(authorName)}</text>
  </docAuthor>

  <navMap>
    ${navPoints
      .map(
        (point, index) => `
    <navPoint id="${point.id}" playOrder="${index + 1}">
      <navLabel>
        <text>${escapeXml(point.label)}</text>
      </navLabel>
      <content src="${escapeXml(point.href)}"/>
    </navPoint>`
      )
      .join("")}
  </navMap>
</ncx>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  try {
    const manuscript = await buildManuscript(projectId);

    const bookTitle = manuscript.metadata.title || "Untitled Book";
    const authorName = manuscript.metadata.authorName || "Author";
    const identifier = `urn:uuid:${projectId}`;

    const zip = new JSZip();

    zip.file("mimetype", "application/epub+zip", {
      compression: "STORE",
    });

    zip.file(
      "META-INF/container.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    zip.file(
      "OEBPS/styles/book.css",
      `
body {
  font-family: Georgia, serif;
  line-height: 1.45;
  color: #111;
}

h1 {
  text-align: center;
  margin: 2em 0 1.2em;
  font-weight: normal;
}

p {
  margin: 0 0 1em;
  text-indent: 1.5em;
}

h1 + p {
  text-indent: 0;
}

.title-page {
  text-align: center;
  margin-top: 25%;
}

.title-page .author {
  text-indent: 0;
  margin-top: 2em;
}

.toc-list {
  margin-top: 2em;
}

.toc-list li {
  margin-bottom: 0.7em;
}

.toc-list a {
  color: #111;
  text-decoration: none;
}
`
    );

    const readableSections = manuscript.sections.filter(shouldInclude);

    const sectionFiles = readableSections.map((section: any, index: number) => {
      const title = getTitle(section, manuscript, index);
      const filename = `section-${String(index + 1).padStart(3, "0")}-${slugify(
        title
      )}.xhtml`;

      return {
        id: `section-${index + 1}`,
        title,
        filename,
        section,
      };
    });

    const titlePageBody = `
<section class="title-page">
  <h1>${escapeXml(bookTitle)}</h1>
  <p class="author">${escapeXml(authorName)}</p>
</section>`;

    zip.file(
      "OEBPS/text/title.xhtml",
      createXhtml({
        title: bookTitle,
        body: titlePageBody,
      })
    );

    const tocBody = `
<nav epub:type="toc" id="toc">
  <h1>Table of Contents</h1>
  <ol class="toc-list">
    ${sectionFiles
      .map(
        (item) =>
          `<li><a href="text/${item.filename}">${escapeXml(item.title)}</a></li>`
      )
      .join("\n")}
  </ol>
</nav>

<nav epub:type="landmarks" hidden="">
  <h2>Landmarks</h2>
  <ol>
    <li><a epub:type="bodymatter" href="text/${sectionFiles[0]?.filename || ""}">Start</a></li>
  </ol>
</nav>`;

    zip.file(
      "OEBPS/toc.xhtml",
      createXhtml({
        title: "Table of Contents",
        body: tocBody,
      })
    );
    zip.file(
  "OEBPS/toc.ncx",
  createNcx({
    bookTitle,
    authorName,
    identifier,
    sectionFiles,
  })
);

    sectionFiles.forEach((item) => {
      const body = `
<section>
  <h1>${escapeXml(item.title)}</h1>
  ${renderParagraphs(item.section.content)}
</section>`;

      zip.file(
        `OEBPS/text/${item.filename}`,
        createXhtml({
          title: item.title,
          body,
        })
      );
    });

    const manifestItems = [
      `<item id="css" href="styles/book.css" media-type="text/css"/>`,
      `<item id="title-page" href="text/title.xhtml" media-type="application/xhtml+xml"/>`,
      `<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
      `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
      ...sectionFiles.map(
        (item) =>
          `<item id="${item.id}" href="text/${item.filename}" media-type="application/xhtml+xml"/>`
      ),
    ].join("\n    ");

    const spineItems = [
      `<itemref idref="title-page"/>`,
      `<itemref idref="toc"/>`,
      ...sectionFiles.map((item) => `<itemref idref="${item.id}"/>`),
    ].join("\n    ");

    zip.file(
      "OEBPS/content.opf",
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(bookTitle)}</dc:title>
    <dc:creator>${escapeXml(authorName)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date()
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>

  <manifest>
    ${manifestItems}
  </manifest>

  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`
    );

    const epubBuffer = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
    });

    const filename = `${bookTitle}`
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    return new Response(Buffer.from(epubBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${filename}.epub"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EPUB export failed:", error);

    return Response.json(
      { error: "EPUB export failed" },
      { status: 500 }
    );
  }
}