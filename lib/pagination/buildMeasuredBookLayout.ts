import {
  getBookLayoutConfig,
  getFontFamilyValue,
  getLineHeightValue,
  normalizeTrimSize,
  type BookLineSpacingKey,
  type TrimSizeKey,
} from "../bookLayoutConfig";

import type { BookContentBlock } from "../buildBookContentBlocks";

export type MeasuredPageType =
  | "title_page"
  | "copyright"
  | "dedication"
  | "table_of_contents"
  | "introduction"
  | "chapter_first"
  | "chapter_body"
  | "acknowledgments"
  | "about_author"
  | "what_comes_next"
  | "section"
  | "blank";

export type MeasuredBookPage = {
  id: string;
  pageNumber: number;
  displayPageNumber: string;
  type: MeasuredPageType;
  title: string;
  label: string;
  contentHtml: string;
  sourceBlockId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  isLeftPage: boolean;
};

export type MeasuredBookSpread = {
  leftPage: MeasuredBookPage | null;
  rightPage: MeasuredBookPage | null;
};

export type TocRow = {
  id: string;
  title: string;
  pageNumber: number;
};

export type MeasuredBookLayout = {
  trimSize: TrimSizeKey;
  pages: MeasuredBookPage[];
  spreads: MeasuredBookSpread[];
  tocRows: TocRow[];
  interiorPageCount: number;
};

export type BuildMeasuredBookLayoutInput = {
  blocks: BookContentBlock[];
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitParagraphs(text: string) {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getMeasuredPageType(
  block: BookContentBlock,
  isFirstPageForBlock: boolean
): MeasuredPageType {
  if (block.type === "chapter") {
    return isFirstPageForBlock ? "chapter_first" : "chapter_body";
  }

  if (block.type === "title_page") return "title_page";
  if (block.type === "copyright") return "copyright";
  if (block.type === "dedication") return "dedication";
  if (block.type === "table_of_contents") return "table_of_contents";
  if (block.type === "introduction") return "introduction";
  if (block.type === "acknowledgments") return "acknowledgments";
  if (block.type === "about_author") return "about_author";
  if (block.type === "what_comes_next") return "what_comes_next";

  return "section";
}

function shouldDisplayPageNumber(type: MeasuredPageType) {
  return type !== "title_page" && type !== "blank";
}

function createSpreads(pages: MeasuredBookPage[]) {
  const spreads: MeasuredBookSpread[] = [];

  for (let index = 0; index < pages.length; index += 2) {
    const leftPage = pages[index] || null;
    const rightPage = pages[index + 1] || null;

    spreads.push({
      leftPage,
      rightPage,
    });
  }

  return spreads;
}

function buildTitlePageHtml(title: string, authorName?: string) {
  return `
    <div class="book-title-page">
      <h1>${escapeHtml(title)}</h1>
      ${
        authorName
          ? `<div class="book-title-rule"></div><p>${escapeHtml(authorName)}</p>`
          : ""
      }
    </div>
  `;
}

function buildTocHtml(tocRows: TocRow[]) {
  if (!tocRows.length) {
    return `
      <div class="book-section-heading">
        <div class="book-section-label">Table of Contents</div>
        <h1>Contents</h1>
      </div>
      <p>Chapters will appear here after they are created.</p>
    `;
  }

  return `
    <div class="book-section-heading">
      <div class="book-section-label">Table of Contents</div>
      <h1>Contents</h1>
    </div>
    <div class="book-toc-list">
      ${tocRows
        .map(
          (row) => `
            <div class="book-toc-row">
              <span class="book-toc-title">${escapeHtml(row.title)}</span>
              <span class="book-toc-dots"></span>
              <span class="book-toc-page">${row.pageNumber}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function buildBlockHeaderHtml(block: BookContentBlock) {
  if (block.type === "chapter") {
    return `
      <div class="book-chapter-heading">
        <div class="book-chapter-label">Chapter ${block.chapterNumber || ""}</div>
        <h1>${escapeHtml(block.title)}</h1>
        <div class="book-chapter-rule"></div>
      </div>
    `;
  }

  if (block.type === "dedication") {
    return `
      <div class="book-section-heading">
        <h1>${escapeHtml(block.title)}</h1>
      </div>
    `;
  }

  if (
    block.type === "copyright" ||
    block.type === "introduction" ||
    block.type === "acknowledgments" ||
    block.type === "about_author" ||
    block.type === "what_comes_next" ||
    block.type === "section"
  ) {
    return `
      <div class="book-section-heading">
        <h1>${escapeHtml(block.title)}</h1>
      </div>
    `;
  }

  return "";
}

function createParagraphElement(paragraph: string) {
  const p = document.createElement("p");
  p.textContent = paragraph;
  return p;
}

function applySandboxStyles({
  sandbox,
  contentWrapper,
  trimSize,
  fontFamily,
  lineSpacing,
  pageType,
  isLeftPage,
}: {
  sandbox: HTMLDivElement;
  contentWrapper: HTMLDivElement;
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
  pageType: MeasuredPageType;
  isLeftPage: boolean;
}) {
  const config = getBookLayoutConfig(trimSize);
  const resolvedFontFamily = getFontFamilyValue(fontFamily);
  const resolvedLineHeight = getLineHeightValue(lineSpacing);

  const paddingLeft = isLeftPage
    ? config.marginOutsideIn
    : config.marginInsideIn;

  const paddingRight = isLeftPage
    ? config.marginInsideIn
    : config.marginOutsideIn;

  sandbox.style.position = "absolute";
  sandbox.style.visibility = "hidden";
  sandbox.style.pointerEvents = "none";
  sandbox.style.left = "-99999px";
  sandbox.style.top = "0";
  sandbox.style.width = `${config.pageWidthIn}in`;
  sandbox.style.height = `${config.pageHeightIn}in`;
  sandbox.style.boxSizing = "border-box";
  sandbox.style.background = "white";
  sandbox.style.overflow = "hidden";
  sandbox.style.paddingTop = `${config.marginTopIn}in`;
  sandbox.style.paddingBottom = `${
    config.marginBottomIn + config.footerHeightIn + config.footerGapIn
  }in`;
  sandbox.style.paddingLeft = `${paddingLeft}in`;
  sandbox.style.paddingRight = `${paddingRight}in`;

  contentWrapper.style.width = "100%";
  contentWrapper.style.height = "100%";
  contentWrapper.style.overflow = "hidden";
  contentWrapper.style.boxSizing = "border-box";
  contentWrapper.style.fontFamily = resolvedFontFamily;
  contentWrapper.style.fontSize = `${config.bodyFontSizePt}pt`;
  contentWrapper.style.lineHeight = String(resolvedLineHeight);
  contentWrapper.style.color = "#111";
  contentWrapper.style.textAlign = "justify";

  const style = document.createElement("style");
  style.innerHTML = `
    .book-title-page {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: 1.35in;
      text-align: center;
    }

    .book-title-page h1 {
      font-size: 30pt;
      line-height: 1.15;
      margin: 0;
      max-width: 80%;
    }

    .book-title-page p {
      margin: 0;
      font-size: 13pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-align: center;
    }

    .book-title-rule {
      width: 0.75in;
      height: 1px;
      background: #999;
      margin: 0.65in 0 0.45in;
    }

    .book-dedication-page {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
}

    .book-dedication-page h1 {
      font-size: 18pt;
      line-height: 1.3;
      margin: 0;
}

    .book-chapter-heading {
      text-align: center;
      margin-top: ${config.chapterFirstPageTopSpaceIn}in;
      margin-bottom: 0.35in;
    }

    .book-chapter-label {
      font-size: 9pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #777;
      margin-bottom: 0.16in;
    }

    .book-chapter-heading h1 {
      font-size: 24pt;
      line-height: 1.15;
      margin: 0;
    }

    .book-chapter-rule {
      width: 0.55in;
      height: 2px;
      background: #6a4cff;
      margin: 0.28in auto 0;
    }

    .book-section-heading {
      text-align: center;
      margin-top: ${config.sectionFirstPageTopSpaceIn}in;
      margin-bottom: 0.35in;
    }

    .book-section-label {
      font-size: 8.5pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #777;
      margin-bottom: 0.14in;
    }

    .book-section-heading h1 {
      font-size: 21pt;
      line-height: 1.2;
      margin: 0;
    }

    p {
      margin: 0 0 0.13in;
      text-indent: ${pageType === "chapter_first" || pageType === "chapter_body" ? "0.22in" : "0"};
    }

    .book-toc-list {
      margin-top: 0.35in;
    }

    .book-toc-row {
      display: flex;
      align-items: flex-end;
      gap: 0.08in;
      margin-bottom: 0.12in;
      font-size: 10.5pt;
      line-height: 1.35;
      text-align: left;
    }

    .book-toc-title {
      max-width: 75%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .book-toc-dots {
      flex: 1;
      border-bottom: 1px dotted #888;
      transform: translateY(-0.05in);
    }

    .book-toc-page {
      min-width: 0.25in;
      text-align: right;
    }
  `;

  sandbox.appendChild(style);
}

function overflows(contentWrapper: HTMLDivElement) {
  return contentWrapper.scrollHeight > contentWrapper.clientHeight + 1;
}

function finalizePage({
  pageNumber,
  block,
  pageType,
  contentHtml,
}: {
  pageNumber: number;
  block: BookContentBlock;
  pageType: MeasuredPageType;
  contentHtml: string;
}): MeasuredBookPage {
  return {
    id: `${block.id}-page-${pageNumber}`,
    pageNumber,
    displayPageNumber: shouldDisplayPageNumber(pageType) ? String(pageNumber) : "",
    type: pageType,
    title: block.title,
    label:
      block.type === "chapter"
        ? `Chapter ${block.chapterNumber || ""}`
        : block.title,
    contentHtml,
    sourceBlockId: block.sourceId,
    chapterNumber: block.chapterNumber,
    chapterTitle: block.type === "chapter" ? block.title : undefined,
    isLeftPage: pageNumber % 2 === 0,
  };
}

function paginateTextBlock({
  block,
  startPageNumber,
  trimSize,
  fontFamily,
  lineSpacing,
}: {
  block: BookContentBlock;
  startPageNumber: number;
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
}) {
  const pages: MeasuredBookPage[] = [];
  const paragraphs = splitParagraphs(block.content);

  let pageNumber = startPageNumber;
  let paragraphIndex = 0;
  let isFirstPageForBlock = true;

  while (paragraphIndex < paragraphs.length || isFirstPageForBlock) {
    const pageType = getMeasuredPageType(block, isFirstPageForBlock);
    const sandbox = document.createElement("div");
    const contentWrapper = document.createElement("div");

    applySandboxStyles({
      sandbox,
      contentWrapper,
      trimSize,
      fontFamily,
      lineSpacing,
      pageType,
      isLeftPage: pageNumber % 2 === 0,
    });

    sandbox.appendChild(contentWrapper);
    document.body.appendChild(sandbox);

    if (isFirstPageForBlock) {
      if (block.type === "title_page") {
        contentWrapper.innerHTML = buildTitlePageHtml(
          block.title,
          block.content.split(/\n+/).filter(Boolean)[1]
        );

        pages.push(
          finalizePage({
            pageNumber,
            block,
            pageType,
            contentHtml: contentWrapper.innerHTML,
          })
        );

        document.body.removeChild(sandbox);
        return {
          pages,
          nextPageNumber: pageNumber + 1,
        };
      }

      contentWrapper.innerHTML = buildBlockHeaderHtml(block);
    }

    let addedSomething = false;

    while (paragraphIndex < paragraphs.length) {
      const paragraph = paragraphs[paragraphIndex];
      const paragraphElement = createParagraphElement(paragraph);
      contentWrapper.appendChild(paragraphElement);

      if (!overflows(contentWrapper)) {
        paragraphIndex += 1;
        addedSomething = true;
        continue;
      }

      contentWrapper.removeChild(paragraphElement);

      const words = paragraph.split(/\s+/).filter(Boolean);
      let fittedWords: string[] = [];

      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        fittedWords.push(words[wordIndex]);

        const testParagraph = createParagraphElement(fittedWords.join(" "));
        contentWrapper.appendChild(testParagraph);

        const didOverflow = overflows(contentWrapper);
        contentWrapper.removeChild(testParagraph);

        if (didOverflow) {
          fittedWords.pop();
          break;
        }
      }

      if (fittedWords.length) {
        const fittedParagraph = createParagraphElement(fittedWords.join(" "));
        contentWrapper.appendChild(fittedParagraph);

        paragraphs[paragraphIndex] = words.slice(fittedWords.length).join(" ");
        addedSomething = true;
      }

      break;
    }

    if (!addedSomething && !contentWrapper.innerHTML.trim()) {
  contentWrapper.innerHTML = buildBlockHeaderHtml(block);
}

    pages.push(
      finalizePage({
        pageNumber,
        block,
        pageType,
        contentHtml: contentWrapper.innerHTML,
      })
    );

    document.body.removeChild(sandbox);

    pageNumber += 1;
    isFirstPageForBlock = false;
  }

  return {
    pages,
    nextPageNumber: pageNumber,
  };
}

function paginateFixedBlock({
  block,
  startPageNumber,
  trimSize,
  fontFamily,
  lineSpacing,
  tocRows,
}: {
  block: BookContentBlock;
  startPageNumber: number;
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
  tocRows?: TocRow[];
}) {
  const pageType = getMeasuredPageType(block, true);
  const sandbox = document.createElement("div");
  const contentWrapper = document.createElement("div");

  applySandboxStyles({
    sandbox,
    contentWrapper,
    trimSize,
    fontFamily,
    lineSpacing,
    pageType,
    isLeftPage: startPageNumber % 2 === 0,
  });

  sandbox.appendChild(contentWrapper);
  document.body.appendChild(sandbox);

  if (block.type === "table_of_contents") {
    contentWrapper.innerHTML = buildTocHtml(tocRows || []);
  } else if (block.type === "title_page") {
    const lines = splitParagraphs(block.content);
    contentWrapper.innerHTML = buildTitlePageHtml(
      lines[0] || block.title,
      lines[1]
    );
  } else {
    contentWrapper.innerHTML = `
      ${buildBlockHeaderHtml(block)}
      ${splitParagraphs(block.content)
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("")}
    `;
  }

  const page: MeasuredBookPage = finalizePage({
    pageNumber: startPageNumber,
    block,
    pageType,
    contentHtml: contentWrapper.innerHTML,
  });

  document.body.removeChild(sandbox);

  return {
    pages: [page],
    nextPageNumber: startPageNumber + 1,
  };
}

function buildTocRowsFromPages(pages: MeasuredBookPage[]) {
  const rows: TocRow[] = [];
  const seen = new Set<string>();

  pages.forEach((page) => {
    if (!page.sourceBlockId) return;
    if (seen.has(page.sourceBlockId)) return;

    const shouldInclude =
      page.type === "introduction" ||
      page.type === "chapter_first" ||
      page.type === "acknowledgments" ||
      page.type === "about_author" ||
      page.type === "what_comes_next";

    if (!shouldInclude) return;

    seen.add(page.sourceBlockId);

    rows.push({
      id: page.sourceBlockId,
      title:
        page.type === "chapter_first" && page.chapterNumber
          ? `Chapter ${page.chapterNumber}: ${page.title}`
          : page.title,
      pageNumber: page.pageNumber,
    });
  });

  return rows;
}

function paginateBlocks({
  blocks,
  trimSize,
  fontFamily,
  lineSpacing,
  tocRows,
}: {
  blocks: BookContentBlock[];
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
  tocRows?: TocRow[];
}) {
  const pages: MeasuredBookPage[] = [];
  let pageNumber = 1;

  blocks.forEach((block) => {
    if (block.type === "title_page" || block.type === "table_of_contents") {
      const result = paginateFixedBlock({
        block,
        startPageNumber: pageNumber,
        trimSize,
        fontFamily,
        lineSpacing,
        tocRows,
      });

      pages.push(...result.pages);
      pageNumber = result.nextPageNumber;
      return;
    }

    const result = paginateTextBlock({
      block,
      startPageNumber: pageNumber,
      trimSize,
      fontFamily,
      lineSpacing,
    });

    pages.push(...result.pages);
    pageNumber = result.nextPageNumber;
  });

  if (pages.length % 2 !== 0) {
    pages.push({
      id: "blank-final-page",
      pageNumber,
      displayPageNumber: "",
      type: "blank",
      title: "Blank Page",
      label: "Blank Page",
      contentHtml: "",
      isLeftPage: pageNumber % 2 === 0,
    });
  }

  return pages;
}

export async function buildMeasuredBookLayout({
  blocks,
  trimSize,
  fontFamily,
  lineSpacing,
}: BuildMeasuredBookLayoutInput): Promise<MeasuredBookLayout> {
  if (typeof document === "undefined") {
    throw new Error("buildMeasuredBookLayout must run in the browser.");
  }

  const normalizedTrimSize = normalizeTrimSize(trimSize);

  const draftPages = paginateBlocks({
    blocks,
    trimSize,
    fontFamily,
    lineSpacing,
  });

  const tocRows = buildTocRowsFromPages(draftPages);

  const finalPages = paginateBlocks({
    blocks,
    trimSize,
    fontFamily,
    lineSpacing,
    tocRows,
  });

  const finalTocRows = buildTocRowsFromPages(finalPages);

  return {
    trimSize: normalizedTrimSize,
    pages: finalPages,
    spreads: createSpreads(finalPages),
    tocRows: finalTocRows,
    interiorPageCount: finalPages.filter((page) => page.type !== "blank").length,
  };
}