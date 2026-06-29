import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

async function launchBrowser() {
  if (process.env.VERCEL) {
    const puppeteerCore = await import("puppeteer-core");
    const chrome = chromium as any;

    return puppeteerCore.default.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: chrome.headless,
    });
  }

  const puppeteer = await import("puppeteer");

  return puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CoverPanelKey = "back" | "spine" | "front";

const KINDLE_COVER_WIDTH_PX = 320;
const KINDLE_COVER_HEIGHT_PX = 512;
const EXPORT_SCALE = 5;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFilename(value: string | null | undefined) {
  return String(value || "kindle-cover")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function getKindleLayers(settings: any) {
  const layers = settings?.cover_layers;

  if (layers && !Array.isArray(layers)) {
    if (Array.isArray(layers.kindle) && layers.kindle.length > 0) {
      return layers.kindle.filter((layer: any) => layer?.panel === "front");
    }

    if (Array.isArray(layers.paperback)) {
      return layers.paperback.filter((layer: any) => layer?.panel === "front");
    }
  }

  if (Array.isArray(layers)) {
    return layers.filter((layer: any) => layer?.panel === "front");
  }

  return [];
}

function renderLayer(layer: any) {
  const left = Number(layer.x || 0);
  const top = Number(layer.y || 0);
  const width = Number(layer.width || 20);
  const height = Number(layer.height || 10);
  const zIndex = Number(layer.zIndex || 20);
  const opacity = Number(layer.opacity ?? 1);

  if (layer.type === "image") {
    const imageScale = Number(layer.imageScale || 100);
    const imageX = Number(layer.imageX || 0);
    const imageY = Number(layer.imageY || 0);
    const objectFit = layer.objectFit || "contain";

    return `
      <div class="layer" style="
        left:${left}%;
        top:${top}%;
        width:${width}%;
        height:${height}%;
        z-index:${zIndex};
        opacity:${opacity};
        overflow:hidden;
      ">
        <img src="${escapeHtml(layer.src)}" style="
          position:absolute;
          left:0;
          top:0;
          width:${imageScale}%;
          height:auto;
          max-width:none;
          max-height:none;
          object-fit:${escapeHtml(objectFit)};
          transform:translate(${imageX}px, ${imageY}px);
          transform-origin:top left;
          display:block;
        " />
      </div>
    `;
  }

  if (layer.type === "text") {
    const fontFamily = layer.fontFamily || "Georgia";
    const KINDLE_FONT_PREVIEW_SCALE = 0.55;
    const fontSize = Number(layer.fontSize || 24) * KINDLE_FONT_PREVIEW_SCALE;
    const fontWeight = Number(layer.fontWeight || 700);
    const fontStyle = layer.fontStyle || "normal";
    const color = layer.color || "#111111";
    const textAlign = layer.textAlign || "center";
    const lineHeight = Number(layer.lineHeight || 1.2);
    const letterSpacing = Number(layer.letterSpacing || 0);

    return `
      <div
    class="layer"
    style="
        left:${left}%;
        top:${top}%;
        width:${width}%;
        max-width:${width}%;
        height:auto;
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
        word-break:normal;
        overflow-wrap:normal;
        overflow:visible;
        text-shadow:0 1px 2px rgba(255,255,255,0.35);
    "
    >
    ${escapeHtml(layer.text)}
    </div>
    `;
  }

  return "";
}

function renderKindleCoverHtml({ settings }: { settings: any }) {
  const panelStyles = settings?.panel_styles || {};
  const frontStyle = panelStyles.front || {};

  const fullWrapBackground = settings?.background_image_url || "";
  const fullWrapImageScale = Number(settings?.image_scale || 100);
  const fullWrapImageX = Number(settings?.image_x || 0);
  const fullWrapImageY = Number(settings?.image_y || 0);
  const fullWrapFitMode = settings?.image_fit_mode || "cover";

  const backgroundImage = !fullWrapBackground ? frontStyle.backgroundImage || "" : "";
  const backgroundColor = frontStyle.backgroundColor || "#f2ead8";
  const backgroundFit = frontStyle.backgroundFit || "cover";
  const backgroundX = Number(frontStyle.backgroundX || 0);
  const backgroundY = Number(frontStyle.backgroundY || 0);
  const backgroundScale = Number(frontStyle.backgroundScale || 100);

  const layers = getKindleLayers(settings)
    .slice()
    .sort((a: any, b: any) => Number(a.zIndex || 0) - Number(b.zIndex || 0))
    .map(renderLayer)
    .join("");

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin:0;
      padding:0;
      width:${KINDLE_COVER_WIDTH_PX}px;
      height:${KINDLE_COVER_HEIGHT_PX}px;
      background:${escapeHtml(backgroundColor)};
      overflow:hidden;
      font-family:Georgia, serif;
    }

    * {
      box-sizing:border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cover {
      position:relative;
      width:${KINDLE_COVER_WIDTH_PX}px;
      height:${KINDLE_COVER_HEIGHT_PX}px;
      overflow:hidden;
      background:${escapeHtml(backgroundColor)};
    }

    .bg {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      z-index:1;
    }

    .layer {
      position:absolute;
    }
  </style>
</head>
<body>
  <div class="cover">
    ${
      fullWrapBackground
        ? `<img class="bg" src="${escapeHtml(fullWrapBackground)}" style="object-fit:${escapeHtml(fullWrapFitMode)}; transform:translate(${fullWrapImageX}px, ${fullWrapImageY}px) scale(${fullWrapImageScale / 100}); transform-origin:center;" />`
        : ""
    }

    ${
      backgroundImage
        ? `<img class="bg" src="${escapeHtml(backgroundImage)}" style="object-fit:${escapeHtml(backgroundFit)}; transform:translate(${backgroundX}px, ${backgroundY}px) scale(${backgroundScale / 100}); transform-origin:center;" />`
        : ""
    }

    <div class="bg" style="z-index:2; background:linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(0,0,0,0.03));"></div>
    ${layers}
  </div>
</body>
</html>
`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const saveOnly = searchParams.get("saveOnly") === "true";

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  let browser: any = null;

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

    const html = renderKindleCoverHtml({ settings });

    browser = await launchBrowser();

    const page = await browser.newPage();

    await page.setViewport({
      width: KINDLE_COVER_WIDTH_PX,
      height: KINDLE_COVER_HEIGHT_PX,
      deviceScaleFactor: EXPORT_SCALE,
    });

    await page.setContent(html, {
      waitUntil: "load",
    });

    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    });

    const imageBuffer = await page.screenshot({
  type: "jpeg",
  quality: 92,
  fullPage: false,
});

await browser.close();

const filename = `${safeFilename(project.title)}-kindle-cover.jpg`;
const storagePath = `${project.id}/kindle-cover.jpg`;

const { error: uploadError } = await supabaseAdmin.storage
  .from("cover-artwork")
  .upload(storagePath, Buffer.from(imageBuffer), {
    upsert: true,
    contentType: "image/jpeg",
  });

if (uploadError) {
  throw uploadError;
}

const { data: publicUrlData } = supabaseAdmin.storage
  .from("cover-artwork")
  .getPublicUrl(storagePath);

const kindleCoverUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

const { error: updateError } = await supabaseAdmin
  .from("book_projects")
  .update({
    kindle_cover_url: kindleCoverUrl,
  })
  .eq("id", project.id);

if (updateError) {
  throw updateError;
}

if (saveOnly) {
  return Response.json({
    success: true,
    kindle_cover_url: kindleCoverUrl,
  });
}

return new Response(Buffer.from(imageBuffer), {
  status: 200,
  headers: {
    "Content-Type": "image/jpeg",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  },
});
  } catch (error) {
    if (browser) await browser.close();

    console.error("Kindle cover export failed:", error);

    return Response.json(
      { error: "Kindle cover export failed" },
      { status: 500 }
    );
  }
}