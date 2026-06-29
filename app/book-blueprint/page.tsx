
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ContinueWritingButton from "../components/ContinueWritingButton";
import AuthorLayout from "../components/AuthorLayout";

type BlueprintChapter = {
  id?: string;
  chapter_number?: number;
  title?: string;
  description?: string;
  reader_outcome?: string;
};

type BlueprintOutput = {
  summary?: string;
  core_promise?: string;
  target_reader_profile?: string;
  positioning_angle?: string;
  recommended_chapter_count?: number;
  chapters?: BlueprintChapter[];
};

type ProjectData = {
  id: string;
  title: string;
  author_name: string | null;
  book_type: string | null;
  target_length: string | null;
  audience: string | null;
  book_description: string | null;
  tone: string | null;
  status: string | null;
  blueprint_output: BlueprintOutput | null;
};

type StructureDraft = {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  reader_outcome: string;
};

function createDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `new-${crypto.randomUUID()}`;
  }

  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function BookBlueprintPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "";

  const [project, setProject] = useState<ProjectData | null>(null);
  const [blueprint, setBlueprint] = useState<BlueprintOutput | null>(null);
  const [chapters, setChapters] = useState<StructureDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadBlueprintPage() {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from("book_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError || !projectData) {
        console.error(projectError);
        setProject(null);
        setIsLoading(false);
        return;
      }

      const { data: existingChapters, error: chaptersError } = await supabase
        .from("book_chapters")
        .select("id, chapter_number, title, description, reader_outcome")
        .eq("project_id", projectId)
        .order("chapter_number", { ascending: true });

      if (chaptersError) {
        console.error(chaptersError);
      }

      const nextBlueprint = (projectData.blueprint_output || null) as BlueprintOutput | null;
      const blueprintChapters =
        nextBlueprint?.chapters && nextBlueprint.chapters.length > 0
          ? nextBlueprint.chapters
          : [
              {
                title: "The Moment Everything Changed",
                description:
                  "A focused chapter designed to move the reader closer to the promised transformation.",
                reader_outcome:
                  "The reader understands why this story matters and why they should keep reading.",
              },
            ];

      const nextChapters =
        existingChapters && existingChapters.length > 0
          ? existingChapters.map((chapter: any, index: number) => ({
              id: chapter.id,
              chapter_number: chapter.chapter_number || index + 1,
              title: chapter.title || `Chapter ${index + 1}`,
              description: chapter.description || "",
              reader_outcome: chapter.reader_outcome || "",
            }))
          : blueprintChapters.map((chapter, index) => ({
              id: `blueprint-${index + 1}`,
              chapter_number: index + 1,
              title: chapter.title || `Chapter ${index + 1}`,
              description:
                chapter.description ||
                "A focused chapter designed to move the reader closer to the promised transformation.",
              reader_outcome: chapter.reader_outcome || "",
            }));

      setProject(projectData as ProjectData);
      setBlueprint(nextBlueprint);
      setChapters(nextChapters);
      setIsLoading(false);
    }

    void loadBlueprintPage();
  }, [projectId]);

  function openStructureEditor() {
    setIsOpen(true);
    setMessage("");

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 75);
  }

  function updateChapter(
    chapterId: string,
    field: "title" | "description" | "reader_outcome",
    value: string
  ) {
    setChapters((current) =>
      current.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
      )
    );
  }

  function moveChapter(chapterId: string, direction: "up" | "down") {
    setChapters((current) => {
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

  function addChapter() {
    setChapters((current) => [
      ...current,
      {
        id: createDraftId(),
        chapter_number: current.length + 1,
        title: `Chapter ${current.length + 1}`,
        description:
          "Describe what this chapter should help the reader understand.",
        reader_outcome: "",
      },
    ]);
    setMessage("");
  }

  function deleteChapter(chapterId: string) {
    const chapter = chapters.find((item) => item.id === chapterId);
    if (!chapter) return;

    const confirmed = window.confirm(
      `Delete Chapter ${chapter.chapter_number}: ${chapter.title}?\n\nThis will remove it from the blueprint and chapter workflow.`
    );

    if (!confirmed) return;

    setChapters((current) =>
      current
        .filter((item) => item.id !== chapterId)
        .map((item, index) => ({ ...item, chapter_number: index + 1 }))
    );

    setMessage("");
  }

  async function saveStructureChanges() {
    if (!projectId) return;

    try {
      setIsSaving(true);
      setMessage("Saving book structure...");

      const cleanedChapters = chapters.map((chapter, index) => ({
        id: chapter.id,
        chapter_number: index + 1,
        title: chapter.title.trim() || `Chapter ${index + 1}`,
        description: chapter.description.trim(),
        reader_outcome: chapter.reader_outcome.trim(),
      }));

      const response = await fetch("/api/generate-blueprint", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          blueprint,
          chapters: cleanedChapters,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Could not save book structure.");
        return;
      }

      const savedChapters = Array.isArray(result.chapters)
        ? result.chapters.map((chapter: any, index: number) => ({
            id: chapter.id,
            chapter_number: chapter.chapter_number || index + 1,
            title: chapter.title || `Chapter ${index + 1}`,
            description: chapter.description || "",
            reader_outcome: chapter.reader_outcome || "",
          }))
        : cleanedChapters;

      setChapters(savedChapters);
      setBlueprint(result.blueprint || blueprint);
      setMessage("Book structure saved. Your Chapters page will now use this structure.");
      window.setTimeout(() => setMessage(""), 3500);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong saving the book structure.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!projectId) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Missing project ID</h1>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Project not found</h1>
      </main>
    );
  }

  const blueprintCards = [
    [
      "Target Reader",
      blueprint?.target_reader_profile || project.audience || "Not provided",
    ],
    ["Core Promise", blueprint?.core_promise || "Not generated yet"],
    [
  "Chapter Count",
  `${chapters.length} chapters`,
    ],
  ];

  return (
    <AuthorLayout currentStep={2} projectId={projectId}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
        <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
         <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
  Step 2 of 9
</div>

<h1 className="mt-2 text-3xl font-black sm:text-4xl">
  Blueprint
</h1>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {blueprintCards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-black/10 bg-[#faf8f1] p-5"
              >
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-black/45">
                  {label}
                </div>

                <div className="mt-3 font-bold leading-7">{value}</div>
              </div>
            ))}
          </div>

          {blueprint?.positioning_angle ? (
            <div className="mt-6 rounded-3xl border border-[#d4af37]/30 bg-[#fff8df] p-5">
              <div className="text-sm font-bold uppercase tracking-[0.14em] text-[#7a5a16]">
                Positioning Angle
              </div>
              <p className="mt-3 leading-7 text-black/65">
                {blueprint.positioning_angle}
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
                Book Structure
              </p>

              <h2 className="mt-2 text-3xl font-black">Edit Your Chapter Path</h2>

              <p className="mt-3 max-w-2xl leading-7 text-black/60">
                Rename chapters, update chapter descriptions, reorder the book, or add/remove chapters before you begin writing.
              </p>
            </div>

            <button
              type="button"
              onClick={openStructureEditor}
              className="rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5"
            >
              Edit Book Structure
            </button>
          </div>

          {isOpen ? (
            <div
              ref={editorRef}
              id="book-structure-editor"
              className="mt-8 rounded-[2rem] border border-[#d4af37]/25 bg-[#fff8df] p-5 sm:p-6"
            >
              <div className="flex flex-row items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
                    Blueprint Editor
                  </div>

                  <h3 className="mt-2 text-3xl font-black">Edit Chapters</h3>

                  <p className="mt-2 max-w-2xl leading-7 text-black/60">
                    These changes save back to the blueprint and sync the chapters used in the writing workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close book structure editor"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xl font-black text-[#d4af37]"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="rounded-[1.5rem] border border-black/10 bg-white p-4"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-black uppercase tracking-[0.14em] text-[#b38b16]">
                        Chapter {index + 1}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveChapter(chapter.id, "up")}
                          disabled={index === 0}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black disabled:opacity-35"
                        >
                          Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveChapter(chapter.id, "down")}
                          disabled={index === chapters.length - 1}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black disabled:opacity-35"
                        >
                          Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteChapter(chapter.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <label className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                      Chapter Title
                    </label>
                    <input
                      value={chapter.title}
                      onChange={(event) =>
                        updateChapter(chapter.id, "title", event.target.value)
                      }
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-bold outline-none focus:border-[#d4af37]"
                    />

                    <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em] text-black/40">
                      Description
                    </label>
                    <textarea
                      value={chapter.description}
                      onChange={(event) =>
                        updateChapter(chapter.id, "description", event.target.value)
                      }
                      className="mt-2 min-h-[96px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 leading-7 outline-none focus:border-[#d4af37]"
                    />

                    <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em] text-black/40">
                      Reader Outcome
                    </label>
                    <textarea
                      value={chapter.reader_outcome}
                      onChange={(event) =>
                        updateChapter(chapter.id, "reader_outcome", event.target.value)
                      }
                      className="mt-2 min-h-[76px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 leading-7 outline-none focus:border-[#d4af37]"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={addChapter}
                  className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-black transition hover:-translate-y-0.5"
                >
                  + Add Chapter
                </button>

                <button
                  type="button"
                  onClick={saveStructureChanges}
                  disabled={isSaving}
                  className="rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isSaving ? "Saving Structure..." : "Save Book Structure"}
                </button>
              </div>

              {message ? (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                  {message}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
            <h2 className="text-3xl font-black">Recommended Chapter Path</h2>

            <p className="mt-3 text-black/60">
              This is the structure your chapter workspace will use. Edit it above before writing if you want to rename, add, remove, or reorder chapters.
            </p>

            <div className="mt-8 space-y-4">
              {chapters.map((chapter, index) => (
                <div
                  key={`${chapter.title}-${index}`}
                  className="flex gap-4 rounded-3xl border border-black/10 bg-[#faf8f1] p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-black text-[#d4af37]">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      {chapter.title || `Chapter ${index + 1}`}
                    </h3>

                    <p className="mt-2 leading-7 text-black/60">
                      {chapter.description ||
                        "A focused chapter designed to move the reader closer to the promised transformation."}
                    </p>

                    {chapter.reader_outcome ? (
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-6 text-black/55">
                        Reader outcome: {chapter.reader_outcome}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] bg-[#050505] p-6 text-white shadow-xl shadow-black/10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                Project Details
              </p>

              <div className="mt-6 space-y-4">
                {[
                  ["Author", project.author_name || "Not provided"],
                  ["Book Type", project.book_type || "Not provided"],
                  ["Target Length", project.target_length || "Unknown"],
                  ["Tone", project.tone || "Not provided"],
                  ["Status", project.status || "Draft"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-white/55">{label}</span>
                    <span className="text-right font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5">
              <h3 className="text-2xl font-black">Next Step</h3>

              <p className="mt-3 leading-7 text-black/60">
                After your chapter structure looks right, continue into the chapter builder and begin turning your ideas into a real manuscript.
              </p>

              <ContinueWritingButton projectId={projectId} />
            </div>
          </aside>
        </section>
      </div>
    </AuthorLayout>
  );
}
export default function BookBlueprintPage() {
  return (
    <Suspense fallback={null}>
      <BookBlueprintPageContent />
    </Suspense>
  );
}