"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthorLayout from "../components/AuthorLayout";
import { supabase } from "../../lib/supabase";

function FinalizeManuscriptContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [showKdpRecommendations, setShowKdpRecommendations] = useState(false);
  const [trimSizeLabel, setTrimSizeLabel] = useState("6 × 9");
  const [fontLabel, setFontLabel] = useState("Classic Serif");

  useEffect(() => {
  async function loadProjectTrimSize() {
    if (!projectId) return;

    const { data, error } = await supabase
      .from("book_projects")
      .select("compiled_trim_size, compiled_font_family")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    const trimSize = data?.compiled_trim_size || "6x9";

    const formattedTrimSize =
      trimSize === "5x8"
        ? "5 × 8"
        : trimSize === "5.5x8.5"
        ? "5.5 × 8.5"
        : "6 × 9";

    setTrimSizeLabel(formattedTrimSize);
    const formattedFont =
  data?.compiled_font_family === "modern_serif"
    ? "Modern Serif"
    : data?.compiled_font_family === "clean_sans"
    ? "Clean Sans"
    : "Classic Serif";

setFontLabel(formattedFont);
  }

  loadProjectTrimSize();
}, [projectId]);

  async function generatePdf() {
  if (!projectId) {
    alert("No project selected.");
    return;
  }

  try {
    setIsGeneratingPdf(true);

    const response = await fetch(`/api/export-pdf?projectId=${projectId}`);

    if (!response.ok) {
      alert("Could not generate PDF export.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "9-day-author-print-edition.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } finally {
    setIsGeneratingPdf(false);
  }
}

  async function generateEpub() {
  if (!projectId) {
    alert("No project selected.");
    return;
  }

  try {
    setIsGeneratingEpub(true);

    const response = await fetch(`/api/export-epub?projectId=${projectId}`);

    if (!response.ok) {
      alert("Could not generate Kindle EPUB export.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "9-day-author-kindle-edition.epub";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } finally {
    setIsGeneratingEpub(false);
  }
}

  async function generateDocx() {
    if (!projectId) {
      alert("No project selected.");
      return;
    }

    try {
      setIsGeneratingDocx(true);

      const response = await fetch("/api/export-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        alert(result?.details || result?.error || "Could not generate DOCX export.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "9-day-author-manuscript.docx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingDocx(false);
    }
  }

  return (
    <AuthorLayout currentStep={7} projectId={projectId || undefined}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
          <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
            Step 7 of 9
          </div>

          <h1 className="mt-2 text-4xl font-black">Finalize Manuscript</h1>

          <p className="mt-4 max-w-2xl leading-7 text-black/60">
            Compile your finished manuscript into a print-ready PDF with an
            official table of contents, verified page count, and KDP-ready
            formatting. This step creates the final manuscript file your cover
            sizing will use next.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-5">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                Primary Format
              </div>
              <div className="mt-2 text-xl font-black">PDF</div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-5">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                Trim Size
              </div>
              <div className="mt-2 text-xl font-black">{trimSizeLabel}</div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#faf8f3] p-5">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-black/40">
                Typography
              </div>
              <div className="mt-2 text-xl font-black">{fontLabel}</div>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#d4af37]/25 bg-[#fff8df] p-6">
            <h2 className="text-2xl font-black">Final Compile Review</h2>

            <div className="mt-5 space-y-3 text-sm font-semibold leading-6 text-black/70">
              <p>✅ Master Manuscript Object will be compiled from your saved project.</p>
              <p>✅ Front matter, dedication, table of contents, chapters, and back matter will be included.</p>
              <p>✅ Table of contents page numbers will be generated from the final PDF layout.</p>
              <p>✅ Official page count will be saved for cover sizing and spine width.</p>
              <p>✅ A print-ready PDF will be generated for Amazon KDP.</p>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-[#d4af37]/30 bg-[#fffaf0] p-6">
  <button
    type="button"
    onClick={() => setShowKdpRecommendations((current) => !current)}
    className="flex w-full items-center justify-between gap-4 text-left"
  >
    <div>
      <h2 className="text-xl font-black">📦 View KDP Upload Recommendations</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-black/60">
        Use these settings when uploading your manuscript and cover files to Amazon KDP.
      </p>
    </div>

    <span className="rounded-full bg-black px-4 py-2 text-sm font-black text-[#d4af37]">
      {showKdpRecommendations ? "Hide" : "View"}
    </span>
  </button>

  {showKdpRecommendations ? (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="text-lg font-black">📘 Interior Manuscript</h3>

        <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-black/70">
          <p>✅ Select <span className="font-black text-black">No Bleed</span> in KDP.</p>
          <p>✅ Upload the print-ready PDF generated by 9 Day Author.</p>
          <p>
  ✅ Use the same trim size selected in 9 Day Author:{" "}
  <span className="font-black text-black">{trimSizeLabel}</span>.
</p>
          <p>✅ This manuscript file is for paperback and hardcover interiors.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="text-lg font-black">🎨 Print Cover</h3>

        <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-black/70">
          <p>✅ Upload the provided print cover PDF from Cover Creator.</p>
          <p>✅ Bleed is already included automatically in the cover file.</p>
          <p>✅ Match your KDP paper color, trim size, and binding type to your 9 Day Author settings.</p>
          <p>✅ Review the KDP previewer before publishing.</p>
        </div>
      </div>
    </div>
  ) : null}
</div>

          <div className="mt-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black">📘 Print-Ready PDF</h3>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-black/60">
                  Use this file for Amazon KDP paperback and hardcover manuscript upload.
                  This is the official print edition export.
                </p>
              </div>

              <button
                type="button"
                onClick={generatePdf}
                disabled={isGeneratingPdf}
                className="rounded-2xl bg-black px-6 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingPdf
                  ? "Compiling PDF..."
                  : "Finalize & Compile Print Edition"}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black">📱 Kindle EPUB</h3>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-black/60">
                  EPUB export will be used for Kindle ebook upload with clickable
                  chapter navigation.
                </p>
              </div>

              <button
                type="button"
                onClick={generateEpub}
                disabled={isGeneratingEpub}
                className="rounded-2xl bg-[#d4af37] px-6 py-4 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingEpub ? "Compiling EPUB..." : "Finalize & Compile Kindle Edition"}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] border border-black/10 bg-[#faf8f3] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black">✏️ Editable Source Copy</h3>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-black/60">
                  Download a DOCX version if you want to edit your manuscript in
                  Word or Google Docs. Not recommended as the final KDP print file.
                </p>
              </div>

              <button
                type="button"
                onClick={generateDocx}
                disabled={isGeneratingDocx}
                className="rounded-2xl border border-black/15 bg-white px-6 py-4 text-sm font-black text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingDocx ? "Generating DOCX..." : "Download DOCX"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AuthorLayout>
  );
}

export default function ExportDownloadPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading finalize page...</div>}>
      <FinalizeManuscriptContent />
    </Suspense>
  );
}