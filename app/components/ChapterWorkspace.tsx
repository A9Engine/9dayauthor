"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";


type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  reader_outcome: string;
  content: string;
  status: string;
};

type SpeechRecognitionType = typeof window extends never
  ? never
  : any;

export default function ChapterWorkspace({
  projectTitle,
  chapters,
}: {
  projectTitle: string;
  chapters: Chapter[];
}) {
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id);
  const activeChapter =
    chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0];

  const [chapterContent, setChapterContent] = useState(
    activeChapter?.content || ""
  );

  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState(activeChapter?.content || "");

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const wordCount = useMemo(() => {
    return chapterContent.trim()
      ? chapterContent.trim().split(/\s+/).length
      : 0;
  }, [chapterContent]);

  const estimatedPages = useMemo(() => {
    return Math.max(0, wordCount / 275).toFixed(1);
  }, [wordCount]);

  function switchChapter(chapterId: string) {
    const nextChapter = chapters.find((chapter) => chapter.id === chapterId);
    setActiveChapterId(chapterId);
    setChapterContent(nextChapter?.content || "");
    setInterimTranscript("");
    setVoiceError("");
  }

function cleanVoiceText(text: string) {
  return text
    .replace(/\bperiod\b/gi, ".")
    .replace(/\bcomma\b/gi, ",")
    .replace(/\bcolon\b/gi, ":")
    .replace(/\bsemicolon\b/gi, ";")
    .replace(/\bquestion mark\b/gi, "?")
    .replace(/\bexclamation point\b/gi, "!")
    .replace(/\bexclamation mark\b/gi, "!")
    .replace(/\bnew paragraph\b/gi, "\n\n")
    .replace(/\bnew line\b/gi, "\n")
    .replace(/\s+([.,:;?!])/g, "$1")
    .replace(/([.,:;?!])(?=\S)/g, "$1 ");
}

async function saveChapter() {
  if (!activeChapter?.id) return;

  try {
    setIsSaving(true);
    setSaveMessage("");

    const { error } = await supabase
      .from("book_chapters")
      .update({
      content: chapterContent,
      word_count: wordCount,
      updated_at: new Date().toISOString(),
    })
      .eq("id", activeChapter.id);

    if (error) {
      setSaveMessage("Could not save chapter.");
      console.error(error);
      return;
    }
    setLastSavedContent(chapterContent);
    setSaveMessage("Chapter saved.");
  } catch (error) {
    console.error(error);
    setSaveMessage("Something went wrong.");
  } finally {
    setIsSaving(false);

    setTimeout(() => {
      setSaveMessage("");
    }, 2500);
  }
}

useEffect(() => {
  if (!activeChapter?.id) return;
  if (chapterContent === lastSavedContent) return;

  const autoSaveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from("book_chapters")
      .update({
        content: chapterContent,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeChapter.id);

    if (error) {
      console.error("Auto-save failed:", error);
      return;
    }

    setLastSavedContent(chapterContent);
    setSaveMessage("Auto-saved.");

    setTimeout(() => {
      setSaveMessage("");
    }, 1800);
  }, 20000);

  return () => clearTimeout(autoSaveTimer);
}, [chapterContent, wordCount, activeChapter?.id, lastSavedContent]);

  function startVoiceDraft() {
    setVoiceError("");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice drafting is not supported in this browser yet. Try Chrome for the first version."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += cleanVoiceText(transcript) + " ";
        } else {
          interimText += transcript;
        }
      }

      if (finalText) {
        setChapterContent((current) =>
          `${current}${current.trim() ? " " : ""}${finalText.trim()}`
        );
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = () => {
      setVoiceError("Voice recording stopped. Tap Voice Draft to start again.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  function stopVoiceDraft() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    setInterimTranscript("");
  }

  if (!activeChapter) {
    return <div>No chapters found.</div>;
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5">
        <div className="mb-5">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
            Your Chapters
          </div>

          <h2 className="mt-2 text-2xl font-black">{projectTitle}</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-3 lg:overflow-visible">
          {chapters.map((chapter) => {
            const isActive = chapter.id === activeChapter.id;

            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => switchChapter(chapter.id)}
                className={`min-w-[240px] cursor-pointer rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md lg:min-w-0 ${
                  isActive
                    ? "border-[#d4af37] bg-[#fff6d8]"
                    : "border-black/10 bg-[#faf8f3] hover:border-[#d4af37]/60"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/45">
                  Chapter {chapter.chapter_number}
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

      <section className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
              Current Chapter
            </div>

            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              {activeChapter.title}
            </h1>
          </div>

          <div className="w-fit rounded-full bg-[#fff2c7] px-4 py-2 text-sm font-bold text-[#7a5a16]">
            Draft
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-[#faf8f3] p-5">
            <div className="text-sm font-bold uppercase tracking-[0.14em] text-black/45">
              Chapter Direction
            </div>

            <p className="mt-3 leading-7 text-black/65">
              {activeChapter.description}
            </p>
          </div>

          <div className="rounded-3xl border border-[#d4af37]/25 bg-[#fff8df] p-5">
            <div className="text-sm font-bold uppercase tracking-[0.14em] text-[#7a5a16]">
              Reader Outcome
            </div>

            <p className="mt-3 leading-7 text-black/70">
              {activeChapter.reader_outcome}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
              Words
            </div>
            <div className="mt-1 text-2xl font-black">{wordCount}</div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
              Estimated Pages
            </div>
            <div className="mt-1 text-2xl font-black">{estimatedPages}</div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-black/10 bg-[#faf8f3] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.14em] text-black/45">
                Manuscript Workspace
              </div>
              <p className="mt-1 text-sm text-black/50">
                Talk naturally and watch your chapter appear in real time.
              </p>
            </div>

            {isRecording ? (
              <button
                type="button"
                onClick={stopVoiceDraft}
                className="w-full cursor-pointer rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-90 sm:w-auto"
              >
                ■ Stop Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceDraft}
                className="w-full cursor-pointer rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:opacity-90 sm:w-auto"
              >
                🎙 Voice Draft
              </button>
            )}
          </div>

          {isRecording ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                Listening...
              </div>

              <div className="mt-2 min-h-[28px] text-sm leading-6 text-black/60">
                {interimTranscript || "Start speaking. Your words will appear below."}
              </div>
            </div>
          ) : null}

          {voiceError ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
              {voiceError}
            </div>
          ) : null}

          <textarea
            placeholder="Start writing your chapter here..."
            value={chapterContent}
            onChange={(event) => setChapterContent(event.target.value)}
            className="min-h-[360px] w-full rounded-[1.5rem] border border-black/10 bg-white p-5 text-base leading-8 outline-none transition focus:border-[#d4af37] sm:min-h-[420px] sm:p-6 sm:text-lg"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
          type="button"
          onClick={saveChapter}
          disabled={isSaving}
          className="cursor-pointer rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Chapter"}
        </button>

          <button className="cursor-pointer rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 hover:bg-[#f3efe7]">
            Generate Outline
          </button>

          <button className="cursor-pointer rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 hover:bg-[#f3efe7]">
            Expand Ideas
          </button>

          <button className="cursor-pointer rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-sm font-black transition hover:-translate-y-0.5 hover:bg-[#f3efe7]">
            Add Emotion
          </button>
        </div>
        {saveMessage ? (
  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
    {saveMessage}
  </div>
) : null}
      </section>
    </div>
  );
}