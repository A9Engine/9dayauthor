import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import { PDFDocument } from "pdf-lib";
import { readFile } from "fs/promises";
import { buildManuscript } from "@/lib/buildManuscript";
import path from "path";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

async function launchBrowser() {
  if (process.env.VERCEL) {
    const puppeteerCore = await import("puppeteer-core");
    const chrome = chromium as any;

    return puppeteerCore.default.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
    });
  }

  const puppeteer = await import("puppeteer");

  return puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PrintTrimSizeKey = "5x8" | "5.5x8.5" | "6x9";

type PrintTrimLayout = {
  key: PrintTrimSizeKey;
  widthIn: number;
  heightIn: number;
};

const PRINT_TRIM_LAYOUTS: Record<PrintTrimSizeKey, PrintTrimLayout> = {
  "5x8": { key: "5x8", widthIn: 5, heightIn: 8 },
  "5.5x8.5": { key: "5.5x8.5", widthIn: 5.5, heightIn: 8.5 },
  "6x9": { key: "6x9", widthIn: 6, heightIn: 9 },
};

function normalizePrintTrimSize(value: unknown): PrintTrimSizeKey {
  if (value === "5x8" || value === "5 x 8") return "5x8";
  if (value === "5.5x8.5" || value === "5.5 x 8.5") return "5.5x8.5";
  return "6x9";
}

function getPrintTrimLayout(value: unknown): PrintTrimLayout {
  const key = normalizePrintTrimSize(value);
  return PRINT_TRIM_LAYOUTS[key];
}

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
        <section id="${id}" class="chapter-page ${
        isFirstChapter ? "first-chapter-page" : ""
      }">
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

function manuscriptToHtml(
  manuscript: any,
  trimLayout: PrintTrimLayout,
  fontFamily: string = "classic_serif"
) {
  const bodyFont =
  fontFamily === "modern_serif"
    ? '"Libre Baskerville", Georgia, serif'
    : fontFamily === "clean_sans"
    ? 'Arial, Helvetica, sans-serif'
    : '"Libre Baskerville", Georgia, serif';
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
  @font-face {
  font-family: "Libre Baskerville";
  src: url("https://www.9dayauthor.com/fonts/LibreBaskerville-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: "Libre Baskerville";
  src: url("https://www.9dayauthor.com/fonts/LibreBaskerville-Bold.woff2") format("woff2");
  font-weight: 700 900;
  font-style: normal;
}

@font-face {
  font-family: "Libre Baskerville";
  src: url("https://www.9dayauthor.com/fonts/LibreBaskerville-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
}
    @page {
      size: ${trimLayout.widthIn}in ${trimLayout.heightIn}in;
      margin: 0.75in 0.65in 0.75in 0.75in;

      @bottom-center {
        content: counter(page);
        font-family: ${bodyFont};
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
      font-family: ${bodyFont};
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
      height: ${trimLayout.heightIn - 1.5}in;
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

async function renderPdfWithPagedJs(page: any, html: string, trimLayout: PrintTrimLayout) {
  const pagedJsScript = await loadPagedJsScript();

  await page.setViewport({
    width: Math.round(trimLayout.widthIn * 96),
    height: Math.round(trimLayout.heightIn * 96),
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
    width: `${trimLayout.widthIn}in`,
    height: `${trimLayout.heightIn}in`,
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

  let browser: any = null;

  try {
    const { data: projectSettings, error: projectSettingsError } =
      await supabaseAdmin
        .from("book_projects")
        .select("compiled_trim_size, compiled_font_family")
        .eq("id", projectId)
        .maybeSingle();

    if (projectSettingsError) {
      console.error("Failed to load trim size setting:", projectSettingsError);
    }

    const trimLayout = getPrintTrimLayout(projectSettings?.compiled_trim_size);

    const manuscript = await buildManuscript(projectId);
    const html = manuscriptToHtml(
  manuscript,
  trimLayout,
  projectSettings?.compiled_font_family
);

    browser = await launchBrowser();

    const page = await browser.newPage();

    const pdfBuffer = await renderPdfWithPagedJs(page, html, trimLayout);
    const officialPageCount = await getPdfPageCount(pdfBuffer);

    const { error: updateError } = await supabaseAdmin
      .from("book_projects")
      .update({
        compiled_page_count: officialPageCount,
        compiled_at: new Date().toISOString(),
        compiled_trim_size: trimLayout.key,
        compiled_format: "paperback",
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Failed to save compiled book metadata:", updateError);
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