"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VoiceDictationButton from "./VoiceDictationButton";

type Section = {
  id: string;
  section_type: string;
  title: string;
  content: string | null;
  sort_order: number;
  page_count_estimate?: number | null;
};

const frontMatterTypes = [
  "title_page",
  "copyright",
  "dedication",
  "introduction",
];

const backMatterTypes = [
  "acknowledgments",
  "about_author",
  "what_comes_next",
];

export default function BookSectionsWorkspace({
  projectId,
  title,
  authorName,
  sections,
}: {
  projectId: string;
  title: string;
  authorName: string;
  sections: Section[];
}) {
  const [localSections, setLocalSections] = useState<Section[]>(sections);

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const cleanedSections = useMemo(() => {
    return [...localSections]
      .filter((section) => section.section_type !== "table_of_contents")
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [localSections]);

  const frontMatter = cleanedSections.filter((section) =>
    frontMatterTypes.includes(section.section_type)
  );

  const backMatter = cleanedSections.filter((section) =>
    backMatterTypes.includes(section.section_type)
  );

  const [selectedSectionId, setSelectedSectionId] = useState(
    cleanedSections[0]?.id || ""
  );

  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const sectionContentRef = useRef<HTMLTextAreaElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showSample, setShowSample] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const activeSection =
    cleanedSections.find((section) => section.id === selectedSectionId) ||
    cleanedSections[0];

  const isTitlePage = activeSection?.section_type === "title_page";

  useEffect(() => {
    if (!selectedSectionId && cleanedSections[0]?.id) {
      setSelectedSectionId(cleanedSections[0].id);
    }
  }, [cleanedSections, selectedSectionId]);

  useEffect(() => {
    setSectionTitle(activeSection?.title || "");
    setSectionContent(activeSection?.content || "");
    setSaveMessage("");
    setShowSample(false);
    setLastSavedAt(null);
  }, [activeSection?.id]);

  function getSectionDescription(sectionType?: string) {
    switch (sectionType) {
      case "title_page":
        return "The first interior page of your book, showing the book title and author name.";
      case "copyright":
        return "A legal and publishing information page placed near the beginning of the book.";
      case "dedication":
        return "A short personal page honoring the person, people, or purpose behind the book.";
      case "introduction":
        return "A reader welcome that explains why the book matters and what the reader can expect.";
      case "acknowledgments":
        return "A thank-you page for the people, experiences, or support behind the book.";
      case "about_author":
        return "A short author bio that helps readers understand who you are and why you wrote this book.";
      case "what_comes_next":
        return "A closing page that guides readers toward the next step after finishing the book.";
      default:
        return "Create an additional page for your finished book.";
    }
  }

  function getSampleContent(sectionType?: string) {
    switch (sectionType) {
      case "title_page":
        return `${title}

${authorName}`;

      case "copyright":
        return `Copyright © ${new Date().getFullYear()} ${authorName}

All rights reserved.

No part of this book may be reproduced, stored in a retrieval system, or transmitted in any form without prior written permission from the author, except for brief quotations used in reviews or commentary.

This book is provided for informational and inspirational purposes. The author makes no guarantees regarding specific outcomes or results.`;

      case "dedication":
        return `For the people who believed in me before the vision made sense.

And for every reader who is ready to begin again.`;

      case "introduction":
        return `Every book begins with a reason.

This book was written for readers who are ready to step into a new chapter of their own lives. Inside these pages, you will find ideas, stories, and lessons designed to help you think differently, act with more intention, and move closer to the life you know is possible.

You do not need to have everything figured out before you begin. You only need the willingness to take the next step.`;

      case "acknowledgments":
        return `I want to thank the people who supported, encouraged, challenged, and believed in this project.

A book may have one name on the cover, but it is rarely created alone. This section is where I recognize the people, lessons, and experiences that helped bring this book to life.`;

      case "about_author":
        return `${authorName} is the author of ${title}.

Use this section to share your background, mission, experience, and the reason you wrote this book. Keep it professional, human, and connected to the reader.`;

      case "what_comes_next":
        return `Thank you for reading ${title}.

This book is not the end of the journey. It is the beginning of what comes next.

Use this section to guide readers toward the next step, whether that is visiting your website, joining your community, reading your next book, applying the lessons, or continuing the journey with you.`;

      default:
        return "Use this page to add important context before or after your chapters.";
    }
  }

  function updateSectionContent(nextContent: string) {
    setSectionContent(nextContent);
    setSaveMessage("");
  }

  function useSampleAsDraft() {
    updateSectionContent(getSampleContent(activeSection?.section_type));
    setShowSample(false);
  }

  async function saveSection() {
    if (!activeSection?.id) return;

    try {
      setIsSaving(true);
      setSaveMessage("");

      const response = await fetch("/api/update-book-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: activeSection.id,
          title: sectionTitle,
          content: isTitlePage ? activeSection.content || "" : sectionContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error || "Could not save section.");
        return;
      }

      setLocalSections((currentSections) =>
        currentSections.map((section) =>
          section.id === activeSection.id
            ? {
                ...section,
                title: sectionTitle,
                content: isTitlePage ? section.content : sectionContent,
              }
            : section
        )
      );

      setLastSavedAt(new Date().toLocaleTimeString());
      setSaveMessage("Section saved.");
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  function SectionButton({ section }: { section: Section }) {
    const isActive = selectedSectionId === section.id;

    return (
      <button
        key={section.id}
        type="button"
        onClick={() => setSelectedSectionId(section.id)}
        className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
          isActive
            ? "border-[#d4af37] bg-[#fff6d8] shadow-sm"
            : "border-black/10 bg-[#faf8f3] hover:border-[#d4af37]/50"
        }`}
      >
        <div className="font-black">{section.title}</div>
        <div className="mt-1 line-clamp-2 text-xs leading-5 text-black/45">
          {getSectionDescription(section.section_type)}
        </div>
      </button>
    );
  }

  function previewContent() {
    if (activeSection?.section_type === "title_page") {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h1 className="text-5xl font-black leading-tight">{title}</h1>
          <div className="mt-16 h-[1px] w-24 bg-black/20" />
          <p className="mt-10 text-xl tracking-[0.2em] text-black/60">
            {authorName}
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-black/40">
            {sectionTitle}
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight">
            {sectionTitle}
          </h1>
        </div>

        <div className="mt-12 space-y-5 text-[17px] leading-8 text-black/80">
          {sectionContent.trim() ? (
            sectionContent
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p className="text-black/35">
              Start writing this section in the editor, or use the sample as a
              starter draft.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!cleanedSections.length) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-xl shadow-black/5">
          <h1 className="text-3xl font-black">No additional pages found</h1>
          <p className="mt-3 text-black/60">
            Additional pages have not been created for this project yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#b38b16]">
            Step 5 of 9
          </div>

          <h1 className="mt-3 text-5xl font-black">Additional Pages</h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-black/60">
            Create the pages that appear before and after your chapters. Page
            numbers and the table of contents will be handled automatically
            during formatting.
          </p>
        </div>

        <a
          href={`/formatting?id=${projectId}`}
          className="w-fit rounded-2xl bg-black px-7 py-5 text-lg font-black text-[#d4af37] transition hover:-translate-y-0.5"
        >
          Continue to Formatting
        </a>
      </div>

      <div className="grid gap-8 xl:grid-cols-[320px_1fr_1fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
            Additional Pages
          </p>

          <div className="mt-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
              Front Matter
            </div>

            <div className="mt-3 space-y-2">
              {frontMatter.map((section) => (
                <SectionButton key={section.id} section={section} />
              ))}
            </div>
          </div>

          <div className="mt-7">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
              Back Matter
            </div>

            <div className="mt-3 space-y-2">
              {backMatter.map((section) => (
                <SectionButton key={section.id} section={section} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
            Editor
          </p>

          <p className="mt-2 text-sm leading-6 text-black/50">
            {getSectionDescription(activeSection?.section_type)}
          </p>

          <label className="mt-6 block text-xs font-black uppercase tracking-[0.14em] text-black/45">
            Section Title
          </label>

          <input
            value={sectionTitle}
            onChange={(event) => {
              setSectionTitle(event.target.value);
              setSaveMessage("");
            }}
            className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg font-bold outline-none focus:border-[#d4af37]"
          />

          {isTitlePage ? (
            <div className="mt-6 rounded-2xl border border-[#d4af37]/30 bg-[#fff6d8] p-5 text-sm font-bold leading-6 text-black/65">
              The title page is generated automatically from your book title and
              author name. You can edit those details in the book setup step.
            </div>
          ) : (
            <>
              <label className="mt-6 block text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Section Content
              </label>

              <div className="mt-3">
                <VoiceDictationButton
                  value={sectionContent}
                  onChange={updateSectionContent}
                  textareaRef={sectionContentRef}
                  disabled={isSaving}
                  buttonLabel="Voice Draft"
                />
              </div>

              <textarea
                ref={sectionContentRef}
                value={sectionContent}
                onChange={(event) => updateSectionContent(event.target.value)}
                placeholder="Write this additional page here, or click Voice Draft and speak naturally..."
                className="mt-3 min-h-[430px] w-full rounded-2xl border border-black/10 bg-[#faf8f3] p-5 text-base leading-8 outline-none focus:border-[#d4af37]"
              />
            </>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={saveSection}
              disabled={isSaving}
              className="rounded-2xl bg-black px-6 py-4 font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:opacity-50 sm:col-span-2"
            >
              {isSaving ? "Saving..." : "Save Section"}
            </button>

            <button
              type="button"
              onClick={() => setShowSample(true)}
              className="rounded-2xl border border-black/10 bg-white px-6 py-4 font-black text-black transition hover:-translate-y-0.5"
            >
              View Sample
            </button>
          </div>

          <button
            type="button"
            onClick={useSampleAsDraft}
            className="mt-3 w-full rounded-2xl border border-[#d4af37]/40 bg-[#fff6d8] px-6 py-4 font-black text-black transition hover:-translate-y-0.5"
          >
            Use Sample as Starter Draft
          </button>

          {saveMessage ? (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {saveMessage}
              {lastSavedAt ? (
                <span className="ml-2 text-green-600/70">
                  Last saved at {lastSavedAt}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-[#e9e2d0] p-6 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7a5a16]">
            Live Page Preview
          </p>

          <p className="mt-2 text-sm leading-6 text-black/50">
            Preview only. Final page numbers and table of contents will be
            generated during formatting.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="relative h-[760px] w-full max-w-[470px] rounded-[1.5rem] bg-white px-12 py-16 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
              <div className="h-full overflow-hidden pb-16">
                {previewContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSample ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="max-h-[82vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
                  Sample
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {activeSection?.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowSample(false)}
                className="rounded-2xl border border-black/10 px-5 py-3 font-black transition hover:-translate-y-0.5"
              >
                Close
              </button>
            </div>

            <div className="mt-8 whitespace-pre-wrap rounded-[1.5rem] bg-[#faf8f3] p-6 text-base leading-8 text-black/75">
              {getSampleContent(activeSection?.section_type)}
            </div>

            <button
              type="button"
              onClick={useSampleAsDraft}
              className="mt-6 w-full rounded-2xl bg-black px-6 py-4 font-black text-[#d4af37] transition hover:-translate-y-0.5"
            >
              Use This as Starter Draft
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}