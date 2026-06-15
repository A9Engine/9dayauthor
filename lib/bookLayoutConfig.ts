export type TrimSizeKey = "5x8" | "5.5x8.5" | "6x9";

export type BookLineSpacingKey = "Compact" | "Standard" | "Relaxed";

export type BookFontKey =
  | "Garamond"
  | "Georgia"
  | "Times New Roman"
  | "Baskerville"
  | "Arial";

export type BookLayoutConfig = {
  trimSize: TrimSizeKey;
  label: string;

  pageWidthIn: number;
  pageHeightIn: number;

  marginTopIn: number;
  marginBottomIn: number;
  marginInsideIn: number;
  marginOutsideIn: number;

  footerHeightIn: number;
  footerGapIn: number;

  bodyFontSizePt: number;
  bodyLineHeight: number;

  chapterFirstPageTopSpaceIn: number;
  sectionFirstPageTopSpaceIn: number;

  previewScale: number;
};

export const BOOK_LAYOUT_CONFIGS: Record<TrimSizeKey, BookLayoutConfig> = {
  "5x8": {
    trimSize: "5x8",
    label: "5 x 8",

    pageWidthIn: 5,
    pageHeightIn: 8,

    marginTopIn: 0.55,
    marginBottomIn: 0.55,
    marginInsideIn: 0.75,
    marginOutsideIn: 0.5,

    footerHeightIn: 0.28,
    footerGapIn: 0.16,

    bodyFontSizePt: 11,
    bodyLineHeight: 1.45,

    chapterFirstPageTopSpaceIn: 0.45,
    sectionFirstPageTopSpaceIn: 0.35,

    previewScale: 0.9,
  },

  "5.5x8.5": {
    trimSize: "5.5x8.5",
    label: "5.5 x 8.5",

    pageWidthIn: 5.5,
    pageHeightIn: 8.5,

    marginTopIn: 0.55,
    marginBottomIn: 0.55,
    marginInsideIn: 0.75,
    marginOutsideIn: 0.5,

    footerHeightIn: 0.28,
    footerGapIn: 0.16,

    bodyFontSizePt: 11.25,
    bodyLineHeight: 1.45,

    chapterFirstPageTopSpaceIn: 0.45,
    sectionFirstPageTopSpaceIn: 0.35,

    previewScale: 0.86,
  },

  "6x9": {
    trimSize: "6x9",
    label: "6 x 9",

    pageWidthIn: 6,
    pageHeightIn: 9,

    marginTopIn: 0.6,
    marginBottomIn: 0.6,
    marginInsideIn: 0.78,
    marginOutsideIn: 0.55,

    footerHeightIn: 0.3,
    footerGapIn: 0.18,

    bodyFontSizePt: 11.5,
    bodyLineHeight: 1.45,

    chapterFirstPageTopSpaceIn: .45,
    sectionFirstPageTopSpaceIn: 0.35,

    previewScale: 0.82,
  },
};

export function normalizeTrimSize(trimSize: string): TrimSizeKey {
  if (trimSize === "5 x 8") return "5x8";
  if (trimSize === "5.5 x 8.5") return "5.5x8.5";
  if (trimSize === "6 x 9") return "6x9";

  if (trimSize === "5x8") return "5x8";
  if (trimSize === "5.5x8.5") return "5.5x8.5";
  if (trimSize === "6x9") return "6x9";

  return "6x9";
}

export function getBookLayoutConfig(trimSize: string) {
  return BOOK_LAYOUT_CONFIGS[normalizeTrimSize(trimSize)];
}

export function getLineHeightValue(lineSpacing: BookLineSpacingKey) {
  if (lineSpacing === "Compact") return 1.35;
  if (lineSpacing === "Relaxed") return 1.6;

  return 1.45;
}

export function getFontFamilyValue(fontFamily: BookFontKey | string) {
  if (fontFamily === "Garamond") return "Garamond, Georgia, serif";
  if (fontFamily === "Georgia") return "Georgia, serif";
  if (fontFamily === "Times New Roman") return "'Times New Roman', Times, serif";
  if (fontFamily === "Baskerville") return "Baskerville, Georgia, serif";
  if (fontFamily === "Arial") return "Arial, sans-serif";

  return "Garamond, Georgia, serif";
}

export function getPageBodyHeightIn(config: BookLayoutConfig) {
  return (
    config.pageHeightIn -
    config.marginTopIn -
    config.marginBottomIn -
    config.footerHeightIn -
    config.footerGapIn
  );
}

export function getPageBodyWidthIn(config: BookLayoutConfig, isLeftPage: boolean) {
  const insideMargin = config.marginInsideIn;
  const outsideMargin = config.marginOutsideIn;

  return config.pageWidthIn - insideMargin - outsideMargin;
}

export function getPagePaddingIn(config: BookLayoutConfig, isLeftPage: boolean) {
  return {
    paddingTop: `${config.marginTopIn}in`,
    paddingBottom: `${config.marginBottomIn}in`,
    paddingLeft: `${isLeftPage ? config.marginOutsideIn : config.marginInsideIn}in`,
    paddingRight: `${isLeftPage ? config.marginInsideIn : config.marginOutsideIn}in`,
  };
}