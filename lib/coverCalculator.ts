export type CoverFormat = "paperback" | "hardcover";
export type CoverTrimSizeKey = "5x8" | "5.5x8.5" | "6x9";
export type CoverPaperType = "white" | "cream";
export type CoverInkType = "black_and_white" | "standard_color" | "premium_color";

export type CoverTrimSize = {
  key: CoverTrimSizeKey;
  label: string;
  widthIn: number;
  heightIn: number;
};

export type CoverLayoutSettings = {
  format: CoverFormat;
  trimSize: CoverTrimSizeKey;
  paperType: CoverPaperType;
  inkType?: CoverInkType;
  pageCount: number;
};

export type CoverLayout = {
  format: CoverFormat;
  trimSize: CoverTrimSizeKey;
  trimLabel: string;
  paperType: CoverPaperType;
  inkType: CoverInkType;
  pageCount: number;

  frontCoverWidthIn: number;
  backCoverWidthIn: number;
  spineWidthIn: number;

  bleedIn: number;
  safeMarginIn: number;

  fullWrapWidthIn: number;
  fullWrapHeightIn: number;

  frontCoverWidthPt: number;
  backCoverWidthPt: number;
  spineWidthPt: number;
  fullWrapWidthPt: number;
  fullWrapHeightPt: number;
  bleedPt: number;
  safeMarginPt: number;

  backCoverStartIn: number;
  spineStartIn: number;
  frontCoverStartIn: number;

  backCoverStartPt: number;
  spineStartPt: number;
  frontCoverStartPt: number;

  isSpineTextAllowed: boolean;
  spineWarning: string | null;
  exportWarning: string | null;
};

const POINTS_PER_INCH = 72;

const TRIM_SIZES: Record<CoverTrimSizeKey, CoverTrimSize> = {
  "5x8": {
    key: "5x8",
    label: '5" x 8"',
    widthIn: 5,
    heightIn: 8,
  },
  "5.5x8.5": {
    key: "5.5x8.5",
    label: '5.5" x 8.5"',
    widthIn: 5.5,
    heightIn: 8.5,
  },
  "6x9": {
    key: "6x9",
    label: '6" x 9"',
    widthIn: 6,
    heightIn: 9,
  },
};

function roundToFour(value: number) {
  return Number(value.toFixed(4));
}

function inchesToPoints(value: number) {
  return roundToFour(value * POINTS_PER_INCH);
}

export function getCoverTrimSize(trimSize: CoverTrimSizeKey) {
  return TRIM_SIZES[trimSize] || TRIM_SIZES["6x9"];
}

export function getCoverTrimSizeOptions() {
  return Object.values(TRIM_SIZES);
}

export function normalizePageCount(pageCount: number) {
  if (!Number.isFinite(pageCount)) return 150;

  return Math.max(10, Math.round(pageCount));
}

export function calculatePaperbackSpineWidth({
  pageCount,
  paperType,
}: {
  pageCount: number;
  paperType: CoverPaperType;
}) {
  const normalizedPageCount = normalizePageCount(pageCount);

  const pageThicknessIn = paperType === "cream" ? 0.0025 : 0.002252;

  return roundToFour(normalizedPageCount * pageThicknessIn);
}

export function calculateHardcoverSpineWidthEstimate({
  pageCount,
  paperType,
}: {
  pageCount: number;
  paperType: CoverPaperType;
}) {
  const paperbackSpineWidth = calculatePaperbackSpineWidth({
    pageCount,
    paperType,
  });

  return roundToFour(paperbackSpineWidth + 0.193);
}

export function calculateSpineWidth({
  format,
  pageCount,
  paperType,
}: {
  format: CoverFormat;
  pageCount: number;
  paperType: CoverPaperType;
}) {
  if (format === "hardcover") {
    return calculateHardcoverSpineWidthEstimate({
      pageCount,
      paperType,
    });
  }

  return calculatePaperbackSpineWidth({
    pageCount,
    paperType,
  });
}

export function getBleedIn(format: CoverFormat) {
  if (format === "hardcover") {
    return 0.625;
  }

  return 0.125;
}

export function getSafeMarginIn() {
  return 0.25;
}

export function calculateCoverLayout({
  format,
  trimSize,
  paperType,
  inkType = "black_and_white",
  pageCount,
}: CoverLayoutSettings): CoverLayout {
  const trim = getCoverTrimSize(trimSize);
  const normalizedPageCount = normalizePageCount(pageCount);

  const spineWidthIn = calculateSpineWidth({
    format,
    pageCount: normalizedPageCount,
    paperType,
  });

  const bleedIn = getBleedIn(format);
  const safeMarginIn = getSafeMarginIn();

  const horizontalWrapIn = format === "hardcover" ? 0.7878 : bleedIn;
  const verticalWrapIn = format === "hardcover" ? 0.7085 : bleedIn;

  const backCoverStartIn = horizontalWrapIn;
  const spineStartIn = backCoverStartIn + trim.widthIn;
  const frontCoverStartIn = spineStartIn + spineWidthIn;

  const fullWrapWidthIn = roundToFour(
    trim.widthIn + spineWidthIn + trim.widthIn + horizontalWrapIn * 2
  );

  const fullWrapHeightIn = roundToFour(trim.heightIn + verticalWrapIn * 2);

  const isSpineTextAllowed = normalizedPageCount >= 100;

  const spineWarning = isSpineTextAllowed
    ? null
    : "KDP usually requires at least 100 pages before spine text is allowed. Keep the spine blank for shorter books.";

  const exportWarning =
    format === "hardcover"
      ? "Hardcover dimensions are currently estimated for preview. Final export should be checked against the official KDP cover template before upload."
      : "Paperback dimensions are calculated for preview and should be validated against the official KDP cover template before final upload.";

  return {
    format,
    trimSize,
    trimLabel: trim.label,
    paperType,
    inkType,
    pageCount: normalizedPageCount,

    frontCoverWidthIn: trim.widthIn,
    backCoverWidthIn: trim.widthIn,
    spineWidthIn,

    bleedIn,
    safeMarginIn,

    fullWrapWidthIn,
    fullWrapHeightIn,

    frontCoverWidthPt: inchesToPoints(trim.widthIn),
    backCoverWidthPt: inchesToPoints(trim.widthIn),
    spineWidthPt: inchesToPoints(spineWidthIn),
    fullWrapWidthPt: inchesToPoints(fullWrapWidthIn),
    fullWrapHeightPt: inchesToPoints(fullWrapHeightIn),
    bleedPt: inchesToPoints(bleedIn),
    safeMarginPt: inchesToPoints(safeMarginIn),

    backCoverStartIn: roundToFour(backCoverStartIn),
    spineStartIn: roundToFour(spineStartIn),
    frontCoverStartIn: roundToFour(frontCoverStartIn),

    backCoverStartPt: inchesToPoints(backCoverStartIn),
    spineStartPt: inchesToPoints(spineStartIn),
    frontCoverStartPt: inchesToPoints(frontCoverStartIn),

    isSpineTextAllowed,
    spineWarning,
    exportWarning,
  };
}

export function estimateCoverPageCount({
  targetLength,
  chapterWordCount,
  sectionWordCount,
  fallbackPageCount = 150,
}: {
  targetLength?: string | number | null;
  chapterWordCount?: number | null;
  sectionWordCount?: number | null;
  fallbackPageCount?: number;
}) {
  const totalWords =
    Math.max(0, chapterWordCount || 0) + Math.max(0, sectionWordCount || 0);

  if (totalWords > 0) {
    return Math.max(24, Math.ceil(totalWords / 275));
  }

  if (typeof targetLength === "number" && Number.isFinite(targetLength)) {
    return normalizePageCount(targetLength);
  }

  const targetLengthText = String(targetLength || "");
  const pageMatch = targetLengthText.match(/(\d+)\s*pages?/i);

  if (pageMatch?.[1]) {
    return normalizePageCount(Number(pageMatch[1]));
  }

  const numberMatch = targetLengthText.match(/\d+/);

  if (numberMatch?.[0]) {
    return normalizePageCount(Number(numberMatch[0]));
  }

  return normalizePageCount(fallbackPageCount);
}

export function formatInches(value: number) {
  return `${roundToFour(value)}"`;
}

export function formatPoints(value: number) {
  return `${roundToFour(value)} pt`;
}