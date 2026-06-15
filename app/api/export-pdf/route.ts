import { NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import { PDFDocument } from "pdf-lib";
import { readFile } from "fs/promises";
import { buildManuscript } from "@/lib/buildManuscript";
import path from "path";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderParagraphs(content: string | null | undefined) {
  if (!content) return "";

  return content
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function shouldIncludeInToc(section: any) {
  return [
    "introduction",
    "chapter",
    "acknowledgments",
    "about_author",
    "what_comes_next",
  ].includes(section.type);
}

function getDisplayTitle(section: any) {
  if (section.type === "introduction") return section.title || "Introduction";
  if (section.type === "chapter") return section.title || "Chapter";
  if (section.type === "acknowledgments") return section.title || "Acknowledgments";
  if (section.type === "about_author") return section.title || "About the Author";
  if (section.type === "what_comes_next") return section.title || "What Comes Next";

  return section.title || "";
}

function getSectionId(section: any, index: number) {
  return `${section.type}-${index}-${slugify(getDisplayTitle(section))}`;
}

function renderToc(manuscript: any) {
  const tocEntries = manuscript.sections
    .map((section: any, index: number) => {
      if (!shouldIncludeInToc(section)) return null;

      const id = getSectionId(section, index);
      const title = getDisplayTitle(section);

      return `
  <div class="toc-row" data-target="#${id}">
    <span class="toc-title">${escapeHtml(title)}</span>
  </div>
`;
    })
    .filter(Boolean)
    .join("");

  return `
    <section class="toc-page">
      <h1>Table of Contents</h1>
      <div class="toc-list">
        ${tocEntries}
      </div>
    </section>
  `;
}

function renderSection(section: any, manuscript: any, index: number) {
  const title = escapeHtml(getDisplayTitle(section));
  const id = shouldIncludeInToc(section) ? getSectionId(section, index) : "";

  switch (section.type) {
    case "title_page":
      return `
        <section class="title-page">
          <div>
            <h1>${escapeHtml(manuscript.metadata.title)}</h1>
            <p class="author">${escapeHtml(manuscript.metadata.authorName)}</p>
          </div>
        </section>
      `;

    case "copyright":
      return `
        <section class="section-page copyright-page">
          ${title ? `<h1>${title}</h1>` : ""}
          ${renderParagraphs(section.content)}
        </section>
      `;

    case "dedication":
      return `
        <section class="section-page dedication-page">
          ${title ? `<h1>${title}</h1>` : ""}
          ${renderParagraphs(section.content)}
        </section>
        ${renderToc(manuscript)}
      `;

    case "introduction":
    case "acknowledgments":
    case "about_author":
    case "what_comes_next":
      return `
        <section id="${id}" class="section-page">
          ${title ? `<h1>${title}</h1>` : ""}
          ${renderParagraphs(section.content)}
        </section>
      `;

    case "chapter": {
  const firstChapterIndex = manuscript.sections.findIndex(
    (item: any) => item.type === "chapter"
  );

  const isFirstChapter = index === firstChapterIndex;

  return `
    <section id="${id}" class="chapter-page ${isFirstChapter ? "first-chapter-page" : ""}">
      <h1>${title}</h1>
      ${renderParagraphs(section.content)}
    </section>
  `;
}

    default:
      return `
        <section class="section-page">
          ${title ? `<h1>${title}</h1>` : ""}
          ${renderParagraphs(section.content)}
        </section>
      `;
  }
}

function manuscriptToHtml(manuscript: any) {
  const sectionsHtml = manuscript.sections
    .map((section: any, index: number) => renderSection(section, manuscript, index))
    .join("");

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(manuscript.metadata.title)}</title>

  <style>
    @page {
      size: 6in 9in;
      margin: 0.75in 0.65in 0.75in 0.75in;

      @bottom-center {
        content: counter(page);
        font-family: Georgia, serif;
        font-size: 10pt;
      }
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      font-family: Georgia, serif;
      font-size: 11pt;
      line-height: 1.15;
      color: #111;
      background: white;
    }

    p {
      margin: 0 0 0.2in 0;
      text-indent: 0.25in;
      orphans: 2;
      widows: 2;
    }

    h1 {
      font-size: 18pt;
      font-weight: normal;
      text-align: center;
      margin: 0 0 0.45in 0;
      break-after: avoid;
    }

    .title-page,
    .section-page,
    .chapter-page,
    .toc-page {
      break-before: page;
    }
    .first-chapter-page {
    break-before: right;
    }  

    .title-page {
  height: 7.5in;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  break-after: page;
  padding-top: 1.35in;
}

    .title-page h1 {
      font-size: 26pt;
      margin-bottom: 0.35in;
    }

    .title-page .author {
      text-indent: 0;
      font-size: 14pt;
    }

    .chapter-page h1 {
      margin-top: 1.2in;
      margin-bottom: 0.6in;
    }

    .chapter-page h1 + p,
    .section-page h1 + p {
      text-indent: 0;
    }

    .toc-page h1 {
      margin-top: 0.45in;
      margin-bottom: 0.5in;
    }

    .toc-list {
      width: 100%;
      margin-top: 0.2in;
    }

    .toc-row {
  display: flex;
  align-items: baseline;
  width: 100%;
  margin-bottom: 0.14in;
  font-size: 11pt;
  color: #111;
}

.toc-row::before {
  content: "";
  flex: 1;
  order: 2;
  border-bottom: 1px dotted #555;
  margin: 0 0.08in;
  transform: translateY(-0.05in);
}

.toc-row::after {
  content: target-counter(attr(data-target), page);
  order: 3;
  min-width: 0.3in;
  text-align: right;
}

.toc-title {
  order: 1;
  white-space: nowrap;
}
  </style>
</head>

<body>
  ${sectionsHtml}
</body>
</html>
`;
}

async function loadPagedJsScript() {
  const pagedJsPath = path.join(
    process.cwd(),
    "node_modules",
    "pagedjs",
    "dist",
    "paged.polyfill.js"
  );

  return await readFile(pagedJsPath, "utf8");
}

async function renderPdfWithPagedJs(page: any, html: string) {
  const pagedJsScript = await loadPagedJsScript();

  await page.setViewport({
    width: 576,
    height: 864,
    deviceScaleFactor: 1,
  });

  await page.setContent(html, {
    waitUntil: "domcontentloaded",
  });

  await page.addScriptTag({
    content: `
      window.PagedConfig = {
        auto: false
      };
    `,
  });

  await page.addScriptTag({
    content: pagedJsScript,
  });

  await page.evaluate(async () => {
    const win = window as any;

    if (!win.PagedPolyfill) {
      throw new Error("Paged.js did not load.");
    }

    await win.PagedPolyfill.preview();
  });

  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  });

  return await page.pdf({
    width: "6in",
    height: "9in",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: {
      top: "0in",
      right: "0in",
      bottom: "0in",
      left: "0in",
    },
  });
}

async function getPdfPageCount(pdfBuffer: Uint8Array) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "Missing required projectId" },
      { status: 400 }
    );
  }

  let browser: Browser | null = null;

  try {
    const manuscript = await buildManuscript(projectId);
    const html = manuscriptToHtml(manuscript);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const pdfBuffer = await renderPdfWithPagedJs(page, html);
    const officialPageCount = await getPdfPageCount(pdfBuffer);

    const { error: updateError } = await supabaseAdmin
  .from("book_projects")
  .update({
    compiled_page_count: officialPageCount,
    compiled_at: new Date().toISOString(),
    compiled_trim_size: "6x9",
    compiled_format: "paperback",
  })
  .eq("id", projectId);

if (updateError) {
  console.error(
    "Failed to save compiled book metadata:",
    updateError
  );
}

    console.log("Official PDF page count with Paged.js:", officialPageCount);

    await browser.close();

    const filename = `${manuscript.metadata.title || "manuscript"}`
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (browser) await browser.close();

    console.error("PDF export failed:", error);

    return Response.json(
      { error: "PDF export failed" },
      { status: 500 }
    );
  }
}