import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  calculateCoverLayout,
  type CoverFormat,
  type CoverPaperType,
  type CoverTrimSizeKey,
} from "../../../lib/coverCalculator";

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

const INCH_TO_PX = 96;

function safeFilename(value: string | null | undefined) {
  return String(value || "cover")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const format = normalizeCoverFormat(url.searchParams.get("format"));
  const requestedTrimSize = normalizeCoverTrimSize(url.searchParams.get("trimSize"));

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

    const origin = url.origin;
    const targetUrl = new URL("/cover-export-render", origin);

    targetUrl.searchParams.set("projectId", projectId);
    targetUrl.searchParams.set("format", format);
    targetUrl.searchParams.set("trimSize", trimSize);

    browser = await launchBrowser();

    const page = await browser.newPage();

    await page.setViewport({
      width: Math.ceil(layout.fullWrapWidthIn * INCH_TO_PX),
      height: Math.ceil(layout.fullWrapHeightIn * INCH_TO_PX),
      deviceScaleFactor: 1,
    });

    const response = await page.goto(targetUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 120000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `Cover render page failed: ${response?.status() || "no response"}`
      );
    }

    await page.evaluate(async () => {
      await document.fonts.ready;

      await Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    });

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
        "X-Cover-Trim-Size": trimSize,
        "X-Cover-Format": format,
        "X-Cover-Page-Count": String(pageCount),
      },
    });
  } catch (error) {
    if (browser) await browser.close();

    console.error("Cover export failed:", error);

    return Response.json({ error: "Cover export failed" }, { status: 500 });
  }
}
