"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase";
import VoiceDictationButton from "./VoiceDictationButton";

type Chapter = {
  id: string;
  project_id?: string;
  user_id?: string;
  chapter_number: number;
  title: string;
  description: string;
  reader_outcome: string;
  content: string;
  status: string;
};

type AiAction =
  | "expand"
  | "add_emotion"
  | "generate_outline"
  | "continue_writing";

type StructureDraft = {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  reader_outcome: string;
};

export default function ChapterWorkspace({
  projectTitle,
  targetLength,
  chapters,
  initialChapterId,
}: {
  projectTitle: string;
  targetLength: string;
  chapters: Chapter[];
  initialChapterId?: string;
}) {
  const [localChapters, setLocalChapters] = useState<Chapter[]>(chapters);
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);
  const [structureEditorOpen, setStructureEditorOpen] = useState(false);
  const [structureDrafts, setStructureDrafts] = useState<StructureDraft[]>([]);
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  useEffect(() => {
    setLocalChapters(chapters);
  }, [chapters]);

  const [activeChapterId, setActiveChapterId] = useState<string | undefined>(
  initialChapterId && chapters.some((chapter) => chapter.id === initialChapterId)
    ? initialChapterId
    : chapters[0]?.id
);

  const activeChapter =
    localChapters.find((chapter) => chapter.id === activeChapterId) ||
    localChapters[0];

  useEffect(() => {
  if (!localChapters.length) return;

  const params = new URLSearchParams(window.location.search);
  const chapterIdFromUrl = params.get("chapterId");

  const matchingChapter = localChapters.find(
    (chapter) => chapter.id === chapterIdFromUrl
  );

  if (matchingChapter) {
    setActiveChapterId(matchingChapter.id);
    return;
  }

  if (
    initialChapterId &&
    localChapters.some((chapter) => chapter.id === initialChapterId)
  ) {
    setActiveChapterId(initialChapterId);
  }
}, [initialChapterId, localChapters]);

  const [chapterContent, setChapterContent] = useState(activeChapter?.content || "");
  const [lastSavedContent, setLastSavedContent] = useState(activeChapter?.content || "");

  const [aiSuggestionsByChapter, setAiSuggestionsByChapter] = useState<Record<string, string>>({});
  const [aiSuggestionLabelsByChapter, setAiSuggestionLabelsByChapter] = useState<Record<string, string>>({});

  const aiSuggestion = activeChapter?.id ? aiSuggestionsByChapter[activeChapter.id] || "" : "";
  const aiSuggestionLabel = activeChapter?.id ? aiSuggestionLabelsByChapter[activeChapter.id] || "" : "";

  const [selectedText, setSelectedText] = useState("");
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isAddingEmotion, setIsAddingEmotion] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isContinuingWriting, setIsContinuingWriting] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dots, setDots] = useState(1);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const anyLoading = isExpanding || isAddingEmotion || isGeneratingOutline || isContinuingWriting;
    if (!anyLoading) return;

    const interval = setInterval(() => {
      setDots((current) => (current >= 3 ? 1 : current + 1));
    }, 450);

    return () => clearInterval(interval);
  }, [isExpanding, isAddingEmotion, isGeneratingOutline, isContinuingWriting]);

  const wordCount = useMemo(() => {
    return chapterContent.trim() ? chapterContent.trim().split(/\s+/).length : 0;
  }, [chapterContent]);

  const estimatedPages = useMemo(() => {
    return Math.max(0, wordCount / 275).toFixed(1);
  }, [wordCount]);

  const estimatedBookPages = useMemo(() => {
  const totalWords = localChapters.reduce((sum, chapter) => {
    const content =
      chapter.id === activeChapter?.id
        ? chapterContent
        : chapter.content || "";

    const chapterWords = content.trim()
      ? content.trim().split(/\s+/).length
      : 0;

    return sum + chapterWords;
  }, 0);

  return (totalWords / 275).toFixed(1);
}, [localChapters, activeChapter?.id, chapterContent]);

  const targetBookPages = useMemo(() => {
    const match = String(targetLength || "").match(/\d+/);
    return match ? Number(match[0]) : 200;
  }, [targetLength]);

  const targetChapterPages = useMemo(() => {
    if (!localChapters.length) return 0;
    return Math.max(1, targetBookPages / localChapters.length);
  }, [targetBookPages, localChapters.length]);

  const chapterProgressPercent = useMemo(() => {
    if (!targetChapterPages) return 0;
    return Math.min(100, Math.round((Number(estimatedPages) / targetChapterPages) * 100));
  }, [estimatedPages, targetChapterPages]);

  const isChapterComplete = Number(estimatedPages) >= targetChapterPages;

  const selectedWordCount = useMemo(() => {
    return selectedText.trim() ? selectedText.trim().split(/\s+/).filter(Boolean).length : 0;
  }, [selectedText]);

  const coachingStatus = useMemo(() => {
  const currentPages = Number(estimatedPages);
  const progress = targetChapterPages
    ? (currentPages / targetChapterPages) * 100
    : 0;

  if (progress >= 120) {
    return {
      label: "Exceeded Expectations",
      message:
        "You've gone beyond the original goal. Review for pacing, but celebrate the depth you've created.",
    };
  }

  if (progress >= 100) {
    return {
      label: "Chapter Complete",
      message:
        "Excellent work. This chapter has reached the target depth and pacing.",
    };
  }

  if (progress >= 90) {
    return {
      label: "Almost There",
      message:
        "You're very close. Focus on a strong ending and a final layer of clarity.",
    };
  }

  if (progress >= 50) {
    return {
      label: "On Track",
      message:
        "This chapter is pacing well. Continue building momentum and strengthening your examples.",
    };
  }

  return {
    label: "It's Getting There",
    message:
      "Every book is written one paragraph at a time. Keep going—you’re building something meaningful.",
  };
}, [estimatedPages, targetChapterPages]);

  function loadingText(label: string) {
    return (
      <span className="inline-flex min-w-[130px] justify-center">
        <span>{label}</span>
        <span className="inline-block w-6 text-left">{".".repeat(dots)}</span>
      </span>
    );
  }

  function updateChapterContent(nextContent: string) {
  setChapterContent(nextContent);
  setSaveMessage("");

  if (!activeChapter?.id) return;

  setLocalChapters((currentChapters) =>
    currentChapters.map((chapter) =>
      chapter.id === activeChapter.id
        ? { ...chapter, content: nextContent }
        : chapter
    )
  );
}

  function normalizePastedManuscript(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

function handleManuscriptPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
  event.preventDefault();

  const pastedText = event.clipboardData.getData("text/plain");
  const cleanedText = normalizePastedManuscript(pastedText);

  const textarea = textareaRef.current;
  const start = textarea?.selectionStart ?? chapterContent.length;
  const end = textarea?.selectionEnd ?? chapterContent.length;

  const before = chapterContent.slice(0, start);
  const after = chapterContent.slice(end);

  const nextContent = `${before}${cleanedText}${after}`;

  updateChapterContent(nextContent);

  setTimeout(() => {
    const nextCursorPosition = before.length + cleanedText.length;
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
  }, 0);
}

  function captureSelection() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = chapterContent.slice(start, end);

    setSelectionStart(start);
    setSelectionEnd(end);
    setSelectedText(text);
  }

  function clearSelection() {
    setSelectedText("");
    setSelectionStart(null);
    setSelectionEnd(null);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.selectionStart, textarea.selectionStart);
    }
  }

  async function saveCurrentChapterSilently() {
    if (!activeChapter?.id) return;

    const { error } = await supabase
      .from("book_chapters")
      .update({
        content: chapterContent,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeChapter.id);

    if (error) {
      console.error(error);
      return;
    }

    setLocalChapters((currentChapters) =>
      currentChapters.map((chapter) =>
        chapter.id === activeChapter.id ? { ...chapter, content: chapterContent } : chapter
      )
    );

    setLastSavedContent(chapterContent);
    setLastSavedAt(new Date().toLocaleTimeString());
  }

function updateChapterUrl(chapterId: string) {
  const params = new URLSearchParams(window.location.search);

  params.set("chapterId", chapterId);

  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${params.toString()}`
  );
}

  async function switchChapter(chapterId: string) {
  await saveCurrentChapterSilently();

  const nextChapter = localChapters.find((chapter) => chapter.id === chapterId);

  setActiveChapterId(chapterId);
  updateChapterUrl(chapterId);

  setChapterContent(nextChapter?.content || "");
  setLastSavedContent(nextChapter?.content || "");
  setSelectedText("");
  setSelectionStart(null);
  setSelectionEnd(null);
  setSaveMessage("");
  setLastSavedAt(null);
  setChapterPickerOpen(false);
}

  async function saveChapter() {
    if (!activeChapter?.id) return;

    try {
  setIsSavingStructure(true);
  await saveCurrentChapterSilently();

      const { error } = await supabase
        .from("book_chapters")
        .update({
          content: chapterContent,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeChapter.id);

      if (error) {
        console.error(error);
        setSaveMessage("Could not save chapter.");
        return;
      }

      setLocalChapters((currentChapters) =>
        currentChapters.map((chapter) =>
          chapter.id === activeChapter.id ? { ...chapter, content: chapterContent } : chapter
        )
      );

      setLastSavedContent(chapterContent);
      setLastSavedAt(new Date().toLocaleTimeString());
      setSaveMessage("Chapter saved.");
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 2200);
    }
  }

  useEffect(() => {
    if (!activeChapter?.id) return;
    if (chapterContent === lastSavedContent) return;

    const timer = setTimeout(async () => {
      await saveCurrentChapterSilently();
      setSaveMessage("Auto-saved.");
      setTimeout(() => setSaveMessage(""), 1800);
    }, 5000);

    return () => clearTimeout(timer);
  }, [chapterContent, lastSavedContent, activeChapter?.id]);

  function openStructureEditor() {
  setStructureDrafts(
    localChapters
      .slice()
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((chapter) => ({
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        title: chapter.title || "",
        description: chapter.description || "",
        reader_outcome: chapter.reader_outcome || "",
      }))
  );

  setStructureEditorOpen(true);

  setTimeout(() => {
    document
      .getElementById("book-structure-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

  function updateStructureDraft(
    chapterId: string,
    field: "title" | "description" | "reader_outcome",
    value: string
  ) {
    setStructureDrafts((current) =>
      current.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
      )
    );
  }

  function moveStructureDraft(chapterId: string, direction: "up" | "down") {
    setStructureDrafts((current) => {
      const index = current.findIndex((chapter) => chapter.id === chapterId);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);

      return next.map((chapter, nextIndex) => ({
        ...chapter,
        chapter_number: nextIndex + 1,
      }));
    });
  }

  async function deleteStructureDraft(chapterId: string) {
    const chapter = localChapters.find((item) => item.id === chapterId);
    if (!chapter) return;

    const confirmed = window.confirm(
      `Delete Chapter ${chapter.chapter_number}: ${chapter.title}?\n\nThis will permanently delete this chapter and its manuscript text.`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("book_chapters").delete().eq("id", chapterId);

    if (error) {
      console.error(error);
      setSaveMessage("Could not delete chapter.");
      return;
    }

    const remainingChapters = localChapters
      .filter((item) => item.id !== chapterId)
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((item, index) => ({ ...item, chapter_number: index + 1 }));

    await Promise.all(
      remainingChapters.map((item) =>
        supabase.from("book_chapters").update({ chapter_number: item.chapter_number }).eq("id", item.id)
      )
    );

    setLocalChapters(remainingChapters);
    setStructureDrafts(
      remainingChapters.map((item) => ({
        id: item.id,
        chapter_number: item.chapter_number,
        title: item.title,
        description: item.description,
        reader_outcome: item.reader_outcome,
      }))
    );

    if (activeChapterId === chapterId) {
      const nextActiveChapter = remainingChapters[0];
      setActiveChapterId(nextActiveChapter?.id);
      setChapterContent(nextActiveChapter?.content || "");
      setLastSavedContent(nextActiveChapter?.content || "");
    }

    setSaveMessage("Chapter deleted.");
  }

  async function addChapter() {
    const projectId = activeChapter?.project_id || localChapters[0]?.project_id;
    let userId = activeChapter?.user_id || localChapters[0]?.user_id;

    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!projectId || !userId) {
      setSaveMessage("Could not add chapter because the project ID was not available.");
      return;
    }

    const nextNumber = localChapters.length + 1;

    const { data, error } = await supabase
      .from("book_chapters")
      .insert({
        user_id: userId,
        project_id: projectId,
        chapter_number: nextNumber,
        title: `Chapter ${nextNumber}`,
        description: "Describe what this chapter should help the reader understand.",
        reader_outcome: "",
        content: "",
        status: "draft",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      setSaveMessage("Could not add chapter.");
      return;
    }

    const nextChapters = [...localChapters, data].sort((a, b) => a.chapter_number - b.chapter_number);

    setLocalChapters(nextChapters);
    setStructureDrafts(
      nextChapters.map((chapter) => ({
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        description: chapter.description,
        reader_outcome: chapter.reader_outcome,
      }))
    );
    setActiveChapterId(data.id);
    setChapterContent("");
    setLastSavedContent("");
    setSaveMessage("Chapter added.");
  }

  async function saveStructureChanges() {
    try {
      setIsSavingStructure(true);

      const cleanedDrafts = structureDrafts.map((chapter, index) => ({
        ...chapter,
        chapter_number: index + 1,
        title: chapter.title.trim() || `Chapter ${index + 1}`,
        description: chapter.description.trim(),
        reader_outcome: chapter.reader_outcome.trim(),
      }));

      const updates = await Promise.all(
        cleanedDrafts.map((chapter) =>
          supabase
            .from("book_chapters")
            .update({
              chapter_number: chapter.chapter_number,
              title: chapter.title,
              description: chapter.description,
              reader_outcome: chapter.reader_outcome,
              updated_at: new Date().toISOString(),
            })
            .eq("id", chapter.id)
        )
      );

      const failedUpdate = updates.find((result) => result.error);
      if (failedUpdate?.error) {
        console.error(failedUpdate.error);
        setSaveMessage("Could not save book structure.");
        return;
      }

      const nextChapters = localChapters
        .map((chapter) => {
          const draft = cleanedDrafts.find((item) => item.id === chapter.id);
          return draft ? { ...chapter, ...draft } : chapter;
        })
        .sort((a, b) => a.chapter_number - b.chapter_number);

      setLocalChapters(nextChapters);
      setStructureDrafts(cleanedDrafts);
      setStructureEditorOpen(false);
      setSaveMessage("Book structure saved.");
      setTimeout(() => setSaveMessage(""), 2200);
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong saving the book structure.");
    } finally {
      setIsSavingStructure(false);
    }
  }

  async function runAiAction(action: AiAction) {
    if (!activeChapter?.id) return;

    const actionLabels: Record<AiAction, string> = {
      expand: "Expand Ideas",
      add_emotion: "Add Emotion",
      generate_outline: "Generate Outline",
      continue_writing: "Draft Next Section",
    };

    try {
      if (action === "expand") setIsExpanding(true);
      if (action === "add_emotion") setIsAddingEmotion(true);
      if (action === "generate_outline") setIsGeneratingOutline(true);
      if (action === "continue_writing") setIsContinuingWriting(true);

      const response = await fetch("/api/chapter-ai-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  chapterId: activeChapter.id,
  action,
  chapterTitle: activeChapter.title,
  chapterDescription: activeChapter.description,
  readerOutcome: activeChapter.reader_outcome,
  content: chapterContent,
  selectedText,
  previousChapterContent: localChapters
  .slice()
  .sort((a, b) => a.chapter_number - b.chapter_number)
  .filter((chapter) => chapter.chapter_number < activeChapter.chapter_number)
  .map((chapter) => {
    const content = chapter.content || "";

    return `
Chapter ${chapter.chapter_number}: ${chapter.title}

Chapter Direction:
${chapter.description || "No description provided."}

Reader Outcome:
${chapter.reader_outcome || "No reader outcome provided."}

Chapter Excerpt:
${content.slice(0, 2500)}

Chapter Ending:
${content.slice(-2500)}
`;
  })
  .join("\n\n")
  .slice(-12000),

}),

      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error || "AI action failed.");
        console.error("AI action failed:", result);
        return;
      }

      const suggestion = result.suggestionText || result.output || "";

      if (!suggestion) {
        setSaveMessage("AI returned no suggestion.");
        console.error("AI returned no suggestion:", result);
        return;
      }

      setAiSuggestionsByChapter((current) => ({ ...current, [activeChapter.id]: suggestion }));
      setAiSuggestionLabelsByChapter((current) => ({ ...current, [activeChapter.id]: actionLabels[action] }));
    } catch (error) {
      console.error(error);
      setSaveMessage("Something went wrong.");
    } finally {
      setIsExpanding(false);
      setIsAddingEmotion(false);
      setIsGeneratingOutline(false);
      setIsContinuingWriting(false);
    }
  }

  function clearActiveSuggestion() {
    if (!activeChapter?.id) return;

    setAiSuggestionsByChapter((current) => {
      const updated = { ...current };
      delete updated[activeChapter.id];
      return updated;
    });

    setAiSuggestionLabelsByChapter((current) => {
      const updated = { ...current };
      delete updated[activeChapter.id];
      return updated;
    });
  }

  function addSuggestionToManuscript() {
    if (!activeChapter?.id || !aiSuggestion.trim()) return;
    updateChapterContent(`${chapterContent.trim()}\n\n${aiSuggestion.trim()}`);
    clearActiveSuggestion();
    setSaveMessage("Suggestion added to manuscript.");
  }

  function insertSuggestionAtCursor() {
    if (!aiSuggestion.trim()) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea?.selectionStart ?? chapterContent.length;
    const before = chapterContent.slice(0, cursorPosition);
    const after = chapterContent.slice(cursorPosition);
    const updatedContent = `${before.trimEnd()}\n\n${aiSuggestion.trim()}\n\n${after.trimStart()}`;

    updateChapterContent(updatedContent);
    clearActiveSuggestion();
    setSaveMessage("Suggestion inserted at cursor.");
  }

  function replaceSelectedTextWithSuggestion() {
    if (!aiSuggestion.trim() || selectionStart === null || selectionEnd === null || selectionStart === selectionEnd) {
      setSaveMessage("Select text first, then use Replace Selected Text.");
      return;
    }

    const before = chapterContent.slice(0, selectionStart);
    const after = chapterContent.slice(selectionEnd);
    const updatedContent = `${before}${aiSuggestion.trim()}${after}`;

    updateChapterContent(updatedContent);
    clearActiveSuggestion();
    setSelectedText("");
    setSelectionStart(null);
    setSelectionEnd(null);
    setSaveMessage("Selected text replaced.");
  }

  function copySuggestion() {
    if (!aiSuggestion.trim()) return;
    navigator.clipboard.writeText(aiSuggestion);
    setSaveMessage("Suggestion copied.");
  }

  function discardSuggestion() {
    clearActiveSuggestion();
  }

  if (!activeChapter) {
    return <div>No chapters found.</div>;
  }

  return (
    <>
      <div
  onClick={() => setChapterPickerOpen(false)}
  className="mx-auto grid w-full max-w-7xl gap-6 overflow-x-hidden px-4 py-6 sm:px-8 lg:grid-cols-[340px_1fr]"
>
        <aside className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5">
          <div className="mb-5">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
              Your Chapters
            </div>

            <h2 className="mt-2 text-2xl font-black leading-tight">{projectTitle}</h2>

            <button
              type="button"
              onClick={openStructureEditor}
              className="mt-4 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 hover:bg-white"
            >
              Edit Book Structure
            </button>
          </div>

          <div className="lg:hidden" onClick={(event) => event.stopPropagation()}>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
              Select Chapter
            </label>

            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setChapterPickerOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/45 bg-[#faf8f3] px-5 py-5 text-left text-base font-black leading-6 outline-none transition focus:border-[#d4af37]"
              >
                <span>
                  Chapter {activeChapter.chapter_number}: {activeChapter.title}
                </span>
                <span className="text-xl">⌄</span>
              </button>

              {chapterPickerOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl shadow-black/20">
                  {localChapters
                    .slice()
                    .sort((a, b) => a.chapter_number - b.chapter_number)
                    .map((chapter) => {
                      const isActive = chapter.id === activeChapter.id;

                      return (
                        <button
                          key={chapter.id}
                          type="button"
                          onClick={() => switchChapter(chapter.id)}
                          className={`mb-2 w-full rounded-xl px-4 py-4 text-left text-base font-black leading-6 transition last:mb-0 ${
                            isActive
                              ? "bg-[#d4af37] text-black"
                              : "bg-[#faf8f3] text-black hover:bg-[#fff6d8]"
                          }`}
                        >
                          Chapter {chapter.chapter_number}: {chapter.title}
                        </button>
                      );
                    })}
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-[#d4af37]/25 bg-[#fff8df] p-4">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#7a5a16]">
                Chapter {activeChapter.chapter_number}
              </div>

              <div className="mt-2 font-black leading-6">{activeChapter.title}</div>

              <div className="mt-3 text-sm leading-6 text-black/60">
                {activeChapter.description}
              </div>
            </div>
          </div>

          <div className="hidden space-y-3 lg:block">
            {localChapters
              .slice()
              .sort((a, b) => a.chapter_number - b.chapter_number)
              .map((chapter) => {
                const isActive = chapter.id === activeChapter.id;
                const contentForStatus = isActive ? chapterContent : chapter.content || "";
                const chapterPages = (contentForStatus.trim() ? contentForStatus.trim().split(/\s+/).length : 0) / 275;
                const isComplete = chapterPages >= targetChapterPages;

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => switchChapter(chapter.id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                      isActive
                        ? isComplete
                          ? "border-green-300 bg-green-50"
                          : "border-[#d4af37] bg-[#fff6d8]"
                        : isComplete
                        ? "border-green-200 bg-green-50"
                        : "border-black/10 bg-[#faf8f3]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/45">
                        Chapter {chapter.chapter_number}
                      </div>

                      {isComplete ? (
                        <div className="text-xs font-black text-green-700">Complete</div>
                      ) : null}
                    </div>

                    <div className="mt-2 font-black leading-6">{chapter.title}</div>

                    <div className="mt-3 line-clamp-3 text-sm leading-6 text-black/55">
                      {chapter.description}
                    </div>
                  </button>
                );
              })}
          </div>
        </aside>

        <section className="min-w-0 rounded-[2rem] border border-black/10 bg-white p-4 shadow-xl shadow-black/5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
                Current Chapter
              </div>

              <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                {activeChapter.title}
              </h1>
            </div>

            <div
              className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
                isChapterComplete ? "bg-green-100 text-green-700" : "bg-[#fff2c7] text-[#7a5a16]"
              }`}
            >
              {isChapterComplete ? "Complete" : "Draft"}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-4">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Words</div>
              <div className="mt-1 text-2xl font-black">{wordCount}</div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-4">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Estimated Pages</div>
              <div className="mt-1 text-2xl font-black">{estimatedPages}</div>
            </div>
          </div>

          <div className={`mt-6 rounded-[2rem] p-5 ${isChapterComplete ? "border border-green-200 bg-green-50" : "border border-[#d4af37]/25 bg-[#fff8df]"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-[#7a5a16]">Chapter Coaching</div>
                <h3 className="mt-2 text-2xl font-black">{coachingStatus.label}</h3>
              </div>

              <div className={`w-fit rounded-full px-4 py-2 text-sm font-black ${isChapterComplete ? "bg-green-600 text-white" : "bg-black text-[#d4af37]"}`}>
                {chapterProgressPercent}% of target
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/10">
              <div className={`h-full rounded-full ${isChapterComplete ? "bg-green-500" : "bg-[#d4af37]"}`} style={{ width: `${chapterProgressPercent}%` }} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Target Book</div>
                <div className="mt-1 text-xl font-black">{targetBookPages} pages</div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  Number(estimatedBookPages) >= targetBookPages
                    ? "bg-green-100"
                    : "bg-white"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
                  Estimated Book Length
                </div>

                <div
                  className={`mt-1 text-xl font-black ${
                    Number(estimatedBookPages) >= targetBookPages
                      ? "text-green-700"
                      : ""
                  }`}
                >
                  {estimatedBookPages} pages
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Target Chapter</div>
                <div className="mt-1 text-xl font-black">
  {(targetChapterPages * 0.75).toFixed(1)} – {targetChapterPages.toFixed(1)} pages
</div>
              </div>

              <div className={`rounded-2xl p-4 ${isChapterComplete ? "bg-green-100" : "bg-white"}`}>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">Current Chapter</div>
                <div className={`mt-1 text-xl font-black ${isChapterComplete ? "text-green-700" : ""}`}>{estimatedPages} pages</div>
              </div>
            </div>

            <p className="mt-5 leading-7 text-black/70">{coachingStatus.message}</p>
            {Number(estimatedBookPages) >= targetBookPages ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <h3 className="text-2xl font-black text-green-700">
                🎉 Congratulations!
              </h3>

              <p className="mt-3 leading-7 text-black/70">
                You've completed your manuscript.
              </p>

              <p className="mt-2 leading-7 text-black/70">
                Most people dream of writing a book.
                Very few ever finish one.
              </p>

              <p className="mt-2 leading-7 text-black/70">
                You did. 😎
              </p>

              <p className="mt-4 font-bold text-green-700">
                Next step: review your manuscript and complete your final book pages.
              </p>
            </div>
          ) : null}
          </div>

          <div className="mt-8 rounded-[2rem] border border-black/10 bg-[#faf8f3] p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-black/45">Manuscript Workspace</div>
                <p className="mt-1 text-sm text-black/50">Write naturally, highlight a section, or use AI assistance below.</p>
              </div>

              <VoiceDictationButton value={chapterContent} onChange={updateChapterContent} textareaRef={textareaRef} disabled={isSaving} buttonLabel="Voice Draft" />
            </div>

            <div className="mb-4 rounded-2xl border border-black/10 bg-white p-4 text-sm leading-6 text-black/60">
              Tip: Highlight any paragraph before using AI to improve only that section. Without a highlight, AI will use the whole current chapter.
            </div>

            {selectedText ? (
              <div className="mb-4 rounded-2xl border border-[#d4af37]/25 bg-[#fff8df] p-4 text-sm font-semibold leading-6 text-black/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>Selected text active: {selectedWordCount} words. AI will work on this section first.</span>
                  <button type="button" onClick={clearSelection} className="w-fit rounded-xl bg-black px-3 py-2 text-xs font-black text-[#d4af37] transition hover:-translate-y-0.5">Clear Selection</button>
                </div>
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              value={chapterContent}
              onChange={(e) => updateChapterContent(e.target.value)}
              onPaste={handleManuscriptPaste}
              onSelect={captureSelection}
              onMouseUp={captureSelection}
              onKeyUp={captureSelection}
              placeholder="Start writing your chapter..."
              className="min-h-[420px] w-full max-w-full select-text rounded-[1.5rem] border border-black/10 bg-white p-4 text-base leading-7 outline-none transition focus:border-[#d4af37] sm:p-6 sm:text-lg sm:leading-8"
            />

            {aiSuggestion ? (
              <div className="mt-6 rounded-[2rem] border border-[#d4af37]/30 bg-[#fff8df] p-5">
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-[#7a5a16]">AI Suggestion{aiSuggestionLabel ? `: ${aiSuggestionLabel}` : ""}</div>
                <div className="mt-4 whitespace-pre-wrap break-words leading-8 text-black/75">{aiSuggestion}</div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <button type="button" onClick={addSuggestionToManuscript} className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5">Add to Manuscript</button>
                  <button type="button" onClick={insertSuggestionAtCursor} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">Insert at Cursor</button>
                  <button type="button" onClick={replaceSelectedTextWithSuggestion} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">Replace Selected Text</button>
                  <button type="button" onClick={copySuggestion} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">Copy Suggestion</button>
                  <button type="button" onClick={discardSuggestion} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">Dismiss</button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <button type="button" onClick={saveChapter} disabled={isSaving} className="rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50">
                {isSaving ? "Saving..." : "Save Chapter"}
              </button>

              <button type="button" onClick={() => runAiAction("generate_outline")} disabled={isGeneratingOutline} className="rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-50">
                {isGeneratingOutline ? loadingText("Generating") : "Generate Outline"}
              </button>

              <button type="button" onClick={() => runAiAction("expand")} disabled={isExpanding} className="rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-50">
                {isExpanding ? loadingText("Expanding") : "Expand Ideas"}
              </button>

              <button type="button" onClick={() => runAiAction("add_emotion")} disabled={isAddingEmotion} className="rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-50">
                {isAddingEmotion ? loadingText("Adding Emotion") : "Add Emotion"}
              </button>

              <button type="button" onClick={() => runAiAction("continue_writing")} disabled={isContinuingWriting} className="rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-50">
                {isContinuingWriting ? loadingText("Drafting") : "Draft Next Section"}
              </button>
            </div>

            {saveMessage ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {saveMessage}
                {lastSavedAt ? <span className="ml-2 text-green-600/70">Last saved at {lastSavedAt}</span> : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {mounted && structureEditorOpen
  ? createPortal(
  <div
    className="fixed inset-0 z-[999999] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6 sm:py-10"
    onClick={() => setStructureEditorOpen(false)}
  >
          <div
  id="book-structure-editor"
  onClick={(event) => event.stopPropagation()}
  className="w-full max-w-4xl rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8"
>
            <div className="flex flex-row items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">Book Structure</div>
                <h2 className="mt-2 text-3xl font-black">Edit Chapters</h2>
                <p className="mt-2 max-w-2xl leading-7 text-black/60">
                  Rename chapters, update descriptions, reorder the structure, or add/remove chapters before export.
                </p>
              </div>

              <button type="button" onClick={() => setStructureEditorOpen(false)} aria-label="Close book structure editor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xl font-black text-[#d4af37]">
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {structureDrafts.map((chapter, index) => (
                <div key={chapter.id} className="rounded-[1.5rem] border border-black/10 bg-[#faf8f3] p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-black uppercase tracking-[0.14em] text-[#b38b16]">Chapter {index + 1}</div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => moveStructureDraft(chapter.id, "up")} disabled={index === 0} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black disabled:opacity-35">Move Up</button>
                      <button type="button" onClick={() => moveStructureDraft(chapter.id, "down")} disabled={index === structureDrafts.length - 1} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black disabled:opacity-35">Move Down</button>
                      <button type="button" onClick={() => deleteStructureDraft(chapter.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600">Delete</button>
                    </div>
                  </div>

                  <label className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Chapter Title</label>
                  <input value={chapter.title} onChange={(event) => updateStructureDraft(chapter.id, "title", event.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-bold outline-none focus:border-[#d4af37]" />

                  <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em] text-black/40">Description</label>
                  <textarea value={chapter.description} onChange={(event) => updateStructureDraft(chapter.id, "description", event.target.value)} className="mt-2 min-h-[96px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 leading-7 outline-none focus:border-[#d4af37]" />

                  <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em] text-black/40">Reader Outcome</label>
                  <textarea value={chapter.reader_outcome} onChange={(event) => updateStructureDraft(chapter.id, "reader_outcome", event.target.value)} className="mt-2 min-h-[76px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 leading-7 outline-none focus:border-[#d4af37]" />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={addChapter} className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-black transition hover:-translate-y-0.5">+ Add Chapter</button>
              <button type="button" onClick={saveStructureChanges} disabled={isSavingStructure} className="rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:opacity-50">
                {isSavingStructure ? "Saving Structure..." : "Save Book Structure"}
              </button>
            </div>
          </div>
        </div>
            ,
      document.body
    )
  : null}
    </>
  );
}
