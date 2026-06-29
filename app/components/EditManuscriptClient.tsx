"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
type ManuscriptChapter = {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  description?: string | null;
  reader_outcome?: string | null;
  content: string | null;
  word_count: number | null;
  updated_at: string | null;
};

type ManuscriptProject = {
  id: string;
  title: string;
  author_name?: string | null;
  book_description?: string | null;
  audience?: string | null;
  tone?: string | null;
  blueprint_output?: unknown;
};

type ChapterIssue = {
  id?: string;
  type: string;
  original: string;
  suggestion: string;
  reason: string;
};

type BookReviewResult = {
  overallScore?: number;
  structureScore?: number;
  pacingScore?: number;
  consistencyScore?: number;
  publishingReadiness?: string;
  summary?: string;
  strongestChapters?: string[];
  chaptersNeedingAttention?: string[];
  repeatedIdeas?: string[];
  transitionNotes?: string[];
  recommendedNextActions?: string[];
};

function getWordCount(chapter: ManuscriptChapter) {
  if (chapter.word_count && chapter.word_count > 0) return chapter.word_count;

  return chapter.content?.trim()
    ? chapter.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
}

function getEstimatedPages(wordCount: number) {
  return Math.max(0, Math.round(wordCount / 275));
}

function getPreviewParagraphs(content: string | null) {
  if (!content?.trim()) return [];

  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function getChapterReadiness(words: number) {
  if (words >= 1800) {
    return {
      label: "Ready for final polish",
      badgeClass: "bg-green-100 text-green-700",
      cardClass: "border-green-200 bg-green-50",
      message:
        "This chapter has enough depth for a strong editing pass. Focus on clarity, flow, and tightening the language.",
    };
  }

  if (words >= 1200) {
    return {
      label: "Good draft depth",
      badgeClass: "bg-[#fff2c7] text-[#7a5a16]",
      cardClass: "border-[#d4af37]/30 bg-[#fff8e6]",
      message:
        "This chapter has a solid foundation. Review the opening, closing, examples, and transitions before formatting.",
    };
  }

  if (words > 0) {
    return {
      label: "Needs more development",
      badgeClass: "bg-orange-100 text-orange-700",
      cardClass: "border-orange-200 bg-orange-50",
      message:
        "This chapter may feel thin to readers. Consider adding examples, stories, lessons, or a stronger conclusion.",
    };
  }

  return {
    label: "Not drafted yet",
    badgeClass: "bg-red-100 text-red-700",
    cardClass: "border-red-200 bg-red-50",
    message:
      "This chapter does not have manuscript text yet. Draft it before completing your editing pass.",
  };
}

function formatDate(value: string | null) {
  if (!value) return "Not saved yet";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatChapterForDownload(chapter: ManuscriptChapter) {
  const text = chapter.content || "";
  const body = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");

  return `Chapter ${chapter.chapter_number}: ${chapter.title}\n\n${body}\n`;
}

function replaceFirstExact(source: string, original: string, replacement: string) {
  if (!original.trim()) return source;
  const index = source.indexOf(original);
  if (index === -1) return source;
  return `${source.slice(0, index)}${replacement}${source.slice(index + original.length)}`;
}

export default function EditManuscriptClient({
  project,
  chapters,
}: {
  project: ManuscriptProject;
  chapters: ManuscriptChapter[];
}) {
  const [localChapters, setLocalChapters] = useState<ManuscriptChapter[]>(chapters);
  const [selectedChapter, setSelectedChapter] = useState<ManuscriptChapter | null>(null);
  const [issues, setIssues] = useState<ChapterIssue[]>([]);
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [acceptedIssueIndexes, setAcceptedIssueIndexes] = useState<number[]>([]);
  const [isReviewingChapter, setIsReviewingChapter] = useState(false);
  const [reviewingChapterId, setReviewingChapterId] = useState<string | null>(null);
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);
  const [chapterReviewMessage, setChapterReviewMessage] = useState("");
  const [bookReview, setBookReview] = useState<BookReviewResult | null>(null);
  const [isReviewingBook, setIsReviewingBook] = useState(false);
  const [bookReviewMessage, setBookReviewMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedChapter) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedChapter]);


  const totalWords = useMemo(
    () => localChapters.reduce((sum, chapter) => sum + getWordCount(chapter), 0),
    [localChapters]
  );

  const estimatedPages = getEstimatedPages(totalWords);
  const chaptersWithDrafts = localChapters.filter((chapter) => getWordCount(chapter) > 0).length;
  const chaptersReadyForPolish = localChapters.filter((chapter) => getWordCount(chapter) >= 1200).length;
  const chaptersNeedingWork = localChapters.filter((chapter) => getWordCount(chapter) < 1200);
  const editingProgress = localChapters.length
    ? Math.round((chaptersReadyForPolish / localChapters.length) * 100)
    : 0;

  const currentIssue = issues[currentIssueIndex];

  async function runChapterReview(chapter: ManuscriptChapter) {
    setSelectedChapter(chapter);
    setIssues([]);
    setCurrentIssueIndex(0);
    setAcceptedIssueIndexes([]);
    setChapterReviewMessage("");
    setIsReviewingChapter(true);
    setReviewingChapterId(chapter.id);

    try {
      const response = await fetch("/api/chapter-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setChapterReviewMessage(result.error || "Could not review chapter.");
        return;
      }

      const nextIssues = Array.isArray(result.issues) ? result.issues : [];
      setIssues(nextIssues);

      if (!nextIssues.length) {
        setChapterReviewMessage("No specific edits found. This chapter looks ready for final polish.");
      }
    } catch (error) {
      console.error(error);
      setChapterReviewMessage("Something went wrong while reviewing this chapter.");
    } finally {
      setIsReviewingChapter(false);
      setReviewingChapterId(null);
    }
  }

  async function runBookReview() {
    setIsReviewingBook(true);
    setBookReviewMessage("");

    try {
      const response = await fetch("/api/book-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setBookReviewMessage(result.error || "Could not review manuscript.");
        return;
      }

      setBookReview(result.review || null);
    } catch (error) {
      console.error(error);
      setBookReviewMessage("Something went wrong while reviewing the manuscript.");
    } finally {
      setIsReviewingBook(false);
    }
  }

  function acceptCurrentIssue() {
    if (!currentIssue) return;

    setAcceptedIssueIndexes((current) =>
      current.includes(currentIssueIndex) ? current : [...current, currentIssueIndex]
    );

    setCurrentIssueIndex((current) => Math.min(issues.length - 1, current + 1));
  }

  function skipCurrentIssue() {
    setCurrentIssueIndex((current) => Math.min(issues.length - 1, current + 1));
  }

  async function applyAcceptedEdits() {
    if (!selectedChapter) return;

    const acceptedIssues = acceptedIssueIndexes
      .slice()
      .sort((a, b) => a - b)
      .map((index) => issues[index])
      .filter(Boolean);

    if (!acceptedIssues.length) {
      setChapterReviewMessage("No accepted edits to apply.");
      return;
    }

    let finalContent = selectedChapter.content || "";

    acceptedIssues.forEach((issue) => {
      finalContent = replaceFirstExact(finalContent, issue.original, issue.suggestion);
    });

    setIsApplyingEdits(true);

    try {
      const response = await fetch("/api/apply-chapter-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: selectedChapter.id,
          finalContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setChapterReviewMessage(result.error || "Could not apply edits.");
        return;
      }

      const nextChapter = {
        ...selectedChapter,
        content: finalContent,
        word_count: result.wordCount,
        updated_at: new Date().toISOString(),
      };

      setLocalChapters((current) =>
        current.map((chapter) => (chapter.id === selectedChapter.id ? nextChapter : chapter))
      );
      setSelectedChapter(nextChapter);
      setChapterReviewMessage(`Applied ${acceptedIssues.length} accepted changes.`);
      setIssues([]);
      setAcceptedIssueIndexes([]);
      setCurrentIssueIndex(0);
    } catch (error) {
      console.error(error);
      setChapterReviewMessage("Something went wrong applying edits.");
    } finally {
      setIsApplyingEdits(false);
    }
  }

  function closeReviewModal() {
    setSelectedChapter(null);
    setIssues([]);
    setCurrentIssueIndex(0);
    setAcceptedIssueIndexes([]);
    setChapterReviewMessage("");
  }

  function downloadChapterTxt(chapter: ManuscriptChapter) {
    const blob = new Blob([formatChapterForDownload(chapter)], {
      type: "text/plain;charset=utf-8",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chapter-${chapter.chapter_number}-${chapter.title || "chapter"}`
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase() + ".txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">

          <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
            Step 4 of 9
          </div>

          <h1 className="mt-2 text-4xl font-black">
            Edit Manuscript
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">
            Review your drafted chapters, identify thin sections, and make your final edits before adding front matter, back matter, and formatting your book for publishing.
          </p>

          <div className="mx-auto mt-8 max-w-4xl rounded-[2rem] border border-[#d4af37]/25 bg-[#fff8df] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-black uppercase tracking-[0.14em] text-[#7a5a16]">
                  Editing Pass
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <h2 className="text-2xl font-black leading-tight">{project.title}</h2>

                  <div className="w-fit rounded-full bg-green-600 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm">
                    {editingProgress}% Ready
                  </div>
                </div>

                <p className="mt-3 max-w-3xl leading-7 text-black/65">
                  This is the second-pass editing dashboard. Use it to spot weak chapters, run AI edits, check book-level pacing, and jump back into any chapter that needs more work.
                </p>
              </div>

              <button
                type="button"
                onClick={runBookReview}
                disabled={isReviewingBook}
                className="rounded-2xl bg-[#d4af37] px-5 py-4 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#e6c24a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReviewingBook ? "Reviewing Book..." : "Run AI Book Editor"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Words", totalWords.toLocaleString()],
            ["Estimated Pages", String(estimatedPages)],
            ["Total Chapters", String(localChapters.length)],
            ["Chapters Ready", `${chaptersReadyForPolish}/${localChapters.length}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
              <div className="text-sm font-semibold text-black/45">{label}</div>
              <div className="mt-3 text-3xl font-black">{value}</div>
            </div>
          ))}
        </div>

        {bookReview || bookReviewMessage ? (
          <section className="mt-8 rounded-[2rem] border border-[#d4af37]/25 bg-white p-6 shadow-lg shadow-black/5 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b38b16]">
              AI Book Editor
            </p>
            <h2 className="mt-2 text-3xl font-black">Whole-book review</h2>

            {bookReviewMessage ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {bookReviewMessage}
              </div>
            ) : null}

            {bookReview ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
                <div className="rounded-[2rem] bg-black p-6 text-center text-[#d4af37]">
                  <div className="text-sm font-black uppercase tracking-[0.14em]">Book Score</div>
                  <div className="mt-3 text-6xl font-black">{bookReview.overallScore ?? "—"}</div>
                  <div className="mt-3 text-sm font-semibold text-white/60">
                    {bookReview.publishingReadiness || "Publishing readiness review"}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ["Structure", bookReview.structureScore],
                    ["Pacing", bookReview.pacingScore],
                    ["Consistency", bookReview.consistencyScore],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-3xl border border-black/10 bg-[#faf8f1] p-5">
                      <div className="text-sm font-bold uppercase tracking-[0.14em] text-black/40">{label}</div>
                      <div className="mt-2 text-3xl font-black">{value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  <p className="rounded-3xl border border-black/10 bg-[#faf8f1] p-5 leading-7 text-black/70">
                    {bookReview.summary}
                  </p>
                </div>

                {[
                  ["Strongest Chapters", bookReview.strongestChapters],
                  ["Chapters Needing Attention", bookReview.chaptersNeedingAttention],
                  ["Repeated Ideas", bookReview.repeatedIdeas],
                  ["Transition Notes", bookReview.transitionNotes],
                  ["Recommended Next Actions", bookReview.recommendedNextActions],
                ].map(([title, items]) =>
                  Array.isArray(items) && items.length ? (
                    <div key={String(title)} className="rounded-3xl border border-black/10 bg-[#faf8f1] p-5">
                      <div className="text-lg font-black">{String(title)}</div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-black/65">
                        {items.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg shadow-black/5 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b38b16]">
              Editorial Checklist
            </p>
            <h2 className="mt-2 text-3xl font-black">What to check before formatting</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Opening strength", "Does each chapter pull the reader in quickly and clearly?"],
                ["Chapter promise", "Does each chapter deliver on the reader outcome from the blueprint?"],
                ["Clarity and flow", "Are the ideas easy to follow without long, confusing sections?"],
                ["Examples and stories", "Are there enough real examples, lessons, or scenes to make the chapter feel alive?"],
                ["Repetition check", "Are you repeating the same point too often across chapters?"],
                ["Closing strength", "Does each chapter end with a useful takeaway or clear transition?"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-3xl border border-black/10 bg-[#faf8f1] p-5">
                  <div className="text-lg font-black">{title}</div>
                  <p className="mt-2 leading-7 text-black/60">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-black/10 bg-[#050505] p-6 text-white shadow-lg shadow-black/10">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#d4af37]">
              Editing Guidance
            </p>
            <h3 className="mt-3 text-2xl font-black">How to use this step</h3>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/65">
              <p>Use AI Chapter Editor for sentence-level edits like grammar, clarity, readability, and awkward wording.</p>
              <p>Use AI Book Editor for whole-book issues like pacing, chapter order, repetition, transitions, and whether the book delivers on its promise.</p>
              <p>Print or download individual chapters when you want to review on paper or send a chapter to someone else.</p>
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/55">Drafted Chapters</div>
              <div className="mt-2 text-3xl font-black text-[#d4af37]">{chaptersWithDrafts}/{localChapters.length}</div>
            </div>
          </aside>
        </div>

        {chaptersNeedingWork.length ? (
          <div className="mt-8 rounded-[2rem] border border-[#d4af37]/30 bg-[#fff8e6] p-6">
            <div className="text-lg font-black text-[#7a5a16]">Chapters to review first</div>
            <p className="mt-2 max-w-3xl leading-7 text-[#7a5a16]/80">
              These chapters are either thin or not drafted yet. Start here before moving into final formatting.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {chaptersNeedingWork.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/chapters?id=${project.id}&chapterId=${chapter.id}`}
                  className="rounded-full border border-[#d4af37]/30 bg-white px-4 py-2 text-sm font-bold text-[#7a5a16] transition hover:bg-[#fff3cf]"
                >
                  Chapter {chapter.chapter_number}: {chapter.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b38b16]">
            Chapter Editing Review
          </p>
          <h2 className="mt-2 text-3xl font-black">Review each chapter before formatting</h2>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {localChapters.map((chapter) => {
              const words = getWordCount(chapter);
              const estimatedChapterPages = getEstimatedPages(words);
              const readiness = getChapterReadiness(words);
              const previewParagraphs = getPreviewParagraphs(chapter.content);

              return (
                <article key={chapter.id} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-lg shadow-black/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#b38b16]">
                        Chapter {chapter.chapter_number}
                      </div>
                      <h3 className="mt-2 text-2xl font-black leading-tight">{chapter.title}</h3>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-black ${readiness.badgeClass}`}>{readiness.label}</div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[#faf8f1] p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Words</div>
                      <div className="mt-1 text-xl font-black">{words.toLocaleString()}</div>
                    </div>
                    <div className="rounded-2xl bg-[#faf8f1] p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Est. Pages</div>
                      <div className="mt-1 text-xl font-black">{estimatedChapterPages}</div>
                    </div>
                    <div className="rounded-2xl bg-[#faf8f1] p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Last Saved</div>
                      <div className="mt-1 text-sm font-black">{formatDate(chapter.updated_at)}</div>
                    </div>
                  </div>

                  <div className={`mt-5 rounded-2xl border p-4 ${readiness.cardClass}`}>
                    <p className="text-sm font-semibold leading-6 text-black/70">{readiness.message}</p>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-black/10 bg-[#faf8f3] p-5">
                    <div className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-black/40">Chapter Preview</div>
                    {previewParagraphs.length ? (
                      <div className="space-y-4 text-base leading-8 text-black/70">
                        {previewParagraphs.map((paragraph, index) => (
                          <p key={`${chapter.id}-preview-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="leading-7 text-black/50">No chapter content written yet.</p>
                    )}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Link href={`/chapters?id=${project.id}&chapterId=${chapter.id}`} className="inline-flex justify-center rounded-2xl bg-black px-4 py-3 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5">
                      Edit Chapter
                    </Link>
                    <button
                      type="button"
                      onClick={() => runChapterReview(chapter)}
                      disabled={isReviewingChapter}
                      className="rounded-2xl border border-[#d4af37]/35 bg-[#fff8df] px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                    >
                      {reviewingChapterId === chapter.id ? "Reviewing Chapter..." : "AI Chapter Editor"}
                    </button>
                    <a href={`/print-chapter?projectId=${project.id}&chapterId=${chapter.id}`} target="_blank" className="inline-flex justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5">
                      Print
                    </a>
                    <a href={`/api/download-chapter?chapterId=${chapter.id}`} className="inline-flex justify-center rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5">
                      Download
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {mounted && selectedChapter
        ? createPortal(
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483647,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflowY: "auto",
                background: "rgba(0,0,0,0.62)",
                padding: "24px 16px",
              }}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeReviewModal();
              }}
            >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "896px",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              borderRadius: "2rem",
              background: "#ffffff",
              padding: "24px",
              boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b38b16]">AI Chapter Editor</p>
                <h2 className="mt-2 text-3xl font-black">Chapter {selectedChapter.chapter_number}: {selectedChapter.title}</h2>
                <p className="mt-2 max-w-2xl leading-7 text-black/60">
                  Review sentence-level suggestions one by one. Accept only the edits you want, then apply them to the chapter.
                </p>
              </div>
              <button type="button" onClick={closeReviewModal} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xl font-black text-[#d4af37]">×</button>
            </div>

            {isReviewingChapter ? (
              <div className="mt-8 rounded-3xl border border-[#d4af37]/25 bg-[#fff8df] p-6 text-lg font-black">
                Reviewing chapter...
              </div>
            ) : null}

            {chapterReviewMessage ? (
              <div className="mt-6 rounded-2xl border border-[#d4af37]/25 bg-[#fff8df] p-4 text-sm font-bold text-[#7a5a16]">
                {chapterReviewMessage}
              </div>
            ) : null}

            {currentIssue ? (
              <div className="mt-8 rounded-[2rem] border border-black/10 bg-[#faf8f3] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.14em] text-[#b38b16]">
                      Issue {currentIssueIndex + 1} of {issues.length}
                    </div>
                    <h3 className="mt-2 text-2xl font-black capitalize">{currentIssue.type}</h3>
                  </div>
                  <div className="rounded-full bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#d4af37]">
                    {acceptedIssueIndexes.length} Accepted
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-red-100 bg-white p-5">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-red-500">Current</div>
                    <p className="mt-3 whitespace-pre-wrap leading-8 text-black/75">{currentIssue.original}</p>
                  </div>
                  <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-green-700">Suggested</div>
                    <p className="mt-3 whitespace-pre-wrap leading-8 text-black/75">{currentIssue.suggestion}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-black/65">
                  {currentIssue.reason}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={acceptCurrentIssue} className="rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5">
                    Accept Change
                  </button>
                  <button type="button" onClick={skipCurrentIssue} className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-black transition hover:-translate-y-0.5">
                    Skip
                  </button>
                  <button type="button" onClick={() => setCurrentIssueIndex((current) => Math.max(0, current - 1))} disabled={currentIssueIndex === 0} className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-40">
                    Previous
                  </button>
                </div>
              </div>
            ) : !isReviewingChapter && issues.length ? (
              <div className="mt-8 rounded-[2rem] border border-green-200 bg-green-50 p-6">
                <h3 className="text-2xl font-black text-green-700">Review Complete</h3>
                <p className="mt-3 leading-7 text-black/70">
                  You accepted {acceptedIssueIndexes.length} of {issues.length} suggested edits.
                </p>
                <button type="button" onClick={applyAcceptedEdits} disabled={isApplyingEdits || !acceptedIssueIndexes.length} className="mt-5 rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                  {isApplyingEdits ? "Applying Edits..." : `Apply ${acceptedIssueIndexes.length} Accepted Changes`}
                </button>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )
    : null}
    </>
  );
}
