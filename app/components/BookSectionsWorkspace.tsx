"use client";

import { createPortal } from "react-dom";
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

const backMatterTypes = ["acknowledgments", "about_author", "what_comes_next"];

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

  function isCustomFrontMatter(sectionType?: string) {
    return Boolean(sectionType?.startsWith("custom_front_matter"));
  }

  function isCustomBackMatter(sectionType?: string) {
    return Boolean(sectionType?.startsWith("custom_back_matter"));
  }

  function sectionBelongsToMatter(section: Section, location: "front" | "back") {
    if (location === "front") {
      return (
        frontMatterTypes.includes(section.section_type) ||
        isCustomFrontMatter(section.section_type)
      );
    }

    return (
      backMatterTypes.includes(section.section_type) ||
      isCustomBackMatter(section.section_type)
    );
  }

  const frontMatter = cleanedSections.filter((section) =>
    sectionBelongsToMatter(section, "front"),
  );

  const backMatter = cleanedSections.filter((section) =>
    sectionBelongsToMatter(section, "back"),
  );

  const [selectedSectionId, setSelectedSectionId] = useState(
    cleanedSections[0]?.id || "",
  );

  const [sectionContent, setSectionContent] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const sectionContentRef = useRef<HTMLTextAreaElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showSample, setShowSample] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isDeletingPage, setIsDeletingPage] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showSample) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showSample]);

  const activeSection =
    cleanedSections.find((section) => section.id === selectedSectionId) ||
    cleanedSections[0];

  const isTitlePage = activeSection?.section_type === "title_page";
  const isCustomFrontMatterPage = isCustomFrontMatter(activeSection?.section_type);
  const isCustomBackMatterPage = isCustomBackMatter(activeSection?.section_type);
  const isCustomPage = isCustomFrontMatterPage || isCustomBackMatterPage;
  const canRemoveActiveSection = Boolean(
    activeSection &&
      (isCustomPage || backMatterTypes.includes(activeSection.section_type))
  );

  useEffect(() => {
    if (!selectedSectionId && cleanedSections[0]?.id) {
      setSelectedSectionId(cleanedSections[0].id);
    }
  }, [cleanedSections, selectedSectionId]);

  useEffect(() => {
    setSectionContent(activeSection?.content || "");
    setPageTitle(activeSection?.title || "");
    setSaveMessage("");
    setShowSample(false);
    setLastSavedAt(null);
  }, [activeSection?.id]);

  function getSectionDescription(sectionType?: string) {
    switch (sectionType) {
      case "title_page":
        return "Automatically created from your book title and author name.";
      case "copyright":
        return "Add legal and publishing information for the beginning of your book.";
      case "dedication":
        return "Write a short personal dedication honoring the person, people, or purpose behind the book.";
      case "introduction":
        return "Welcome the reader and explain what they can expect from the book.";
      case "acknowledgments":
        return "Thank the people, experiences, or support that helped bring the book to life.";
      case "about_author":
        return "Write a short author bio that helps readers understand who you are and why you wrote the book.";
      case "what_comes_next":
        return "Guide readers toward the next step after finishing the book.";
      default:
        if (isCustomFrontMatter(sectionType)) {
          return "Add a custom page before your main chapters, such as a tribute, foreword, or special note.";
        }

        if (isCustomBackMatter(sectionType)) {
          return "Add a custom page at the end of your book.";
        }

        return "Create an additional page for your finished book.";
    }
  }

  function getSampleContent(sectionType?: string) {
    switch (sectionType) {
      case "title_page":
        return `${title}\n\n${authorName}`;

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
        if (isCustomFrontMatter(sectionType)) {
          return `Add your custom front matter page here.

This could be a tribute, foreword, personal note, author's note, special dedication, or any page you want readers to see before the main chapters begin.`;
        }

        if (isCustomBackMatter(sectionType)) {
          return `Add your custom back matter page here.

This could be a resources page, bonus chapter note, reader invitation, discussion questions, recommended reading list, or any other closing page you want to include in your book.`;
        }

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
          title: isCustomPage ? pageTitle.trim() || "Custom Page" : activeSection.title,
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
                title: isCustomPage ? pageTitle.trim() || "Custom Page" : activeSection.title,
                content: isTitlePage ? section.content : sectionContent,
              }
            : section,
        ),
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


  async function saveSectionOrder(orderedSectionIds: string[]) {
    try {
      setIsSavingOrder(true);
      setSaveMessage("");

      const response = await fetch("/api/update-book-section-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, orderedSectionIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error || "Could not save page order.");
        return;
      }

      if (Array.isArray(result.sections)) {
        setLocalSections(result.sections);
      }

      setSaveMessage("Page order saved.");
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong saving the page order.");
    } finally {
      setIsSavingOrder(false);
    }
  }

  function moveSectionWithinMatter(
    draggedId: string,
    targetId: string,
    location: "front" | "back",
  ) {
    if (draggedId === targetId) return;

    const orderedMatter = location === "front" ? frontMatter : backMatter;
    const draggedIndex = orderedMatter.findIndex((section) => section.id === draggedId);
    const targetIndex = orderedMatter.findIndex((section) => section.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const nextMatter = [...orderedMatter];
    const [draggedSection] = nextMatter.splice(draggedIndex, 1);
    nextMatter.splice(targetIndex, 0, draggedSection);

    const nextMatterIds = nextMatter.map((section) => section.id);
    const nextSections = localSections.map((section) => {
      const nextIndex = nextMatterIds.indexOf(section.id);

      if (nextIndex === -1) return section;

      return {
        ...section,
        sort_order: (nextIndex + 1) * 10 + (location === "front" ? 0 : 1000),
      };
    });

    setLocalSections(nextSections);
    saveSectionOrder(nextMatterIds);
  }

  async function createCustomPage(location: "front" | "back") {
    try {
      setIsCreatingPage(true);
      setSaveMessage("");

      const response = await fetch("/api/create-book-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          location,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error || "Could not add page.");
        return;
      }

      const newSection = result.section as Section;

      if (Array.isArray(result.sections)) {
        setLocalSections(result.sections);
      } else {
        setLocalSections((currentSections) =>
          [...currentSections, newSection].sort((a, b) => a.sort_order - b.sort_order),
        );
      }

      setSelectedSectionId(newSection.id);
      setSaveMessage(
        location === "front"
          ? "Custom front matter page added."
          : "Custom back matter page added.",
      );
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong adding the page.");
    } finally {
      setIsCreatingPage(false);
    }
  }

  async function deleteActivePage() {
    if (!activeSection?.id || !canRemoveActiveSection) return;

    const confirmed = window.confirm(
      `Remove "${activeSection.title}" from your book? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setIsDeletingPage(true);
      setSaveMessage("");

      const response = await fetch("/api/delete-book-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: activeSection.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error || "Could not remove page.");
        return;
      }

      const remainingSections = localSections.filter(
        (section) => section.id !== activeSection.id,
      );
      setLocalSections(remainingSections);

      const nextSection = remainingSections
        .filter((section) => section.section_type !== "table_of_contents")
        .sort((a, b) => a.sort_order - b.sort_order)[0];

      setSelectedSectionId(nextSection?.id || "");
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong removing the page.");
    } finally {
      setIsDeletingPage(false);
    }
  }

  function SectionButton({
    section,
    location,
  }: {
    section: Section;
    location: "front" | "back";
  }) {
    const isActive = selectedSectionId === section.id;
    const isDragging = draggingSectionId === section.id;

    return (
      <button
        key={section.id}
        type="button"
        draggable
        onDragStart={(event) => {
          setDraggingSectionId(section.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", section.id);
        }}
        onDragEnd={() => setDraggingSectionId(null)}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/plain") || draggingSectionId;
          setDraggingSectionId(null);

          if (draggedId) {
            moveSectionWithinMatter(draggedId, section.id, location);
          }
        }}
        onClick={() => setSelectedSectionId(section.id)}
        className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
          isActive
            ? "border-[#d4af37] bg-[#fff6d8] shadow-sm"
            : "border-black/10 bg-[#faf8f3] hover:border-[#d4af37]/50"
        } ${isDragging ? "opacity-50" : ""}`}
        title="Drag to reorder this page"
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 select-none text-lg leading-none text-black/30" aria-hidden="true">
            ⋮⋮
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-black">{section.title}</div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-black/45">
              {getSectionDescription(section.section_type)}
            </div>
          </div>
        </div>
      </button>
    );
  }

  function previewContent() {
    if (activeSection?.section_type === "title_page") {
      return (
        <div className="flex h-full flex-col items-center text-center pt-[24%]">
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            {title}
          </h1>
          <div className="mt-10 h-[1px] w-20 bg-black/20" />
          <p className="mt-6 text-sm tracking-[0.2em] text-black/60 sm:text-base">
            {authorName}
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="text-center">
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            {isCustomPage ? pageTitle || activeSection?.title : activeSection?.title}
          </h1>
        </div>

        <div className="mt-10 space-y-5 text-[16px] leading-8 text-black/80 sm:text-[17px]">
          {sectionContent.trim() ? (
            sectionContent
              .replace(/\r\n/g, "\n")
              .replace(/\r/g, "\n")
              .split(/\n+/)
              .map((paragraph) => paragraph.trim())
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
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <div className="mb-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
  Step 5 of 9
</div>

<h1 className="mt-2 text-4xl font-black">
  Additional Pages
</h1>

<p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">
  Create the front matter and back matter pages that appear before and after your chapters.
  <br />
  <br />
  ⚠️ Formatting, page numbers, and the table of contents will be handled automatically in the Formatting section.
</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)_520px]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
            Book Pages
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-black/45">
            Drag pages by the handle to change their order.
          </p>

          {isSavingOrder ? (
            <div className="mt-3 rounded-2xl border border-[#d4af37]/25 bg-[#fff8df] px-3 py-2 text-xs font-black text-[#7a5a16]">
              Saving page order...
            </div>
          ) : null}

          <div className="mt-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
              Front Matter
            </div>

            <div className="mt-3 space-y-2">
              {frontMatter.map((section) => (
                <SectionButton key={section.id} section={section} location="front" />
              ))}

              <button
                type="button"
                onClick={() => createCustomPage("front")}
                disabled={isCreatingPage}
                className="mt-4 w-full rounded-2xl border border-[#d4af37]/40 bg-[#fff8df] px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {isCreatingPage ? "Adding Page..." : "+ Add Custom Front Matter Page"}
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-black/10 pt-8">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
              Back Matter
            </div>

            <div className="mt-3 space-y-2">
              {backMatter.map((section) => (
                <SectionButton key={section.id} section={section} location="back" />
              ))}
            </div>

            <button
              type="button"
              onClick={() => createCustomPage("back")}
              disabled={isCreatingPage}
              className="mt-4 w-full rounded-2xl border border-[#d4af37]/40 bg-[#fff8df] px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {isCreatingPage ? "Adding Page..." : "+ Add Custom Back Matter Page"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
            Editor
          </p>

          <div className="mt-4 rounded-3xl border border-black/10 bg-[#faf8f3] p-5">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
              Current Page
            </div>
            <h2 className="mt-2 text-3xl font-black">{isCustomPage ? pageTitle || activeSection?.title : activeSection?.title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              {getSectionDescription(activeSection?.section_type)}
            </p>
          </div>

          {isCustomPage ? (
            <div className="mt-6">
              <label className="block text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Page Title
              </label>
              <input
                value={pageTitle}
                onChange={(event) => {
                  setPageTitle(event.target.value);
                  setSaveMessage("");
                }}
                className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg font-bold outline-none focus:border-[#d4af37]"
                placeholder="Resources, Bonus Chapter, Discussion Questions..."
              />
            </div>
          ) : null}

          {isTitlePage ? (
            <div className="mt-6 rounded-2xl border border-[#d4af37]/30 bg-[#fff6d8] p-5 text-sm font-bold leading-6 text-black/65">
              The title page is generated automatically from your book title and
              author name. You can edit those details from the book setup step.
            </div>
          ) : (
            <>
              <label className="mt-6 block text-xs font-black uppercase tracking-[0.14em] text-black/45">
                Page Content
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
                placeholder="Write this page here, or click Voice Draft and speak naturally..."
                className="mt-3 min-h-[430px] w-full rounded-2xl border border-black/10 bg-[#faf8f3] p-5 text-base leading-8 outline-none focus:border-[#d4af37]"
              />
            </>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowSample(true)}
              className="rounded-2xl border border-black/10 bg-white px-6 py-4 font-black text-black transition hover:-translate-y-0.5"
            >
              View Sample
            </button>

            <button
              type="button"
              onClick={saveSection}
              disabled={isSaving || isTitlePage}
              className="rounded-2xl bg-black px-6 py-4 font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : isTitlePage
                  ? "Auto Generated"
                  : "Save Page"}
            </button>
          </div>

          {canRemoveActiveSection ? (
            <button
              type="button"
              onClick={deleteActivePage}
              disabled={isDeletingPage}
              className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-black text-red-700 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {isDeletingPage ? "Removing Page..." : "Remove This Page"}
            </button>
          ) : null}

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

        <div className="rounded-[2rem] border border-black/10 bg-[#e9e2d0] p-5 shadow-xl shadow-black/5 sm:p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7a5a16]">
            Live Page Preview
          </p>

          <p className="mt-2 text-sm leading-6 text-black/50">
            Preview only. Final spacing, margins, and page numbers are generated
            during formatting.
          </p>

          <div className="mt-6 flex justify-center overflow-x-auto pb-2">
            <div
              className="relative w-[270px] shrink-0 rounded-[1.25rem] bg-white px-7 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:w-[300px] sm:px-9 sm:py-10 xl:w-[310px]"
              style={{ height: "465px" }}
            >
              <div className="h-full overflow-hidden">{previewContent()}</div>
            </div>
          </div>
        </div>
      </div>

      {mounted && showSample
        ? createPortal(
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.62)",
                padding: "24px",
                overflowY: "auto",
              }}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowSample(false);
              }}
            >
              <div
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:max-h-[82vh] sm:overflow-auto sm:p-8"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b38b16]">
                      Sample
                    </p>

                    <h2 className="mt-2 text-3xl font-black">
                      {isCustomPage ? pageTitle || activeSection?.title : activeSection?.title}
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

                {!isTitlePage ? (
                  <button
                    type="button"
                    onClick={useSampleAsDraft}
                    className="mt-6 w-full rounded-2xl bg-black px-6 py-4 font-black text-[#d4af37] transition hover:-translate-y-0.5"
                  >
                    Use This as Starter Draft
                  </button>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
