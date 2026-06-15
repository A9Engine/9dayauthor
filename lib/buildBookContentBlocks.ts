export type RawBookProject = {
  id: string;
  title: string | null;
  author_name: string | null;
  book_description?: string | null;
};

export type RawBookSection = {
  id: string;
  section_type: string;
  title: string;
  content: string | null;
  sort_order: number;
  include_in_book: boolean;
};

export type RawBookChapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string | null;
};

export type BookContentBlockType =
  | "title_page"
  | "copyright"
  | "dedication"
  | "table_of_contents"
  | "introduction"
  | "chapter"
  | "acknowledgments"
  | "about_author"
  | "what_comes_next"
  | "section";

export type BookContentBlock = {
  id: string;
  type: BookContentBlockType;
  title: string;
  content: string;
  sortOrder: number;
  chapterNumber?: number;
  sourceId?: string;
  includeInToc: boolean;
  forceNewPage: boolean;
};

function currentYear() {
  return new Date().getFullYear();
}

function cleanText(value?: string | null) {
  return value?.trim() || "";
}

function getFallbackSectionContent({
  sectionType,
  project,
}: {
  sectionType: string;
  project: RawBookProject;
}) {
  const bookTitle = cleanText(project.title) || "Untitled Book";
  const authorName = cleanText(project.author_name) || "Unknown Author";

  if (sectionType === "title_page") {
    return `${bookTitle}\n\n${authorName}`;
  }

  if (sectionType === "copyright") {
    return `Copyright © ${currentYear()} ${authorName}

All rights reserved.

No part of this book may be reproduced, stored in a retrieval system, or transmitted in any form without prior written permission from the author, except for brief quotations used in reviews or commentary.`;
  }

  if (sectionType === "dedication") {
    return "";
  }

  if (sectionType === "introduction") {
    return "";
  }

  if (sectionType === "acknowledgments") {
    return "";
  }

  if (sectionType === "about_author") {
    return `${authorName} is the author of ${bookTitle}.`;
  }

  if (sectionType === "what_comes_next") {
    return "";
  }

  return "";
}

function normalizeSectionType(sectionType: string): BookContentBlockType {
  if (sectionType === "title_page") return "title_page";
  if (sectionType === "copyright") return "copyright";
  if (sectionType === "dedication") return "dedication";
  if (sectionType === "introduction") return "introduction";
  if (sectionType === "acknowledgments") return "acknowledgments";
  if (sectionType === "about_author") return "about_author";
  if (sectionType === "what_comes_next") return "what_comes_next";

  return "section";
}

function shouldIncludeSectionInToc(sectionType: BookContentBlockType) {
  return (
    sectionType === "introduction" ||
    sectionType === "chapter" ||
    sectionType === "acknowledgments" ||
    sectionType === "about_author" ||
    sectionType === "what_comes_next"
  );
}

export function buildBookContentBlocks({
  project,
  sections,
  chapters,
  includeTableOfContents = true,
}: {
  project: RawBookProject;
  sections: RawBookSection[];
  chapters: RawBookChapter[];
  includeTableOfContents?: boolean;
}) {
  const blocks: BookContentBlock[] = [];

  const activeSections = [...sections]
    .filter(
      (section) =>
        section.include_in_book && section.section_type !== "table_of_contents"
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const frontSections = activeSections.filter(
    (section) => section.sort_order < 900
  );

  const backSections = activeSections.filter(
    (section) => section.sort_order >= 900
  );

  const sortedChapters = [...chapters].sort(
    (a, b) => a.chapter_number - b.chapter_number
  );

  frontSections
    .filter((section) =>
      ["title_page", "copyright", "dedication"].includes(section.section_type)
    )
    .forEach((section) => {
      const type = normalizeSectionType(section.section_type);
      const content =
        cleanText(section.content) ||
        getFallbackSectionContent({
          sectionType: section.section_type,
          project,
        });

      blocks.push({
        id: `section-${section.id}`,
        type,
        title: section.title,
        content,
        sortOrder: section.sort_order,
        sourceId: section.id,
        includeInToc: shouldIncludeSectionInToc(type),
        forceNewPage: true,
      });
    });

  if (includeTableOfContents) {
    blocks.push({
      id: "auto-table-of-contents",
      type: "table_of_contents",
      title: "Table of Contents",
      content: "",
      sortOrder: 4,
      includeInToc: false,
      forceNewPage: true,
    });
  }

  frontSections
    .filter((section) => section.section_type === "introduction")
    .forEach((section) => {
      const type = normalizeSectionType(section.section_type);
      const content =
        cleanText(section.content) ||
        getFallbackSectionContent({
          sectionType: section.section_type,
          project,
        });

      blocks.push({
        id: `section-${section.id}`,
        type,
        title: section.title,
        content,
        sortOrder: section.sort_order,
        sourceId: section.id,
        includeInToc: shouldIncludeSectionInToc(type),
        forceNewPage: true,
      });
    });

  sortedChapters.forEach((chapter) => {
    blocks.push({
      id: `chapter-${chapter.id}`,
      type: "chapter",
      title: chapter.title || `Chapter ${chapter.chapter_number}`,
      content: cleanText(chapter.content) || "No chapter content written yet.",
      sortOrder: 100 + chapter.chapter_number,
      chapterNumber: chapter.chapter_number,
      sourceId: chapter.id,
      includeInToc: true,
      forceNewPage: true,
    });
  });

  backSections.forEach((section) => {
    const type = normalizeSectionType(section.section_type);
    const content =
      cleanText(section.content) ||
      getFallbackSectionContent({
        sectionType: section.section_type,
        project,
      });

    blocks.push({
      id: `section-${section.id}`,
      type,
      title: section.title,
      content,
      sortOrder: section.sort_order,
      sourceId: section.id,
      includeInToc: shouldIncludeSectionInToc(type),
      forceNewPage: true,
    });
  });

  return blocks;
}