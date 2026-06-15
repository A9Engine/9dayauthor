"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildBookContentBlocks,
  type BookContentBlock,
} from "../../lib/buildBookContentBlocks";
import {
  buildMeasuredBookLayout,
  type MeasuredBookLayout,
  type MeasuredBookPage,
} from "../../lib/pagination/buildMeasuredBookLayout";
import {
  getBookLayoutConfig,
  getFontFamilyValue,
  getLineHeightValue,
  type BookLineSpacingKey,
} from "../../lib/bookLayoutConfig";

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string | null;
  word_count: number | null;
};

type BookSection = {
  id: string;
  section_type: string;
  title: string;
  content: string | null;
  sort_order: number;
  include_in_book: boolean;
  page_count_estimate: number;
};

type AssemblyItem = {
  id: string;
  label: string;
  title: string;
  startPage: number;
  pageCount: number;
  type: "front_matter" | "chapter" | "back_matter" | "toc";
};

type PreviewSpread = {
  leftPage: MeasuredBookPage | null;
  rightPage: MeasuredBookPage | null;
};

function getAssemblyType(block: BookContentBlock): AssemblyItem["type"] {
  if (block.type === "table_of_contents") return "toc";
  if (block.type === "chapter") return "chapter";

  if (
    block.type === "acknowledgments" ||
    block.type === "about_author" ||
    block.type === "what_comes_next"
  ) {
    return "back_matter";
  }

  return "front_matter";
}

function getAssemblyLabel(block: BookContentBlock) {
  if (block.type === "chapter") return `Chapter ${block.chapterNumber || ""}`;
  if (block.type === "table_of_contents") return "Table of Contents";
  if (getAssemblyType(block) === "front_matter") return "Front Matter";
  if (getAssemblyType(block) === "back_matter") return "Back Matter";
  return block.title;
}

function findPagesForBlock(block: BookContentBlock, pages: MeasuredBookPage[]) {
  if (block.type === "table_of_contents") {
    return pages.filter((page) => page.type === "table_of_contents");
  }

  if (block.type === "chapter") {
    return pages.filter(
      (page) =>
        page.type === "chapter_first" &&
        page.chapterNumber === block.chapterNumber
    );
  }

  if (block.sourceId) {
    return pages.filter((page) => page.sourceBlockId === block.sourceId);
  }

  return pages.filter((page) => page.title === block.title);
}

function buildAssemblyItems({
  blocks,
  pages,
}: {
  blocks: BookContentBlock[];
  pages: MeasuredBookPage[];
}) {
  const items: AssemblyItem[] = [];

  blocks.forEach((block) => {
    const matchingPages = findPagesForBlock(block, pages);
    const firstPage = matchingPages[0];

    if (!firstPage) return;

    const allBlockPages =
      block.type === "chapter"
        ? pages.filter(
            (page) =>
              page.chapterNumber === block.chapterNumber &&
              (page.type === "chapter_first" || page.type === "chapter_body")
          )
        : block.type === "table_of_contents"
        ? pages.filter((page) => page.type === "table_of_contents")
        : block.sourceId
        ? pages.filter((page) => page.sourceBlockId === block.sourceId)
        : matchingPages;

    items.push({
      id: block.id,
      label: getAssemblyLabel(block),
      title: block.title,
      startPage: firstPage.pageNumber,
      pageCount: Math.max(1, allBlockPages.length),
      type: getAssemblyType(block),
    });
  });

  return items;
}

function buildPreviewSpreads(pages: MeasuredBookPage[]) {
  if (!pages.length) return [];

  const pageByNumber = new Map<number, MeasuredBookPage>();

  pages.forEach((page) => {
    pageByNumber.set(page.pageNumber, page);
  });

  const maxPageNumber = Math.max(...pages.map((page) => page.pageNumber));
  const spreads: PreviewSpread[] = [];

  spreads.push({
    leftPage: null,
    rightPage: pageByNumber.get(1) || null,
  });

  for (let pageNumber = 2; pageNumber <= maxPageNumber; pageNumber += 2) {
    spreads.push({
      leftPage: pageByNumber.get(pageNumber) || null,
      rightPage: pageByNumber.get(pageNumber + 1) || null,
    });
  }

  return spreads;
}

function BookPageFrame({
  page,
  trimSize,
  fontFamily,
  lineSpacing,
}: {
  page?: MeasuredBookPage | null;
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
}) {
  const config = getBookLayoutConfig(trimSize);
  const resolvedFontFamily = getFontFamilyValue(fontFamily);
  const resolvedLineHeight = getLineHeightValue(lineSpacing);
  const isLeftPage = page?.isLeftPage || false;

  const paddingLeft = isLeftPage
    ? config.marginOutsideIn
    : config.marginInsideIn;

  const paddingRight = isLeftPage
    ? config.marginInsideIn
    : config.marginOutsideIn;

  const bodyHeightIn =
    config.pageHeightIn -
    config.marginTopIn -
    config.marginBottomIn -
    config.footerHeightIn -
    config.footerGapIn;

  return (
    <div
      className="relative overflow-hidden bg-[#fffdf7]"
      style={{
        width: `${config.pageWidthIn}in`,
        height: `${config.pageHeightIn}in`,
        boxSizing: "border-box",
        paddingTop: `${config.marginTopIn}in`,
        paddingBottom: `${
          config.marginBottomIn + config.footerHeightIn + config.footerGapIn
        }in`,
        paddingLeft: `${paddingLeft}in`,
        paddingRight: `${paddingRight}in`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(244,235,219,0.42))]" />

      <style>{`
        .measured-book-content {
          font-family: ${resolvedFontFamily};
          font-size: ${config.bodyFontSizePt}pt;
          line-height: ${resolvedLineHeight};
          color: #111;
          text-align: justify;
        }

        .measured-book-content .book-title-page {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 2.15in;
          text-align: center;
        }

        .measured-book-content .book-title-page h1 {
          font-size: 30pt;
          line-height: 1.15;
          margin: 0;
          max-width: 80%;
        }

        .measured-book-content .book-title-page p {
          margin: 0;
          font-size: 13pt;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-align: center;
        }

        .measured-book-content .book-title-rule {
          width: 0.75in;
          height: 1px;
          background: #999;
          margin: 0.65in 0 0.45in;
        }

        .measured-book-content .book-chapter-heading {
          text-align: center;
          margin-top: ${config.chapterFirstPageTopSpaceIn}in;
          margin-bottom: 0.35in;
        }

        .measured-book-content .book-chapter-label {
          font-size: 9pt;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #777;
          margin-bottom: 0.16in;
        }

        .measured-book-content .book-chapter-heading h1 {
          font-size: 24pt;
          line-height: 1.15;
          margin: 0;
        }

        .measured-book-content .book-chapter-rule {
          width: 0.55in;
          height: 2px;
          background: #6a4cff;
          margin: 0.28in auto 0;
        }

        .measured-book-content .book-dedication-page {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .measured-book-content .book-dedication-page h1 {
          font-size: 18pt;
          line-height: 1.3;
          margin: 0;
        }

        .measured-book-content .book-section-heading {
          text-align: center;
          margin-top: ${config.sectionFirstPageTopSpaceIn}in;
          margin-bottom: 0.35in;
        }

        .measured-book-content .book-section-label {
          font-size: 8.5pt;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #777;
          margin-bottom: 0.14in;
        }

        .measured-book-content .book-section-heading h1 {
          font-size: 21pt;
          line-height: 1.2;
          margin: 0;
        }

        .measured-book-content p {
          margin: 0 0 0.13in;
        }

        .measured-book-content .book-chapter-heading + p,
        .measured-book-content p {
          text-indent: ${
            page?.type === "chapter_first" || page?.type === "chapter_body"
              ? "0.22in"
              : "0"
          };
        }

        .measured-book-content .book-toc-list {
          margin-top: 0.35in;
        }

        .measured-book-content .book-toc-row {
          display: flex;
          align-items: flex-end;
          gap: 0.08in;
          margin-bottom: 0.12in;
          font-size: 10.5pt;
          line-height: 1.35;
          text-align: left;
        }

        .measured-book-content .book-toc-title {
          max-width: 75%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .measured-book-content .book-toc-dots {
          flex: 1;
          border-bottom: 1px dotted #888;
          transform: translateY(-0.05in);
        }

        .measured-book-content .book-toc-page {
          min-width: 0.25in;
          text-align: right;
        }
      `}</style>

      <div
        className="measured-book-content relative z-20 overflow-hidden"
        style={{
          height: `${bodyHeightIn}in`,
        }}
        dangerouslySetInnerHTML={{
          __html: page?.contentHtml || "",
        }}
      />

      {page?.displayPageNumber ? (
        <div
          className="absolute z-[9999] text-xs font-semibold text-black/55"
          style={{
            bottom: `${config.marginBottomIn}in`,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: resolvedFontFamily,
          }}
        >
          {page.displayPageNumber}
        </div>
      ) : null}
    </div>
  );
}

function OpenBookPreview({
  leftPage,
  rightPage,
  trimSize,
  fontFamily,
  lineSpacing,
}: {
  leftPage?: MeasuredBookPage | null;
  rightPage?: MeasuredBookPage | null;
  trimSize: string;
  fontFamily: string;
  lineSpacing: BookLineSpacingKey;
}) {
  const config = getBookLayoutConfig(trimSize);

  const pageWidthPx = config.pageWidthIn * 96;
  const pageHeightPx = config.pageHeightIn * 96;

  // Unified Paper Spread width (No floating gray gap space layout)
  const paperSpreadWidthPx = pageWidthPx * 2;
  const paperSpreadHeightPx = pageHeightPx;

  const coverPaddingPx = 34;
  const outerShellRadiusPx = 28;

  const bookWidthPx = paperSpreadWidthPx + coverPaddingPx * 2;
  const bookHeightPx = paperSpreadHeightPx + coverPaddingPx * 2;

  const scale = Math.min(0.78, 980 / bookWidthPx);
  const visibleWidthPx = bookWidthPx * scale;
  const visibleHeightPx = bookHeightPx * scale + 80;

  return (
    <div className="w-full overflow-x-auto pb-12 pt-6 custom-scrollbar">
      <div
        className="relative mx-auto"
        style={{
          width: `${Math.max(visibleWidthPx, 920)}px`,
          height: `${visibleHeightPx}px`,
        }}
      >
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: `${bookWidthPx}px`,
            height: `${bookHeightPx}px`,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="absolute inset-x-24 bottom-[-26px] h-16 rounded-full bg-black/25 blur-2xl" />

          <div
            className="relative shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
            style={{
              width: `${bookWidthPx}px`,
              height: `${bookHeightPx}px`,
              borderRadius: `${outerShellRadiusPx}px`,
              background:
                "linear-gradient(180deg, #2c1d46 0%, #24183b 42%, #1d132f 100%)",
              padding: `${coverPaddingPx}px`,
            }}
          >
            <div
              className="absolute inset-[8px] pointer-events-none"
              style={{
                borderRadius: `${outerShellRadiusPx - 8}px`,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <div className="relative">
              {/* TWO COLUMN FLUSH SPREAD MATRIX */}
              <div
                className="relative"
                style={{
                  width: `${paperSpreadWidthPx}px`,
                  height: `${paperSpreadHeightPx}px`,
                  borderRadius: "18px",
                  display: "grid",
                  gridTemplateColumns: `${pageWidthPx}px ${pageWidthPx}px`,
                  background: "#fffdf8",
                  boxShadow:
                    "inset 0 0 0 1px rgba(60,40,20,0.08), inset 0 0 50px rgba(0,0,0,0.05)",
                  overflow: "visible",
                }}
              >
                {/* 3D RADIAL INNER GRADIENT FOR GUTTER SHADOW DEPTH */}
                <div
                  style={{
                    position: "absolute",
                    top: "0px",
                    bottom: "0px",
                    left: "50%",
                    width: "60px",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.08) 100%)",
                    pointerEvents: "none",
                    zIndex: 99999,
                  }}
                />

                {/* THE UNKILLABLE FINE CREASE LINE (Matches Photo 2 completely) */}
                <div
                  style={{
                    position: "absolute",
                    top: "0px",
                    bottom: "0px",
                    left: "50%",
                    width: "2px",
                    backgroundColor: "#3a3a3a",
                    transform: "translateX(-50%)",
                    boxShadow: "0 0 8px 1px rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                    zIndex: 999999,
                  }}
                />

                {/* LEFT PAGE CONTAINER */}
                <div className="relative overflow-hidden bg-[#fffdf8]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-10 bg-[repeating-linear-gradient(to_right,#ddd2bf_0px,#ddd2bf_1px,#f8f1e4_3px,#f8f1e4_5px)] opacity-90" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 bg-gradient-to-l from-black/15 to-transparent" />

                  {leftPage ? (
                    <BookPageFrame
                      page={leftPage}
                      trimSize={trimSize}
                      fontFamily={fontFamily}
                      lineSpacing={lineSpacing}
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-[#fffdf8]"
                      style={{
                        width: `${pageWidthPx}px`,
                        height: `${pageHeightPx}px`,
                      }}
                    />
                  )}
                </div>

                {/* RIGHT PAGE CONTAINER */}
                <div className="relative overflow-hidden bg-[#fffdf8]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 bg-gradient-to-r from-black/15 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-10 bg-[repeating-linear-gradient(to_left,#ddd2bf_0px,#ddd2bf_1px,#f8f1e4_3px,#f8f1e4_5px)] opacity-90" />

                  {rightPage ? (
                    <BookPageFrame
                      page={rightPage}
                      trimSize={trimSize}
                      fontFamily={fontFamily}
                      lineSpacing={lineSpacing}
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-[#fffdf8]"
                      style={{
                        width: `${pageWidthPx}px`,
                        height: `${pageHeightPx}px`,
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="absolute bottom-[-18px] left-1/2 h-20 w-8 -translate-x-1/2 rounded-b-full bg-[#5f35d6] shadow-[0_10px_20px_rgba(95,53,214,0.35)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FormattingWorkspace({
  projectId,
  title,
  authorName,
  chapters,
  sections,
}: {
  projectId: string;
  title: string;
  authorName: string;
  targetPages: number;
  chapters: Chapter[];
  sections: BookSection[];
}) {
  const [trimSize, setTrimSize] = useState("6 x 9");
  const [fontFamily, setFontFamily] = useState("Garamond");
  const lineSpacing: BookLineSpacingKey = "Standard";

  const [layout, setLayout] = useState<MeasuredBookLayout | null>(null);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [layoutError, setLayoutError] = useState("");

  const spreadStorageKey = `formatting-spread-${projectId}`;
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [hasRestoredSpread, setHasRestoredSpread] = useState(false);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  }, [chapters]);

  const contentBlocks = useMemo(() => {
    return buildBookContentBlocks({
      project: {
        id: projectId,
        title,
        author_name: authorName,
      },
      sections,
      chapters: sortedChapters,
      includeTableOfContents: true,
    });
  }, [projectId, title, authorName, sections, sortedChapters]);

  useEffect(() => {
    let isCancelled = false;

    async function buildLayout() {
      try {
        setIsLayoutLoading(true);
        setLayoutError("");

        const measuredLayout = await buildMeasuredBookLayout({
          blocks: contentBlocks,
          trimSize,
          fontFamily,
          lineSpacing,
        });

        if (isCancelled) return;

        setLayout(measuredLayout);
      } catch (error) {
        console.error(error);

        if (isCancelled) return;

        setLayout(null);
        setLayoutError(
          error instanceof Error
            ? error.message
            : "Something went wrong while calculating the book layout."
        );
      } finally {
        if (!isCancelled) {
          setIsLayoutLoading(false);
        }
      }
    }

    buildLayout();

    return () => {
      isCancelled = true;
    };
  }, [contentBlocks, trimSize, fontFamily, lineSpacing]);

  const pages = layout?.pages || [];
  const previewSpreads = useMemo(() => buildPreviewSpreads(pages), [pages]);

  const assemblyItems = useMemo(() => {
    if (!layout) return [];

    return buildAssemblyItems({
      blocks: contentBlocks,
      pages: layout.pages,
    });
  }, [contentBlocks, layout]);

  useEffect(() => {
    const savedSpreadIndex = window.localStorage.getItem(spreadStorageKey);

    if (savedSpreadIndex) {
      const parsedSpreadIndex = Number(savedSpreadIndex);

      if (Number.isFinite(parsedSpreadIndex) && parsedSpreadIndex >= 0) {
        setCurrentSpreadIndex(parsedSpreadIndex);
      }
    }

    setHasRestoredSpread(true);
  }, [spreadStorageKey]);

  useEffect(() => {
    if (!hasRestoredSpread) return;

    window.localStorage.setItem(spreadStorageKey, String(currentSpreadIndex));
  }, [spreadStorageKey, currentSpreadIndex, hasRestoredSpread]);

  useEffect(() => {
    if (!previewSpreads.length) return;

    if (currentSpreadIndex >= previewSpreads.length) {
      setCurrentSpreadIndex(previewSpreads.length - 1);
    }
  }, [currentSpreadIndex, previewSpreads.length]);

  const currentSpread = previewSpreads[currentSpreadIndex] || previewSpreads[0];

  function goToPreviousSpread() {
    setCurrentSpreadIndex((current) => Math.max(0, current - 1));
  }

  function goToNextSpread() {
    setCurrentSpreadIndex((current) =>
      Math.min(previewSpreads.length - 1, current + 1)
    );
  }

  function goToPage(pageNumber: number) {
    const spreadIndex = pageNumber <= 1 ? 0 : Math.ceil((pageNumber - 1) / 2);

    setCurrentSpreadIndex(
      Math.max(0, Math.min(previewSpreads.length - 1, spreadIndex))
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
          Step 6 of 9
        </p>

        <h1 className="mt-3 text-5xl font-black tracking-tight">
          Format Your Book
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-black/60">
          Choose your book’s interior style and preview how the pages will look before creating your cover.
        </p>
      </div>

      <div className="mt-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
          Formatting Controls
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-black uppercase tracking-[0.14em] text-black/55">
              Trim Size
            </label>

            <select
              value={trimSize}
              onChange={(event) => {
                setTrimSize(event.target.value);
                setCurrentSpreadIndex(0);
              }}
              className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none"
            >
              <option>5 x 8</option>
              <option>5.5 x 8.5</option>
              <option>6 x 9</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-black uppercase tracking-[0.14em] text-black/55">
              Font
            </label>

            <select
              value={fontFamily}
              onChange={(event) => {
                setFontFamily(event.target.value);
                setCurrentSpreadIndex(0);
              }}
              className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none"
            >
              <option>Garamond</option>
              <option>Georgia</option>
              <option>Times New Roman</option>
              <option>Baskerville</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-black/10 bg-[#e9e2d0] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7a5a16]">
              Live Book Preview
            </p>

            <h2 className="mt-2 text-3xl font-black">{title}</h2>

            <p className="mt-1 text-sm text-black/55">
              {isLayoutLoading
                ? "Calculating measured print layout..."
                : layoutError
                ? "Layout calculation needs attention."
                : `Spread ${currentSpreadIndex + 1} of ${
                    previewSpreads.length
                  } · Pages ${
                    currentSpread?.leftPage?.pageNumber || "blank"
                  } and ${currentSpread?.rightPage?.pageNumber || "blank"}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToPreviousSpread}
              disabled={currentSpreadIndex === 0 || isLayoutLoading}
              className="rounded-2xl border border-black/10 bg-white px-5 py-3 font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous Spread
            </button>

            <button
              type="button"
              onClick={goToNextSpread}
              disabled={
                isLayoutLoading || currentSpreadIndex >= previewSpreads.length - 1
              }
              className="rounded-2xl bg-black px-5 py-3 font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next Spread
            </button>
          </div>
        </div>

        {layoutError ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold leading-6 text-red-700">
            {layoutError}
          </div>
        ) : null}

        <div className="mt-8">
          {isLayoutLoading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] bg-white/60 p-10 text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-[#6a4cff]" />

                <p className="mt-5 font-black text-black/70">
                  Measuring your book pages...
                </p>
              </div>
            </div>
          ) : (
            <OpenBookPreview
              leftPage={currentSpread?.leftPage}
              rightPage={currentSpread?.rightPage}
              trimSize={trimSize}
              fontFamily={fontFamily}
              lineSpacing={lineSpacing}
            />
          )}
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
        <label className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
          Jump to Section
        </label>

        <select
          disabled={isLayoutLoading || !assemblyItems.length}
          onChange={(event) => {
            const selectedPage = Number(event.target.value);
            if (Number.isFinite(selectedPage)) {
              goToPage(selectedPage);
            }
          }}
          className="mt-4 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg font-bold outline-none disabled:opacity-50"
          defaultValue=""
        >
          <option value="" disabled>
            Select a section...
          </option>

          {assemblyItems.map((item) => (
            <option key={item.id} value={item.startPage}>
              {item.type === "chapter"
                ? `${item.label}: ${item.title}`
                : item.title}{" "}
              — Page {item.startPage}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
