"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import AuthorLayout from "../components/AuthorLayout";


export default function NewBookPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [bookType, setBookType] = useState("Self Help");
  const [targetLength, setTargetLength] = useState("150 pages");
  const [audience, setAudience] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [tone, setTone] = useState("Inspirational");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingDotCount, setLoadingDotCount] = useState(1);

  useEffect(() => {
  if (!isSaving) {
    setLoadingDotCount(1);
    return;
  }

  const interval = setInterval(() => {
    setLoadingDotCount((current) => (current >= 3 ? 1 : current + 1));
  }, 450);

  return () => clearInterval(interval);
}, [isSaving]);

  async function handleCreateBook() {
  setErrorMessage("");

  if (!title.trim()) {
    setErrorMessage("Please enter a book title.");
    return;
  }

  if (!bookDescription.trim()) {
    setErrorMessage("Please describe what your book is about.");
    return;
  }

  setIsSaving(true);

  const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  setIsSaving(false);
  setErrorMessage("Please log in before creating a book.");
  return;
}

  const finalBookType = bookType;

  const { data, error } = await supabase
    .from("book_projects")
    .insert({
      user_id: user.id,
      title: title.trim(),
      author_name: authorName.trim(),
      book_type: finalBookType,
      target_length: targetLength,
      audience: audience.trim(),
      book_description: bookDescription.trim(),
      tone,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    setIsSaving(false);
    setErrorMessage(error.message);
    return;
  }

  const blueprintResponse = await fetch("/api/generate-blueprint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: data.id,
    }),
  });

  if (!blueprintResponse.ok) {
    const result = await blueprintResponse.json();
    setIsSaving(false);
    setErrorMessage(
      result.error ||
        "The book project was saved, but blueprint generation failed."
    );
    return;
  }

  setIsSaving(false);
  router.push(`/book-blueprint?id=${data.id}`);
}

  return (
   <AuthorLayout currentStep={1}>

  <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
            Start Your Book
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight">
            Create a New Book Project
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">
            Tell us about your book idea and 9 Day Author will guide you from
            concept to published manuscript.
          </p>
        </div>

        <div className="mt-10 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-6">
            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                Book Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="The Freedom Blueprint"
                className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none transition focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                Author Name
              </label>

              <input
                type="text"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="Alex Smith"
                className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none transition focus:border-[#d4af37]"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                  Book Type
                </label>

                <select
                  value={bookType}
                  onChange={(event) => setBookType(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none transition focus:border-[#d4af37]"
                >
                  <option>Self Help</option>
                  <option>Business</option>
                  <option>Memoir</option>
                  <option>Health & Fitness</option>
                  <option>Finance</option>
                  <option>Mindset</option>
                  <option>Fiction</option>
                  <option>Other</option>
                </select>
                {bookType === "Other" ? (
                <input
                  type="text"
                  placeholder="Enter your book type"
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none transition focus:border-[#d4af37]"
                />
                ) : null}
              </div>

              <div>
                <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                  Target Length
                </label>

                <select
                  value={targetLength}
                  onChange={(event) => setTargetLength(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none transition focus:border-[#d4af37]"
                >
                  <option>100 pages</option>
                  <option>150 pages</option>
                  <option>200 pages</option>
                  <option>250 pages</option>
                  <option>300 pages</option>
                </select>
              </div>
            </div>

            <div>
            <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
              Who Should Read This Book?
            </label>

            <p className="mt-2 text-sm leading-6 text-black/45">
              Describe the people who would benefit most from this book. You can write a
              sentence or list simple groups.
            </p>

            <textarea
              rows={4}
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="Example: Entrepreneurs, creators, and people who feel stuck but want to build more freedom, income, and purpose."
              className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg outline-none transition focus:border-[#d4af37]"
            />
          </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                What Is Your Book About?
              </label>

              <textarea
                rows={7}
                value={bookDescription}
                onChange={(event) => setBookDescription(event.target.value)}
                placeholder="Describe your book idea..."
                className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-lg leading-8 outline-none transition focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                Writing Tone
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  "Professional",
                  "Inspirational",
                  "Conversational",
                  "Bold",
                  "Educational",
                  "Story Driven",
                ].map((toneOption) => (
                  <button
                    key={toneOption}
                    type="button"
                    onClick={() => setTone(toneOption)}
                    className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                      tone === toneOption
                        ? "border-[#d4af37] bg-[#fff6da]"
                        : "border-black/10 bg-[#faf8f3] hover:border-[#d4af37] hover:bg-[#fff6da]"
                    }`}
                  >
                    {toneOption}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCreateBook}
              disabled={isSaving}
              className="mt-4 rounded-2xl bg-[#d4af37] px-8 py-5 text-lg font-black text-black transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
              <span className="inline-flex min-w-[260px] justify-center">
                <span>Creating Your Blueprint</span>
                <span className="inline-block w-6 text-left">
                  {".".repeat(loadingDotCount)}
                </span>
              </span>
            ) : (
              "Generate My Book Blueprint"
            )}
            </button>
          </div>
        </div>
      </div>
    </AuthorLayout>
  );
}