import { supabaseAdmin } from "../../lib/supabaseAdmin";
import ContinueWritingButton from "../components/ContinueWritingButton";
import AuthorLayout from "../components/AuthorLayout";

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

type BlueprintChapter = {
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

export default async function BookBlueprintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const projectId = params.id;

  if (!projectId) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Missing project ID</h1>
      </main>
    );
  }

  const { data: project, error } = await supabaseAdmin
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#f7f4ed] p-10">
        <h1 className="text-3xl font-black">Project not found</h1>
      </main>
    );
  }

  const blueprint = project.blueprint_output as BlueprintOutput | null;

  const chapters: BlueprintChapter[] =
    blueprint?.chapters && blueprint.chapters.length > 0
      ? blueprint.chapters
      : [
          {
            title: "The Moment Everything Changed",
            description:
              "A focused chapter designed to move the reader closer to the promised transformation.",
            reader_outcome:
              "The reader understands why this story matters and why they should keep reading.",
          },
        ];

  const blueprintCards = [
    [
      "Target Reader",
      blueprint?.target_reader_profile || project.audience || "Not provided",
    ],
    ["Core Promise", blueprint?.core_promise || "Not generated yet"],
    [
      "Chapter Count",
      blueprint?.recommended_chapter_count
        ? `${blueprint.recommended_chapter_count} chapters`
        : `${chapters.length} chapters`,
    ],
  ];

  return (
  <AuthorLayout
  currentStep={2}
  projectId={projectId}
>

  <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b38b16]">
            Your Book Blueprint
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {project.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-black/60">
            {blueprint?.summary || project.book_description}
          </p>

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

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
            <h2 className="text-3xl font-black">Recommended Chapter Path</h2>

            <p className="mt-3 text-black/60">
              This is the first AI-generated structure for your book. You can
              refine it later, but this gives you a strong starting path.
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
                Continue into the chapter builder and begin turning your ideas
                into a real manuscript.
              </p>

              <ContinueWritingButton projectId={projectId} />
            </div>
          </aside>
        </section>
      </div>
    </AuthorLayout>
  );
}