import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import {
  calculateCoverLayout,
  type CoverFormat,
  type CoverPaperType,
  type CoverTrimSizeKey,
} from "../../lib/coverCalculator";
import CoverRenderer from "../components/cover/CoverRenderer";

export const dynamic = "force-dynamic";

const INCH_TO_PX = 96;

type PageProps = {
  searchParams: Promise<{
    projectId?: string;
    format?: string;
    trimSize?: string;
  }>;
};

type CoverPanelKey = "back" | "spine" | "front";
type ImageFitMode = "cover" | "contain";

type CoverPanelStyle = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundFit: ImageFitMode;
  backgroundX: number;
  backgroundY: number;
  backgroundScale: number;
};

type CoverPanelStyles = Record<CoverPanelKey, CoverPanelStyle>;

function normalizeCoverTrimSize(value: unknown): CoverTrimSizeKey | null {
  if (typeof value !== "string") return null;

  const cleaned = value
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/\s+/g, "")
    .trim();

  if (cleaned === "5x8") return "5x8";
  if (cleaned === "5.5x8.5" || cleaned === "5.5x8.5in") return "5.5x8.5";
  if (cleaned === "6x9") return "6x9";

  return null;
}

function normalizeCoverFormat(value: unknown): CoverFormat {
  return value === "hardcover" ? "hardcover" : "paperback";
}

function getLayers(settings: any, format: CoverFormat) {
  const layers = settings?.cover_layers;

  if (Array.isArray(layers)) return layers;

  if (layers && typeof layers === "object") {
    return layers[format] || layers.paperback || [];
  }

  return [];
}

function getDefaultPanelStyle(): CoverPanelStyle {
  return {
    backgroundColor: "#f2ead8",
    backgroundImage: "",
    backgroundFit: "cover",
    backgroundX: 0,
    backgroundY: 0,
    backgroundScale: 100,
  };
}

function getPanelStyles(settings: any): CoverPanelStyles {
  const saved = settings?.panel_styles || {};

  return {
    back: {
      ...getDefaultPanelStyle(),
      ...(saved.back || {}),
    },
    spine: {
      ...getDefaultPanelStyle(),
      ...(saved.spine || {}),
    },
    front: {
      ...getDefaultPanelStyle(),
      ...(saved.front || {}),
    },
  };
}

export default async function CoverExportRenderPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await searchParams;

  const projectId = resolvedSearchParams.projectId;
  const format = normalizeCoverFormat(resolvedSearchParams.format);
  const requestedTrimSize = normalizeCoverTrimSize(
    resolvedSearchParams.trimSize
  );

  if (!projectId) {
    notFound();
  }

  const { data: project, error: projectError } = await supabaseAdmin
    .from("book_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const { data: settings } = await supabaseAdmin
    .from("book_cover_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const trimSize = (
    requestedTrimSize ||
    normalizeCoverTrimSize(settings?.trim_size) ||
    normalizeCoverTrimSize(project.compiled_trim_size) ||
    "6x9"
  ) as CoverTrimSizeKey;

  const paperType = (settings?.paper_type || "white") as CoverPaperType;
  const pageCount = project.compiled_page_count || settings?.page_count || 150;

  const layout = calculateCoverLayout({
    format,
    trimSize,
    paperType,
    pageCount,
  });

  const layers = getLayers(settings, format);
  const panelStyles = getPanelStyles(settings);

  const visualWrapWidthPx = layout.fullWrapWidthIn * INCH_TO_PX;
  const wrapHeightPx = layout.fullWrapHeightIn * INCH_TO_PX;

  const bleedPx = layout.bleedIn * INCH_TO_PX;
  const safeMarginPx = layout.safeMarginIn * INCH_TO_PX;
  const backCoverWidthPx = layout.backCoverWidthIn * INCH_TO_PX;
  const frontCoverWidthPx = layout.frontCoverWidthIn * INCH_TO_PX;
  const spineWidthPx = layout.spineWidthIn * INCH_TO_PX;

  // Important:
  // Do NOT calculate the spine using bleedPx + backCoverWidthPx.
  // That works for paperback, but hardcover uses a different horizontal wrap.
  // These values must come directly from coverCalculator.ts.
  const spineLeftPx = layout.spineStartIn * INCH_TO_PX;
  const frontTrimLeftPx = layout.frontCoverStartIn * INCH_TO_PX;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: ${layout.fullWrapWidthIn}in ${layout.fullWrapHeightIn}in;
              margin: 0;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: ${visualWrapWidthPx}px;
              height: ${wrapHeightPx}px;
              overflow: hidden;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .cover-export-shell {
              width: ${visualWrapWidthPx}px;
              height: ${wrapHeightPx}px;
              overflow: hidden;
              background: white;
            }

            .cover-export-shell > div {
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            img {
              max-width: none;
            }
          `,
        }}
      />

      <main className="cover-export-shell">
        <CoverRenderer
          layers={layers}
          panelStyles={panelStyles}
          fullWrapBackgroundImage={settings?.background_image_url || ""}
          fullWrapImageScale={Number(settings?.image_scale || 100)}
          fullWrapImageX={Number(settings?.image_x || 0)}
          fullWrapImageY={Number(settings?.image_y || 0)}
          fullWrapImageFitMode={settings?.image_fit_mode || "cover"}
          visualWrapWidthPx={visualWrapWidthPx}
          wrapHeightPx={wrapHeightPx}
          bleedPx={bleedPx}
          safeMarginPx={safeMarginPx}
          backCoverWidthPx={backCoverWidthPx}
          frontCoverWidthPx={frontCoverWidthPx}
          spineWidthPx={spineWidthPx}
          spineLeftPx={spineLeftPx}
          frontTrimLeftPx={frontTrimLeftPx}
          previewScale={INCH_TO_PX}
          showGuides={false}
          snapGuide={null}
          selectedLayerId={null}
          cropLayerId={null}
          interactive={false}
          mode="export"
        />
      </main>
    </>
  );
}