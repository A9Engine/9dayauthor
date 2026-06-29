"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import AuthorLayout from "../components/AuthorLayout";

type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

function extractSnapshotValue(text: string, label: string) {
  const regex = new RegExp(`${label}:\\s*(.+)`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim() || "";
}

function getLatestSnapshot(messages: CoachMessage[]) {
  const latestAssistantSnapshot = [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        message.content.includes("BOOK IDEA SNAPSHOT")
    );

  if (!latestAssistantSnapshot) return null;

  const content = latestAssistantSnapshot.content;

  return {
    title: extractSnapshotValue(content, "Title"),
    bookType: extractSnapshotValue(content, "Book Type"),
    audience: extractSnapshotValue(content, "Target Reader"),
    tone: extractSnapshotValue(content, "Tone"),
    bookDescription: extractSnapshotValue(content, "Book Description"),
  };
}

export default function NewBookPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [bookType, setBookType] = useState("Self Help");
  const [customBookType, setCustomBookType] = useState("");
  const [targetLength, setTargetLength] = useState("150 pages");
  const [audience, setAudience] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [tone, setTone] = useState("Inspirational");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingDotCount, setLoadingDotCount] = useState(1);

  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [coachError, setCoachError] = useState("");

  const latestSnapshot = useMemo(
    () => getLatestSnapshot(coachMessages),
    [coachMessages]
  );

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

  async function sendCoachMessage() {
    const messageToSend = coachInput.trim();

    if (!messageToSend || isCoachThinking) return;

    setCoachError("");
    setCoachInput("");
    setIsCoachThinking(true);

    const nextMessages: CoachMessage[] = [
      ...coachMessages,
      { role: "user", content: messageToSend },
    ];

    setCoachMessages(nextMessages);

    try {
      const response = await fetch("/api/book-idea-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCoachError(result.error || "The Book Idea Coach could not respond.");
        return;
      }

      setCoachMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            result.reply ||
            "Here are 3 strong directions for this book. Tell me one more detail about the audience, message, or story you want to share and I will sharpen the concept.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setCoachError("Something went wrong with the Book Idea Coach.");
    } finally {
      setIsCoachThinking(false);
    }
  }

  function useLatestBookIdea() {
    if (!latestSnapshot) return;

    if (latestSnapshot.title) {
      setTitle(latestSnapshot.title);
    }

    if (latestSnapshot.audience) {
      setAudience(latestSnapshot.audience);
    }

    if (latestSnapshot.bookDescription) {
      setBookDescription(latestSnapshot.bookDescription);
    }

    if (latestSnapshot.tone) {
      const validTones = [
        "Professional",
        "Inspirational",
        "Conversational",
        "Bold",
        "Educational",
        "Story Driven",
      ];

      const matchedTone = validTones.find(
        (toneOption) =>
          toneOption.toLowerCase() === latestSnapshot.tone.toLowerCase()
      );

      if (matchedTone) {
        setTone(matchedTone);
      }
    }

    if (latestSnapshot.bookType) {
      const validTypes = [
        "Self Help",
        "Business",
        "Memoir",
        "Health & Fitness",
        "Finance",
        "Mindset",
        "Fiction",
        "Other",
      ];

      const matchedType = validTypes.find(
        (typeOption) =>
          typeOption.toLowerCase() === latestSnapshot.bookType.toLowerCase()
      );

      if (matchedType) {
        setBookType(matchedType);
      } else {
        setBookType("Other");
        setCustomBookType(latestSnapshot.bookType);
      }
    }

    setErrorMessage("");

    setTimeout(() => {
      document
        .getElementById("book-project-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function resetBookIdeaCoach() {
    setCoachMessages([]);
    setCoachInput("");
    setCoachError("");
  }

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

    const finalBookType =
      bookType === "Other" ? customBookType.trim() || "Other" : bookType;

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
            Step 1 of 9
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Create a New Book Project
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-black/60">
            Tell us about your book idea and 9 Day Author will guide you from
            concept to published manuscript.
          </p>
        </div>

        <section className="mt-10 rounded-[2rem] border border-[#d4af37]/20 bg-[#fff8df] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
              Book Idea Coach
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Need help choosing your book idea?
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-black/60">
              Not sure what book to write yet? Talk through your story,
              experiences, expertise, interests, or the kind of message you want
              to share. The coach will help you narrow your concept, title,
              target reader, tone, and book description before you create the
              project.
            </p>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white p-4">
            <div className="h-[220px] overflow-y-auto rounded-2xl border border-black/5 bg-white px-3 py-3">

              {coachMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-3xl px-5 py-4 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-black text-white"
                        : "bg-[#faf8f3] text-black/75"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isCoachThinking ? (
                <div className="flex justify-start">
                  <div className="rounded-3xl bg-[#faf8f3] px-5 py-4 text-sm font-bold text-black/50">
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <textarea
                rows={3}
                value={coachInput}
                onChange={(event) => setCoachInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void sendCoachMessage();
                  }
                }}
                placeholder="Start by typing a rough idea, personal story, topic, skill, or message you want to explore. Example: I want to write about being adopted, including the positive parts and the challenges from adolescence to adulthood..."
                className="min-h-[96px] flex-1 rounded-2xl border border-black/10 bg-[#faf8f3] px-5 py-4 text-base leading-7 outline-none transition focus:border-[#d4af37]"
              />

              <div className="flex justify-center sm:w-[140px] sm:items-start">
                <button
                  type="button"
                  onClick={() => sendCoachMessage()}
                  disabled={isCoachThinking || !coachInput.trim()}
                  className="mx-auto rounded-full bg-black px-8 py-3 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            {coachError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {coachError}
              </div>
            ) : null}

            {latestSnapshot ? (
              <div className="mt-5 rounded-3xl border border-[#d4af37]/30 bg-[#fff8df] p-5">
                <div className="text-sm font-black uppercase tracking-[0.16em] text-[#b38b16]">
                  Latest Book Idea Snapshot
                </div>

                <div className="mt-4 grid gap-3 text-sm leading-6 text-black/70">
                  {latestSnapshot.title ? (
                    <div>
                      <span className="font-black text-black">Title:</span>{" "}
                      {latestSnapshot.title}
                    </div>
                  ) : null}

                  {latestSnapshot.bookType ? (
                    <div>
                      <span className="font-black text-black">Book Type:</span>{" "}
                      {latestSnapshot.bookType}
                    </div>
                  ) : null}

                  {latestSnapshot.audience ? (
                    <div>
                      <span className="font-black text-black">
                        Target Reader:
                      </span>{" "}
                      {latestSnapshot.audience}
                    </div>
                  ) : null}

                  {latestSnapshot.tone ? (
                    <div>
                      <span className="font-black text-black">Tone:</span>{" "}
                      {latestSnapshot.tone}
                    </div>
                  ) : null}

                  {latestSnapshot.bookDescription ? (
                    <div>
                      <span className="font-black text-black">
                        Description:
                      </span>{" "}
                      {latestSnapshot.bookDescription}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={useLatestBookIdea}
                    className="rounded-2xl bg-black px-5 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5"
                  >
                    Fill Project Form With This Idea
                  </button>

                  <button
                    type="button"
                    onClick={resetBookIdeaCoach}
                    className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-black transition hover:-translate-y-0.5"
                  >
                    Start Over
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-black/45">
                  Or continue expanding your idea in the chat above.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <div
          id="book-project-form"
          className="mt-10 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8"
        >
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
                    value={customBookType}
                    onChange={(event) =>
                      setCustomBookType(event.target.value)
                    }
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
                  <option>300+ pages</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-[0.14em] text-black/55">
                Who Should Read This Book?
              </label>

              <p className="mt-2 text-sm leading-6 text-black/45">
                Describe the people who would benefit most from this book. You
                can write a sentence or list simple groups.
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
