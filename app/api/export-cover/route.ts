import { NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  calculateCoverLayout,
  type CoverFormat,
  type CoverPaperType,
  type CoverTrimSizeKey,
} from "../../../lib/coverCalculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CoverPanelKey = "back" | "spine" | "front";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFilename(value: string | null | undefined) {
  return String(value || "cover")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function getLayers(settings: any, format: CoverFormat) {
  const layers = settings?.cover_layers;

  if (Array.isArray(layers)) return layers;

  if (layers && typeof layers === "object") {
    return layers[format] || layers.paperback || [];
  }

  return [];
}

function getPanelRect(panel: CoverPanelKey, layout: any) {
  if (panel === "back") {
    return {
      left: 0,
      top: 0,
      width: layout.backCoverWidthIn + layout.bleedIn,
      height: layout.fullWrapHeightIn,
    };
  }

  if (panel === "spine") {
    return {
      left: layout.spineStartIn,
      top: 0,
      width: layout.spineWidthIn,
      height: layout.fullWrapHeightIn,
    };
  }

  return {
    left: layout.frontCoverStartIn - layout.safeMarginIn,
    top: 0,
    width: layout.frontCoverWidthIn + layout.bleedIn,
    height: layout.fullWrapHeightIn,
  };
}

function renderPanelBackground(
  panel: CoverPanelKey,
  settings: any,
  layout: any,
  hasFullWrapBackground: boolean
) {
  const panelStyles = settings?.panel_styles || {};
  const style = panelStyles[panel] || {};
  const rect = getPanelRect(panel, layout);

  const bgColor = style.backgroundColor || "#f2ead8";
  const bgImage = style.backgroundImage || "";
  const bgFit = style.backgroundFit || "cover";
  const bgX = Number(style.backgroundX || 0);
  const bgY = Number(style.backgroundY || 0);
  const bgScale = Number(style.backgroundScale || 100);

  // Match the live Cover Creator behavior:
  // - If a full-wrap background exists, panel color should not cover it.
  // - If no full-wrap background exists, panel color remains visible.
  // - Panel-specific images still render above either option.
  const background = hasFullWrapBackground ? "transparent" : bgColor;

  return `
    <div
      class="panel-bg"
      style="
        left:${rect.left}in;
        top:${rect.top}in;
        width:${rect.width}in;
        height:${rect.height}in;
        background:${escapeHtml(background)};
      "
    >
      ${
        bgImage
          ? `<img
              src="${escapeHtml(bgImage)}"
              style="
                position:absolute;
                inset:0;
                width:100%;
                height:100%;
                object-fit:${escapeHtml(bgFit)};
                transform:translate(${bgX}px, ${bgY}px) scale(${bgScale / 100});
                transform-origin:center;
              "
            />`
          : ""
      }
    </div>
  `;
}

function renderLayer(layer: any, layout: any) {
  if (!layer || !layer.panel) return "";

  // KDP adds the real barcode during upload. Do not export our preview placeholder.
  if (
    layer.type === "image" &&
    typeof layer.src === "string" &&
    layer.src.includes("barcode-placeholder")
  ) {
    return "";
  }

  const panel = layer.panel as CoverPanelKey;
  const rect = getPanelRect(panel, layout);

  const left = rect.left + (Number(layer.x || 0) / 100) * rect.width;
  const top = rect.top + (Number(layer.y || 0) / 100) * rect.height;
  const width = (Number(layer.width || 10) / 100) * rect.width;
  const height = (Number(layer.height || 10) / 100) * rect.height;

  const zIndex = Number(layer.zIndex || 20);
  const opacity = Number(layer.opacity ?? 1);

  if (layer.type === "image") {
    const imageScale = Number(layer.imageScale || 100);
    const imageX = Number(layer.imageX || 0);
    const imageY = Number(layer.imageY || 0);

    return `
      <div
        class="cover-layer"
        style="
          left:${left}in;
          top:${top}in;
          width:${width}in;
          height:${height}in;
          opacity:${opacity};
          z-index:${zIndex};
          overflow:hidden;
        "
      >
        <img
          src="${escapeHtml(layer.src)}"
          style="
            position:absolute;
            left:0;
            top:0;
            width:${imageScale}%;
            height:auto;
            max-width:none;
            max-height:none;
            transform:translate(${imageX}px, ${imageY}px);
            transform-origin:top left;
            display:block;
          "
        />
      </div>
    `;
  }

  if (layer.type === "text") {
    const fontFamily = layer.fontFamily || "Georgia";
    const fontSize = Number(layer.fontSize || 14);
    const fontWeight = Number(layer.fontWeight || 700);
    const fontStyle = layer.fontStyle || "normal";
    const color = layer.color || "#111111";
    const textAlign = layer.textAlign || "center";
    const lineHeight = Number(layer.lineHeight || 1.2);
    const letterSpacing = Number(layer.letterSpacing || 0);
    const rotation = Number(layer.rotation || 0);

    if (panel === "spine" || rotation !== 0) {
      return `
        <div
          class="cover-layer"
          style="
            left:${left}in;
            top:${top}in;
            width:${width}in;
            height:${height}in;
            z-index:${zIndex};
            opacity:${opacity};
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:visible;
          "
        >
          <div
            style="
              transform:rotate(${rotation || 90}deg);
              transform-origin:center;
              white-space:nowrap;
              font-family:${escapeHtml(fontFamily)}, serif;
              font-size:${fontSize}px;
              font-weight:${fontWeight};
              font-style:${fontStyle};
              color:${escapeHtml(color)};
              letter-spacing:${letterSpacing}em;
              text-align:center;
              text-transform:${panel === "spine" ? "uppercase" : "none"};
            "
          >
            ${escapeHtml(layer.text)}
          </div>
        </div>
      `;
    }

    return `
      <div
        class="cover-layer"
        style="
          left:${left}in;
          top:${top}in;
          width:${width}in;
          max-width:${width}in;
          height:${height}in;
          display:block;
          align-items:center;
          justify-content:center;
          z-index:${zIndex};
          opacity:${opacity};
          font-family:${escapeHtml(fontFamily)}, serif;
          font-size:${fontSize}px;
          font-weight:${fontWeight};
          font-style:${fontStyle};
          color:${escapeHtml(color)};
          text-align:${escapeHtml(textAlign)};
          line-height:${lineHeight};
          letter-spacing:${letterSpacing}em;
          white-space:pre-wrap;
          overflow:visible;
        "
      >
        ${escapeHtml(layer.text)}
      </div>
    `;
  }

  return "";
}

function renderCoverHtml({
  project,
  settings,
  format,
}: {
  project: any;
  settings: any;
  format: CoverFormat;
}) {
  const trimSize = (settings?.trim_size ||
    project.compiled_trim_size ||
    "6x9") as CoverTrimSizeKey;

  const paperType = (settings?.paper_type || "white") as CoverPaperType;
  const pageCount = project.compiled_page_count || settings?.page_count || 150;

  const layout = calculateCoverLayout({
    format,
    trimSize,
    paperType,
    pageCount,
  });

  const layers = getLayers(settings, format);

  const fullWrapBackground = settings?.background_image_url || "";
  const imageScale = Number(settings?.image_scale || 100);
  const imageX = Number(settings?.image_x || 0);
  const imageY = Number(settings?.image_y || 0);
  const fitMode = settings?.image_fit_mode || "cover";

  const layerHtml = layers
    .slice()
    .sort((a: any, b: any) => Number(a.zIndex || 0) - Number(b.zIndex || 0))
    .map((layer: any) => renderLayer(layer, layout))
    .join("");

  const hasFullWrapBackground = Boolean(fullWrapBackground);

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: ${layout.fullWrapWidthIn}in ${layout.fullWrapHeightIn}in;
      margin: 0;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: ${layout.fullWrapWidthIn}in;
      height: ${layout.fullWrapHeightIn}in;
      font-family: Georgia, serif;
      background: white;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .wrap {
      position: relative;
      width: ${layout.fullWrapWidthIn}in;
      height: ${layout.fullWrapHeightIn}in;
      overflow: hidden;
      background: #f2ead8;
    }

    .full-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: ${escapeHtml(fitMode)};
      transform: translate(${imageX}px, ${imageY}px) scale(${imageScale / 100});
      transform-origin: center;
      z-index: 1;
    }

    .panel-bg {
      position: absolute;
      overflow: hidden;
      z-index: 2;
    }

    .cover-layer {
      position: absolute;
    }
  </style>
</head>

<body>
  <div class="wrap">
    ${
      fullWrapBackground
        ? `<img class="full-bg" src="${escapeHtml(fullWrapBackground)}" />`
        : ""
    }

    ${renderPanelBackground("back", settings, layout, hasFullWrapBackground)}
    ${renderPanelBackground("spine", settings, layout, hasFullWrapBackground)}
    ${renderPanelBackground("front", settings, layout, hasFullWrapBackground)}

    ${layerHtml}
  </div>
</body>
</html>
`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const format = (url.searchParams.get("format") || "paperback") as CoverFormat;

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  if (format !== "paperback" && format !== "hardcover") {
    return Response.json({ error: "Invalid cover format" }, { status: 400 });
  }

  let browser: Browser | null = null;

  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from("book_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: settings } = await supabaseAdmin
      .from("book_cover_settings")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    const trimSize = (settings?.trim_size ||
      project.compiled_trim_size ||
      "6x9") as CoverTrimSizeKey;

    const paperType = (settings?.paper_type || "white") as CoverPaperType;
    const pageCount = project.compiled_page_count || settings?.page_count || 150;

    const layout = calculateCoverLayout({
      format,
      trimSize,
      paperType,
      pageCount,
    });

    const html = renderCoverHtml({
      project,
      settings,
      format,
    });

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: Math.ceil(layout.fullWrapWidthIn * 96),
      height: Math.ceil(layout.fullWrapHeightIn * 96),
      deviceScaleFactor: 1,
    });

    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      width: `${layout.fullWrapWidthIn}in`,
      height: `${layout.fullWrapHeightIn}in`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0in",
        right: "0in",
        bottom: "0in",
        left: "0in",
      },
    });

    await browser.close();

    const filename = `${safeFilename(project.title)}-${format}-cover.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (browser) await browser.close();

    console.error("Cover export failed:", error);

    return Response.json({ error: "Cover export failed" }, { status: 500 });
  }
}
