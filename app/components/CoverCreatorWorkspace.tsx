"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import {
  calculateCoverLayout,
  formatInches,
  getCoverTrimSize,
  getCoverTrimSizeOptions,
  type CoverFormat,
  type CoverPaperType,
  type CoverTrimSizeKey,
} from "../../lib/coverCalculator";

import CoverRenderer from "./cover/CoverRenderer";

type ImageFitMode = "cover" | "contain";
type CoverPanelKey = "back" | "spine" | "front";
type CoverTextAlign = "left" | "center" | "right";
type CoverLayerType = "text" | "image";
type ArtworkTarget =
  | "full_wrap_background"
  | "front_background"
  | "back_background"
  | "spine_background"
  | "front_image_layer"
  | "back_image_layer"
  | "spine_image_layer";

type CoverBaseLayer = {
  id: string;
  panel: CoverPanelKey;
  type: CoverLayerType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

type CoverTextLayer = CoverBaseLayer & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: CoverTextAlign;
  letterSpacing: number;
  lineHeight: number;
};

type CoverImageLayer = CoverBaseLayer & {
  type: "image";
  src: string;
  objectFit: ImageFitMode;
  imageX: number;
  imageY: number;
  imageScale: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
};

type CoverLayer = CoverTextLayer | CoverImageLayer;

type CoverPanelStyle = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundFit: ImageFitMode;
  backgroundX: number;
  backgroundY: number;
  backgroundScale: number;
};

type CoverPanelStyles = Record<CoverPanelKey, CoverPanelStyle>;

type CropEdge = "top" | "right" | "bottom" | "left";

type SavedCoverSettings = {
  cover_format: CoverFormat | null;
  trim_size: CoverTrimSizeKey | null;
  paper_type: CoverPaperType | null;
  page_count: number | null;
  title: string | null;
  subtitle: string | null;
  author_name: string | null;
  spine_title: string | null;
  spine_author: string | null;
  back_cover_text: string | null;
  background_image_url: string | null;
  image_scale: number | null;
  image_x: number | null;
  image_y: number | null;
  image_fit_mode: ImageFitMode | null;
  show_guides: boolean | null;
  panel_styles?: CoverPanelStyles | null;
  cover_layers?: CoverLayer[] | null;
};

type CoverCreatorWorkspaceProps = {
  projectData: {
  id: string;
  title: string;
  author_name: string;
  estimatedPageCount: number;
  officialPageCount?: number | null;
  hasFinalizedManuscript?: boolean;
  compiledTrimSize?: CoverTrimSizeKey | string | null;
  compiledFormat?: string | null;
  compiledAt?: string | null;
  book_type?: string | null;
};

  savedCoverSettings?: SavedCoverSettings | null;
};

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type DragState =
  | {
      mode: "move";
      layerId: string;
      startClientX: number;
      startClientY: number;
      startX: number;
      startY: number;
      panelWidthPx: number;
      panelHeightPx: number;
    }
  | {
      mode: "crop";
      layerId: string;
      startClientX: number;
      startClientY: number;
      startX: number;
      startY: number;
      panelWidthPx: number;
      panelHeightPx: number;
    }
    | {
    mode: "crop-edge";
    layerId: string;
    edge: CropEdge;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startImageX: number;
    startImageY: number;
    panelWidthPx: number;
    panelHeightPx: number;
    startCropTop: number;
    startCropRight: number;
    startCropBottom: number;
    startCropLeft: number;
    startImageScale: number;
  }
  | {
      mode: "resize";
      layerId: string;
      corner: ResizeCorner;
      startClientX: number;
      startClientY: number;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      startImageX: number;
      startImageY: number;
      panelWidthPx: number;
      panelHeightPx: number;
    };

const PANEL_CONTROL_ORDER: CoverPanelKey[] = ["front", "spine", "back"];
const PHYSICAL_WRAP_ORDER: CoverPanelKey[] = ["back", "spine", "front"];
const CORE_TEXT_LAYER_IDS = [
  "back-description-layer",
  "front-title-layer",
  "front-subtitle-layer",
  "front-author-layer",
  "spine-text-layer",
];

const FONT_OPTIONS = [
  "Georgia",
  "Times New Roman",
  "Arial",
  "Helvetica",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
];

const TARGET_OPTIONS: { label: string; value: ArtworkTarget }[] = [
  { label: "Full wrap background", value: "full_wrap_background" },
  { label: "Front background", value: "front_background" },
  { label: "Back background", value: "back_background" },
  { label: "Spine background", value: "spine_background" },
  { label: "Moveable image on front", value: "front_image_layer" },
  { label: "Moveable image on back", value: "back_image_layer" },
  { label: "Moveable image on spine", value: "spine_image_layer" },
];

const KINDLE_COVER_WIDTH_PX = 320;
const KINDLE_COVER_HEIGHT_PX = 512;

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

function getOfficialCoverPageCount(
  projectData: CoverCreatorWorkspaceProps["projectData"],
  savedCoverSettings?: SavedCoverSettings | null
) {
  return (
    projectData.officialPageCount ||
    savedCoverSettings?.page_count ||
    projectData.estimatedPageCount ||
    150
  );
}

function createLayerId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function hexToRgba(hex: string, opacity: number) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return `rgba(255,255,255,${opacity})`;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getPanelFromArtworkTarget(target: ArtworkTarget): CoverPanelKey {
  if (target.includes("back")) return "back";
  if (target.includes("spine")) return "spine";
  return "front";
}

function defaultPanelStyles(savedCoverSettings?: SavedCoverSettings | null): CoverPanelStyles {
  const saved = savedCoverSettings?.panel_styles;

  return {
    back: {
      backgroundColor: saved?.back?.backgroundColor || "#f2ead8",
      backgroundImage: saved?.back?.backgroundImage || "",
      backgroundFit: saved?.back?.backgroundFit || "cover",
      backgroundX: saved?.back?.backgroundX || 0,
      backgroundY: saved?.back?.backgroundY || 0,
      backgroundScale: saved?.back?.backgroundScale || 100,
    },
    spine: {
      backgroundColor: saved?.spine?.backgroundColor || "#f2ead8",
      backgroundImage: saved?.spine?.backgroundImage || "",
      backgroundFit: saved?.spine?.backgroundFit || "cover",
      backgroundX: saved?.spine?.backgroundX || 0,
      backgroundY: saved?.spine?.backgroundY || 0,
      backgroundScale: saved?.spine?.backgroundScale || 100,
    },
    front: {
      backgroundColor: saved?.front?.backgroundColor || "#f2ead8",
      backgroundImage: saved?.front?.backgroundImage || "",
      backgroundFit: saved?.front?.backgroundFit || "cover",
      backgroundX: saved?.front?.backgroundX || 0,
      backgroundY: saved?.front?.backgroundY || 0,
      backgroundScale: saved?.front?.backgroundScale || 100,
    },
  };
}

function coreDefaultLayers(
  projectData: CoverCreatorWorkspaceProps["projectData"],
  savedCoverSettings?: SavedCoverSettings | null
): CoverLayer[] {
  const title = savedCoverSettings?.title || projectData.title || "Untitled Book";
  const subtitle = savedCoverSettings?.subtitle || "";
  const authorName =
    savedCoverSettings?.author_name || projectData.author_name || "Author Name";
  const spineTitle = savedCoverSettings?.spine_title || title;
  const spineAuthor = savedCoverSettings?.spine_author || authorName;
  const backCoverText =
    savedCoverSettings?.back_cover_text ||
    "Write a compelling back cover description here. Focus on the reader, the promise of the book, and why this book matters now.";

  return [
    {
      id: "back-description-layer",
      panel: "back",
      type: "text",
      label: "Back Cover Description",
      text: backCoverText,
      x: 9,
      y: 10,
      width: 76,
      height: 26,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      fontFamily: "Georgia",
      fontSize: 14,
      fontWeight: 700,
      fontStyle: "normal",
      color: "#111111",
      textAlign: "left",
      letterSpacing: 0,
      lineHeight: 1.45,
    },
    {
      id: "front-title-layer",
      panel: "front",
      type: "text",
      label: "Front Cover Title",
      text: title,
      x: 12,
      y: 14,
      width: 76,
      height: 20,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      fontFamily: "Georgia",
      fontSize: 32,
      fontWeight: 900,
      fontStyle: "normal",
      color: "#111111",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.08,
    },
    {
      id: "front-subtitle-layer",
      panel: "front",
      type: "text",
      label: "Front Cover Subtitle",
      text: subtitle,
      x: 10,
      y: 36,
      width: 80,
      height: 12,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      fontFamily: "Georgia",
      fontSize: 16,
      fontWeight: 700,
      fontStyle: "normal",
      color: "#111111",
      textAlign: "center",
      letterSpacing: 0,
      lineHeight: 1.2,
    },
    {
      id: "front-author-layer",
      panel: "front",
      type: "text",
      label: "Front Cover Author",
      text: authorName,
      x: 22,
      y: 78,
      width: 56,
      height: 10,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      fontFamily: "Georgia",
      fontSize: 14,
      fontWeight: 900,
      fontStyle: "normal",
      color: "#111111",
      textAlign: "center",
      letterSpacing: 0.18,
      lineHeight: 1.1,
    },
    {
      id: "spine-text-layer",
      panel: "spine",
      type: "text",
      label: "Spine Text",
      text: `${spineTitle} • ${spineAuthor}`,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 90,
      opacity: 1,
      zIndex: 20,
      fontFamily: "Georgia",
      fontSize: 10,
      fontWeight: 900,
      fontStyle: "normal",
      color: "#111111",
      textAlign: "center",
      letterSpacing: 0.14,
      lineHeight: 1,
    },
  ];
}

function sanitizeSavedImageLayers(value: unknown): CoverImageLayer[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((layer): layer is CoverImageLayer => {
      return (
        !!layer &&
        typeof layer === "object" &&
        (layer as Partial<CoverImageLayer>).type === "image" &&
        typeof (layer as Partial<CoverImageLayer>).src === "string" &&
        ["front", "spine", "back"].includes(
          String((layer as Partial<CoverImageLayer>).panel)
        )
      );
    })
    .map((layer) => ({
      ...layer,
      x: clampNumber(Number(layer.x), 0, 94),
      y: clampNumber(Number(layer.y), 0, 94),
      width: clampNumber(Number(layer.width), 8, 100),
      height: clampNumber(Number(layer.height), 8, 100),
      opacity: clampNumber(Number(layer.opacity), 0.1, 1),
      zIndex: Math.min(Number(layer.zIndex) || 20, 20),
      objectFit: layer.objectFit === "contain" ? "contain" : "cover",
      imageX: Number(layer.imageX) || 0,
      imageY: Number(layer.imageY) || 0,
      imageScale: clampNumber(Number(layer.imageScale) || 100, 20, 300),
      cropTop: clampNumber(Number(layer.cropTop) || 0, 0, 85),
      cropRight: clampNumber(Number(layer.cropRight) || 0, 0, 85),
      cropBottom: clampNumber(Number(layer.cropBottom) || 0, 0, 85),
      cropLeft: clampNumber(Number(layer.cropLeft) || 0, 0, 85),

    }));
}

function buildInitialLayers(
  projectData: CoverCreatorWorkspaceProps["projectData"],
  savedCoverSettings?: SavedCoverSettings | null
) {
  const defaultLayers = coreDefaultLayers(projectData, savedCoverSettings);

  const savedLayers = Array.isArray(savedCoverSettings?.cover_layers)
    ? savedCoverSettings.cover_layers
    : [];

  function getSavedLayer(layerId: string) {
    return savedLayers.find((layer) => layer?.id === layerId);
  }

  function safeNumber(value: unknown, fallback: number, min: number, max: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return clampNumber(parsed, min, max);
  }

  function safeHex(value: unknown, fallback: string) {
    if (typeof value !== "string") {
      return fallback;
    }

    return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
  }

  const mergedCoreTextLayers = defaultLayers.map((defaultLayer) => {
    if (defaultLayer.type !== "text") {
      return defaultLayer;
    }

    const savedLayer = getSavedLayer(defaultLayer.id);

    if (!savedLayer || savedLayer.type !== "text") {
      return defaultLayer;
    }

    return {
      ...defaultLayer,

      text:
        typeof savedLayer.text === "string"
          ? savedLayer.text
          : defaultLayer.text,

      x:
  defaultLayer.id === "front-subtitle-layer"
    ? Math.min(safeNumber(savedLayer.x, defaultLayer.x, 0, 96), 6)
    : Number(savedLayer.width) >= 8
    ? safeNumber(savedLayer.x, defaultLayer.x, 0, 96)
    : defaultLayer.x,

      y:
        Number(savedLayer.height) >= 5
          ? safeNumber(savedLayer.y, defaultLayer.y, 0, 96)
          : defaultLayer.y,

      width:
  defaultLayer.id === "front-subtitle-layer"
    ? Math.max(
        safeNumber(savedLayer.width, defaultLayer.width, 8, 100),
        88
      )
    : Number(savedLayer.width) >= 8
    ? safeNumber(savedLayer.width, defaultLayer.width, 8, 100)
    : defaultLayer.width,

      height:
        Number(savedLayer.height) >= 5
          ? safeNumber(savedLayer.height, defaultLayer.height, 5, 100)
          : defaultLayer.height,

      opacity: safeNumber(savedLayer.opacity, defaultLayer.opacity, 0.1, 1),
      zIndex: safeNumber(savedLayer.zIndex, defaultLayer.zIndex, 1, 100),

      fontFamily:
        typeof savedLayer.fontFamily === "string" && savedLayer.fontFamily.trim()
          ? savedLayer.fontFamily
          : defaultLayer.fontFamily,

      fontSize: safeNumber(savedLayer.fontSize, defaultLayer.fontSize, 6, 96),

      fontWeight: safeNumber(
        savedLayer.fontWeight,
        defaultLayer.fontWeight,
        100,
        1000
      ),

      fontStyle:
      savedLayer.fontStyle === "italic" ? "italic" : "normal",

      color: safeHex(savedLayer.color, defaultLayer.color),

      textAlign:
        savedLayer.textAlign === "left" ||
        savedLayer.textAlign === "center" ||
        savedLayer.textAlign === "right"
          ? savedLayer.textAlign
          : defaultLayer.textAlign,

      letterSpacing: safeNumber(
        savedLayer.letterSpacing,
        defaultLayer.letterSpacing,
        0,
        1
      ),

      lineHeight: safeNumber(
        savedLayer.lineHeight,
        defaultLayer.lineHeight,
        0.8,
        2
      ),
    } as CoverTextLayer;
  });

  return [
    ...mergedCoreTextLayers,
    ...sanitizeSavedImageLayers(
  Array.isArray(savedCoverSettings?.cover_layers)
    ? savedCoverSettings.cover_layers
    : (savedCoverSettings?.cover_layers as any)?.paperback
),
  ];
}

function getCoverCreatorCacheKey(projectId: string) {
  return `cover-creator-cache-${projectId}`;
}

export default function CoverCreatorWorkspace({
  projectData,
  savedCoverSettings,
}: CoverCreatorWorkspaceProps) {

  const coverCacheKey = getCoverCreatorCacheKey(projectData.id);

function readCoverCache() {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(coverCacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

const cachedCover = readCoverCache();

  const [viewportWidth, setViewportWidth] = useState(1200);

  const finalizedTrimSize = normalizeCoverTrimSize(projectData.compiledTrimSize);
  const initialTrimSize =
    finalizedTrimSize ||
    normalizeCoverTrimSize(savedCoverSettings?.trim_size) ||
    "6x9";

  const [coverFormat, setCoverFormat] = useState<CoverFormat>(
    savedCoverSettings?.cover_format || "paperback"
  );
  const [trimSize, setTrimSize] = useState<CoverTrimSizeKey>(initialTrimSize);
  const [hardcoverTrimSizeOverride, setHardcoverTrimSizeOverride] = useState<
    CoverTrimSizeKey | ""
  >("");
  const [paperType, setPaperType] = useState<CoverPaperType>(
    savedCoverSettings?.paper_type || "white"
  );
  const [pageCount, setPageCount] = useState(
    getOfficialCoverPageCount(projectData, savedCoverSettings)
  );

  const [isExportingCover, setIsExportingCover] = useState(false);

  const [isExportingKindleCover, setIsExportingKindleCover] =
  useState(false);

  const [snapGuide, setSnapGuide] = useState<{
  panel: CoverPanelKey;
  type: "vertical-center";
} | null>(null);

  const [title, setTitle] = useState(
  cachedCover?.title ??
    savedCoverSettings?.title ??
    projectData.title ??
    ""
);

const [subtitle, setSubtitle] = useState(
  cachedCover?.subtitle ??
    savedCoverSettings?.subtitle ??
    ""
);

const [authorName, setAuthorName] = useState(
  cachedCover?.authorName ??
    savedCoverSettings?.author_name ??
    projectData.author_name ??
    "Author Name"
);

const [spineTitle, setSpineTitle] = useState(
  cachedCover?.spineTitle ??
    savedCoverSettings?.spine_title ??
    projectData.title ??
    ""
);

const [spineAuthor, setSpineAuthor] = useState(
  cachedCover?.spineAuthor ??
    savedCoverSettings?.spine_author ??
    projectData.author_name ??
    "Author Name"
);

const [backCoverText, setBackCoverText] = useState(
  cachedCover?.backCoverText ??
    savedCoverSettings?.back_cover_text ??
    "Write a compelling back cover description here. Focus on the reader, the promise of the book, and why this book matters now."
);

const [fullWrapBackgroundImage, setFullWrapBackgroundImage] = useState(
  cachedCover?.fullWrapBackgroundImage ??
    savedCoverSettings?.background_image_url ??
    ""
);

const [fullWrapImageScale, setFullWrapImageScale] = useState(
  cachedCover?.fullWrapImageScale ??
    savedCoverSettings?.image_scale ??
    100
);

const [fullWrapImageX, setFullWrapImageX] = useState(
  cachedCover?.fullWrapImageX ??
    savedCoverSettings?.image_x ??
    0
);

const [fullWrapImageY, setFullWrapImageY] = useState(
  cachedCover?.fullWrapImageY ??
    savedCoverSettings?.image_y ??
    0
);

const [fullWrapImageFitMode, setFullWrapImageFitMode] =
  useState<ImageFitMode>(
    cachedCover?.fullWrapImageFitMode ??
      savedCoverSettings?.image_fit_mode ??
      "cover"
  );

const [selectedPanel, setSelectedPanel] = useState<CoverPanelKey>("front");
const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

const [panelStyles, setPanelStyles] = useState<CoverPanelStyles>(
  cachedCover?.panelStyles ?? defaultPanelStyles(savedCoverSettings)
);

const initialLayers = useMemo(
  () => buildInitialLayers(projectData, savedCoverSettings),
  [projectData, savedCoverSettings]
);

const savedLayerSets =
  savedCoverSettings?.cover_layers &&
  !Array.isArray(savedCoverSettings.cover_layers)
    ? (savedCoverSettings.cover_layers as any)
    : null;

const [paperbackLayers, setPaperbackLayers] = useState<CoverLayer[]>(
  () => cachedCover?.paperbackLayers ?? savedLayerSets?.paperback ?? initialLayers
);

const [hardcoverLayers, setHardcoverLayers] = useState<CoverLayer[]>(
  () => cachedCover?.hardcoverLayers ?? savedLayerSets?.hardcover ?? initialLayers
);

const [kindleLayers, setKindleLayers] = useState<CoverLayer[]>(
  () =>
    cachedCover?.kindleLayers ??
    savedLayerSets?.kindle ??
    initialLayers.filter((layer) => layer.panel === "front")
);

const [coverAssetMode, setCoverAssetMode] = useState<
  "paperback" | "hardcover" | "kindle"
>(cachedCover?.coverAssetMode ?? "paperback");

const finalizedManuscriptTrimSize =
  normalizeCoverTrimSize(projectData.compiledTrimSize) || initialTrimSize;

const hardcoverRequiresManualTrimSize =
  coverAssetMode === "hardcover" && finalizedManuscriptTrimSize === "5x8";

const isHardcoverTrimSizeMissing =
  hardcoverRequiresManualTrimSize && !hardcoverTrimSizeOverride;

const activeTrimSize: CoverTrimSizeKey =
  hardcoverRequiresManualTrimSize && hardcoverTrimSizeOverride
    ? hardcoverTrimSizeOverride
    : trimSize;

const activePrintFormat: CoverFormat =
  coverAssetMode === "hardcover" ? "hardcover" : "paperback";

const coverLayers =
  coverAssetMode === "kindle"
    ? kindleLayers
    : coverAssetMode === "hardcover"
    ? hardcoverLayers
    : paperbackLayers;

const setCoverLayers =
  coverAssetMode === "kindle"
    ? setKindleLayers
    : coverAssetMode === "hardcover"
    ? setHardcoverLayers
    : setPaperbackLayers;

  const [artworkTarget, setArtworkTarget] = useState<ArtworkTarget>(
    "front_image_layer"
  );
  const [backgroundSourceLabel, setBackgroundSourceLabel] = useState(
    savedCoverSettings?.background_image_url ? "Saved full wrap background" : ""
  );
  const [isDraggingArtwork, setIsDraggingArtwork] = useState(false);
  const [showGuides, setShowGuides] = useState(
    savedCoverSettings?.show_guides ?? true
  );

  useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      coverCacheKey,
      JSON.stringify({
        title,
        subtitle,
        authorName,
        spineTitle,
        spineAuthor,
        backCoverText,
        fullWrapBackgroundImage,
        fullWrapImageScale,
        fullWrapImageX,
        fullWrapImageY,
        fullWrapImageFitMode,
        panelStyles,
        paperbackLayers,
        hardcoverLayers,
        kindleLayers,
        coverAssetMode,
        showGuides,
      })
    );
  } catch (error) {
    console.warn("Could not cache cover creator state", error);
  }
}, [
  coverCacheKey,
  title,
  subtitle,
  authorName,
  spineTitle,
  spineAuthor,
  backCoverText,
  fullWrapBackgroundImage,
  fullWrapImageScale,
  fullWrapImageX,
  fullWrapImageY,
  fullWrapImageFitMode,
  panelStyles,
  paperbackLayers,
  hardcoverLayers,
  kindleLayers,
  coverAssetMode,
  showGuides,
]);

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationDots, setGenerationDots] = useState(1);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);



  const [showLayersPanel, setShowLayersPanel] = useState(false);

  const dragStateRef = useRef<DragState | null>(null);

  const [layerEditorPosition, setLayerEditorPosition] = useState({
  x: 20,
  y: 20,
    });

  const [isDraggingLayerEditor, setIsDraggingLayerEditor] = useState(false);
  const layerEditorDragOffsetRef = useRef({ x: 0, y: 0 });
  const livePreviewRef = useRef<HTMLDivElement | null>(null);

function scrollToLivePreview() {
  livePreviewRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
  const [cropLayerId, setCropLayerId] = useState<string | null>(null);

    useEffect(() => {
  function handleMove(event: MouseEvent) {
    if (!isDraggingLayerEditor) return;

    setLayerEditorPosition({
      x: clampNumber(
        event.clientX - layerEditorDragOffsetRef.current.x,
        12,
        window.innerWidth - 420
      ),
      y: clampNumber(
        event.clientY - layerEditorDragOffsetRef.current.y,
        12,
        window.innerHeight - 120
      ),
    });
  }

  function handleUp() {
    setIsDraggingLayerEditor(false);
  }

  window.addEventListener("mousemove", handleMove);
  window.addEventListener("mouseup", handleUp);

  return () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleUp);
  };
}, [isDraggingLayerEditor, layerEditorPosition.x, layerEditorPosition.y]);

  useEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    const nextTrimSize = normalizeCoverTrimSize(projectData.compiledTrimSize);

    if (nextTrimSize) {
      setTrimSize(nextTrimSize);
      setHardcoverTrimSizeOverride("");
    }

    if (projectData.hasFinalizedManuscript) {
      setPageCount(getOfficialCoverPageCount(projectData, savedCoverSettings));
    }
  }, [
    projectData.compiledTrimSize,
    projectData.officialPageCount,
    projectData.estimatedPageCount,
    projectData.hasFinalizedManuscript,
    savedCoverSettings?.page_count,
  ]);

  useEffect(() => {
    if (!isGeneratingImage) return;

    const interval = setInterval(() => {
      setGenerationDots((current) => (current >= 3 ? 1 : current + 1));
    }, 450);

    return () => clearInterval(interval);
  }, [isGeneratingImage]);

  const layout = useMemo(() => {
  return calculateCoverLayout({
    format: activePrintFormat,
    trimSize: activeTrimSize,
    paperType,
    pageCount,
  });
}, [activePrintFormat, activeTrimSize, paperType, pageCount]);

  const previewScale = useMemo(() => {
    const usableWidth = viewportWidth < 768 ? viewportWidth - 72 : 900;
    const responsiveScale = usableWidth / layout.fullWrapWidthIn;

    return Math.max(30, Math.min(70, responsiveScale));
  }, [layout.fullWrapWidthIn, viewportWidth]);

  const bleedPx = layout.bleedIn * previewScale;
const safeMarginPx = layout.safeMarginIn * previewScale;
const backCoverWidthPx = layout.backCoverWidthIn * previewScale;
const frontCoverWidthPx = layout.frontCoverWidthIn * previewScale;
const realSpineWidthPx = layout.spineWidthIn * previewScale;

// Keep the tiny mobile visual spine minimum only for very small screens.
// On desktop/export-style preview, use the real spine width.
const spineWidthPx =
  viewportWidth < 768 ? Math.max(realSpineWidthPx, 12) : realSpineWidthPx;

const wrapHeightPx = layout.fullWrapHeightIn * previewScale;
const visualWrapWidthPx = layout.fullWrapWidthIn * previewScale;

const trim = getCoverTrimSize(activeTrimSize);
const verticalWrapPx =
  ((layout.fullWrapHeightIn - trim.heightIn) / 2) * previewScale;

// Important:
// For hardcover, do not use bleed as the trim/wrap starting point.
// Use the layout start positions from coverCalculator.ts.
const trimTopPx = verticalWrapPx;
const trimBottomPx = wrapHeightPx - verticalWrapPx;

const backTrimLeftPx = layout.backCoverStartIn * previewScale;
const backTrimRightPx = backTrimLeftPx + backCoverWidthPx;

const spineLeftPx = layout.spineStartIn * previewScale;
const frontTrimLeftPx = layout.frontCoverStartIn * previewScale;

  const fullWrapImageTransform = `translate(${fullWrapImageX}px, ${fullWrapImageY}px) scale(${
    fullWrapImageScale / 100
  })`;

  const selectedLayer = useMemo(() => {
    if (!selectedLayerId) return null;
    return coverLayers.find((layer) => layer.id === selectedLayerId) || null;
  }, [coverLayers, selectedLayerId]);

  const visibleCoverLayers = useMemo(() => {
  if (coverAssetMode === "kindle") {
    return coverLayers.filter((layer) => layer.panel === "front");
  }

  return coverLayers;
}, [coverAssetMode, coverLayers]);

  function markUnsaved() {
    setSaveMessage("");
    setLastSavedAt(null);
  }

  function updateLayer(layerId: string, updates: Partial<CoverLayer>) {
    setCoverLayers((current) =>
      current.map((layer) =>
        layer.id === layerId ? ({ ...layer, ...updates } as CoverLayer) : layer
      )
    );
    markUnsaved();
  }

  function updateTextLayer(layerId: string, updates: Partial<CoverTextLayer>) {
    setCoverLayers((current) =>
      current.map((layer) =>
        layer.id === layerId && layer.type === "text"
          ? ({ ...layer, ...updates } as CoverTextLayer)
          : layer
      )
    );
    markUnsaved();
  }

  function updatePanelStyle(
    panel: CoverPanelKey,
    updates: Partial<CoverPanelStyle>
  ) {
    setPanelStyles((current) => ({
      ...current,
      [panel]: {
        ...current[panel],
        ...updates,
      },
    }));
    markUnsaved();
  }

  function syncTextLayer(layerId: string, text: string) {
    updateTextLayer(layerId, { text });
  }

  function updateTitle(nextTitle: string) {
    setTitle(nextTitle);
    setSpineTitle(nextTitle);
    syncTextLayer("front-title-layer", nextTitle);
    syncTextLayer(
      "spine-text-layer",
      `${nextTitle || "Untitled Book"} • ${spineAuthor || authorName || "Author Name"}`
    );
  }

  function updateSubtitle(nextSubtitle: string) {
    setSubtitle(nextSubtitle);
    syncTextLayer("front-subtitle-layer", nextSubtitle);
  }

  function updateAuthorName(nextAuthorName: string) {
    setAuthorName(nextAuthorName);
    setSpineAuthor(nextAuthorName);
    syncTextLayer("front-author-layer", nextAuthorName);
    syncTextLayer(
      "spine-text-layer",
      `${spineTitle || title || "Untitled Book"} • ${nextAuthorName || "Author Name"}`
    );
  }

  function updateSpineTitle(nextSpineTitle: string) {
    setSpineTitle(nextSpineTitle);
    syncTextLayer(
      "spine-text-layer",
      `${nextSpineTitle || title || "Untitled Book"} • ${
        spineAuthor || authorName || "Author Name"
      }`
    );
  }

  function updateSpineAuthor(nextSpineAuthor: string) {
    setSpineAuthor(nextSpineAuthor);
    syncTextLayer(
      "spine-text-layer",
      `${spineTitle || title || "Untitled Book"} • ${
        nextSpineAuthor || authorName || "Author Name"
      }`
    );
  }

  function updateBackCoverText(nextText: string) {
    setBackCoverText(nextText);
    syncTextLayer("back-description-layer", nextText);
  }

  function addMoveableImageLayer(panel: CoverPanelKey, src: string, label: string) {
    const newLayer: CoverImageLayer = {
      id: createLayerId("image-layer"),
      panel,
      type: "image",
      label,
      src,
      x: 16,
      y: 16,
      width: panel === "spine" ? 80 : 44,
      height: panel === "spine" ? 30 : 44,
      rotation: 0,
      opacity: 1,
      zIndex: 20,
      objectFit: "contain",
      imageX: 0,
      imageY: 0,
      imageScale: 100,
      cropTop: 0,
      cropRight: 0,
      cropBottom: 0,
      cropLeft: 0,
    };

    setCoverLayers((current) => [...current, newLayer]);
    setSelectedPanel(panel);
    setSelectedLayerId(newLayer.id);
    markUnsaved();
  }

  function deleteLayer(layerId: string) {
    setCoverLayers((current) =>
      current.filter(
        (layer) =>
          layer.id !== layerId ||
          [
            "back-description-layer",
            "front-title-layer",
            "front-subtitle-layer",
            "front-author-layer",
            "spine-text-layer",
          ].includes(layer.id)
      )
    );
    setSelectedLayerId(null);
    markUnsaved();
  }

  function applyImageToTarget(imageData: string, label: string, target: ArtworkTarget) {
    if (target === "full_wrap_background") {
      setFullWrapBackgroundImage(imageData);
      setFullWrapImageScale(100);
      setFullWrapImageX(0);
      setFullWrapImageY(0);
      setFullWrapImageFitMode("cover");
      setBackgroundSourceLabel(label);
      setGenerationStatus("Artwork added as full wrap background.");
      markUnsaved();
      return;
    }

    if (target.endsWith("_background")) {
      const panel = getPanelFromArtworkTarget(target);
      updatePanelStyle(panel, {
        backgroundImage: imageData,
        backgroundFit: "cover",
        backgroundX: 0,
        backgroundY: 0,
        backgroundScale: 100,
      });
      setSelectedPanel(panel);
      setBackgroundSourceLabel(`${label} on ${panel} background`);
      setGenerationStatus(`Artwork added to ${panel} background.`);
      return;
    }

    const panel = getPanelFromArtworkTarget(target);
    addMoveableImageLayer(panel, imageData, label);
    setBackgroundSourceLabel(`${label} as moveable ${panel} image`);
    setGenerationStatus(`Moveable image added to ${panel} cover.`);
  }

  async function applyArtworkFile(file: File) {
  if (!file.type.startsWith("image/")) {
    setGenerationError("Please upload an image file.");
    return;
  }

  setGenerationError("");
  setGenerationStatus(`Uploading artwork: ${file.name}`);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectData.id);

    const response = await fetch("/api/upload-cover-artwork", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.url) {
      setGenerationError(result.error || "Could not upload artwork.");
      setGenerationStatus("");
      return;
    }

    applyImageToTarget(result.url, file.name, artworkTarget);
  } catch (error) {
    console.error(error);
    setGenerationError("Something went wrong uploading the image.");
    setGenerationStatus("");
  }
}

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    void applyArtworkFile(file);
    event.target.value = "";
  }

  function handleArtworkDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingArtwork(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    void applyArtworkFile(file);
  }

  async function generateAIBackground() {
    if (!aiPrompt.trim()) {
      setGenerationError("Add a background prompt first.");
      setGenerationStatus("");
      return;
    }

    try {
      setIsGeneratingImage(true);
      setGenerationError("");
      setGenerationStatus(
        "Generating cover artwork. This may take 20 to 60 seconds."
      );

      const response = await fetch("/api/generate-cover-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          title,
          genre: projectData.book_type || "",
          coverFormat: activePrintFormat,
          trimSize: activeTrimSize,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGenerationError(result.error || "Could not generate image.");
        setGenerationStatus("");
        return;
      }

      const imageValue =
        result.imageDataUrl ||
        result.imageUrl ||
        result.url ||
        result.data?.imageDataUrl ||
        result.data?.imageUrl ||
        "";

      if (!imageValue) {
        setGenerationError("The image finished, but no image URL was returned.");
        setGenerationStatus("");
        return;
      }

      applyImageToTarget(imageValue, "AI generated artwork", artworkTarget);
    } catch (error) {
      console.error(error);
      setGenerationError("Something went wrong generating the image.");
      setGenerationStatus("");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function exportPaperbackCover() {
  try {
    if (coverAssetMode === "hardcover" && isHardcoverTrimSizeMissing) {
      setSaveMessage(
        "Please select a supported hardcover book size before exporting."
      );
      return;
    }

    if (!projectData?.id) {
      setSaveMessage("Missing project ID. Please refresh and try again.");
      return;
    }

    setIsExportingCover(true);
    setSaveMessage("Exporting print cover...");

    const format = activePrintFormat
    

    const params = new URLSearchParams({
      projectId: projectData.id,
      format,
      trimSize: activeTrimSize,
    });

    const response = await fetch(`/api/export-cover?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Cover export failed:", response.status, errorText);
      setSaveMessage("Cover export failed. Please try again.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const safeTitle = String(projectData.title || "book")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}-${format}-cover.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    setSaveMessage("Print cover exported.");
  } catch (error) {
    console.error("Something went wrong exporting the cover:", error);
    setSaveMessage("Something went wrong exporting the cover.");
  } finally {
    setIsExportingCover(false);
  }
}

async function exportKindleCover() {
  if (!projectData?.id) return;

  try {
    setIsExportingKindleCover(true);

    const response = await fetch(
      `/api/export-kindle-cover?projectId=${projectData.id}`
    );

    if (!response.ok) {
      throw new Error("Failed to export Kindle cover");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "kindle-cover.jpg";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

    setSaveMessage("Kindle cover exported and saved to My Books.");
  } catch (error) {
    console.error(error);
    alert("Failed to export Kindle cover.");
  } finally {
    setIsExportingKindleCover(false);
  }
}

  async function saveCoverSettings() {
  try {
    setIsSavingCover(true);
    setSaveMessage("Saving cover settings...");

    const frontTitleLayer = coverLayers.find(
      (layer) => layer.id === "front-title-layer" && layer.type === "text"
    ) as CoverTextLayer | undefined;

    const frontSubtitleLayer = coverLayers.find(
      (layer) => layer.id === "front-subtitle-layer" && layer.type === "text"
    ) as CoverTextLayer | undefined;

    const frontAuthorLayer = coverLayers.find(
      (layer) => layer.id === "front-author-layer" && layer.type === "text"
    ) as CoverTextLayer | undefined;

    const backDescriptionLayer = coverLayers.find(
      (layer) => layer.id === "back-description-layer" && layer.type === "text"
    ) as CoverTextLayer | undefined;

    const cleanTitle = frontTitleLayer?.text || title;
    const cleanSubtitle = frontSubtitleLayer?.text || subtitle;
    const cleanAuthorName = frontAuthorLayer?.text || authorName;
    const cleanBackCoverText = backDescriptionLayer?.text || backCoverText;

    const response = await fetch("/api/save-cover-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: projectData.id,
        cover_format: activePrintFormat,
        trim_size: activeTrimSize,
        paper_type: paperType,
        page_count: pageCount,

        title: cleanTitle,
        subtitle: cleanSubtitle,
        author_name: cleanAuthorName,
        spine_title: spineTitle,
        spine_author: spineAuthor,
        back_cover_text: cleanBackCoverText,

        background_image_url: fullWrapBackgroundImage,
        image_scale: fullWrapImageScale,
        image_x: fullWrapImageX,
        image_y: fullWrapImageY,
        image_fit_mode: fullWrapImageFitMode,
        show_guides: showGuides,

        panel_styles: panelStyles,
        cover_layers: {
            paperback: paperbackLayers,
            hardcover: hardcoverLayers,
            kindle: kindleLayers,
            },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setSaveMessage(result.error || "Could not save cover settings.");
      return;
    }

    if (projectData?.id && coverAssetMode === "kindle") {
  setSaveMessage("Cover settings saved. Updating My Books cover...");

  await fetch(
    `/api/export-kindle-cover?projectId=${projectData.id}&saveOnly=true`
  );

  setSaveMessage("Cover settings saved. My Books cover updated.");
}

    setTitle(cleanTitle);
    setSubtitle(cleanSubtitle);
    setAuthorName(cleanAuthorName);
    setBackCoverText(cleanBackCoverText);

    setLastSavedAt(new Date().toLocaleTimeString());
    if (coverAssetMode !== "kindle") {
  setSaveMessage("Cover settings saved.");
}

  } catch (error) {
    console.error(error);
    setSaveMessage("Something went wrong saving cover settings.");
   } finally {
  setIsSavingCover(false);
}
  
}

  function removeBackgroundArtwork() {
    setFullWrapBackgroundImage("");
    setPanelStyles((current) => ({
      back: { ...current.back, backgroundImage: "" },
      spine: { ...current.spine, backgroundImage: "" },
      front: { ...current.front, backgroundImage: "" },
    }));
    setBackgroundSourceLabel("");
    setGenerationStatus("Background artwork removed.");
    markUnsaved();
  }

  function getPanelLayers(panel: CoverPanelKey) {
    return coverLayers
      .filter(
        (layer) =>
          layer.panel === panel && !CORE_TEXT_LAYER_IDS.includes(layer.id)
      )
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  function getCoreTextLayer(layerId: string) {
    const layer = coverLayers.find((item) => item.id === layerId);

    if (!layer || layer.type !== "text") return null;

    return layer;
  }



  function renderCoreTextOverlay(layerId: string) {
    const layer = getCoreTextLayer(layerId);

    if (!layer) return null;

    const isSelected = selectedLayerId === layer.id;
    const fontScale = Math.max(0.55, Math.min(1, previewScale / 70));
    const previewZIndex = Math.min(Number(layer.zIndex || 20), 20);

    if (coverAssetMode === "kindle" && layer.panel !== "front") {
  return null;
}

if (layer.panel === "spine") {
  return (
    <div
      key={layer.id}
      onMouseDown={(event) => beginLayerDrag(event, layer, "move")}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedPanel("spine");
        setSelectedLayerId(layer.id);
      }}
      style={{
        position: "absolute",
        pointerEvents: "auto",
        left: `${spineLeftPx}px`,
        top: "0px",
        width: `${spineWidthPx}px`,
        height: `${wrapHeightPx}px`,
        zIndex: 20,
        cursor: "grab",
        outline: isSelected ? "2px solid #d4af37" : "none",
      }}
    >
      <svg
        width={spineWidthPx}
        height={wrapHeightPx}
        viewBox={`0 0 ${spineWidthPx} ${wrapHeightPx}`}
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
      >
        <text
          x={spineWidthPx / 2}
          y={wrapHeightPx / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90 ${spineWidthPx / 2} ${wrapHeightPx / 2})`}
          style={{
            fill: layer.color,
            fontFamily: layer.fontFamily === "Georgia" ? "CoverSerif" : layer.fontFamily,
            fontSize: `${Math.max(7, layer.fontSize * fontScale)}px`,
            fontWeight: layer.fontWeight,
            fontStyle: layer.fontStyle,
            letterSpacing: `${layer.letterSpacing * 14}px`,
            textTransform: "uppercase",
          }}
        >
          {layer.text}
        </text>
      </svg>
    </div>
  );
}

    const panelRect = getPanelRect(layer.panel);
    const panelLeftPx = panelRect.left;
    const panelWidthPx = panelRect.width;

    const bounds = {
      x: clampNumber(layer.x, 0, 96),
      y: clampNumber(layer.y, 0, 96),
      width:
        layer.id === "back-description-layer"
          ? Math.max(layer.width, 68)
          : layer.id === "front-title-layer"
          ? Math.max(layer.width, 68)
          : layer.id === "front-subtitle-layer"
          ? Math.max(layer.width, 72)
          : layer.id === "front-author-layer"
          ? Math.max(layer.width, 46)
          : Math.max(layer.width, 18),
      height:
        layer.id === "back-description-layer"
            ? Math.max(layer.height, 10)
            : layer.id === "front-title-layer"
            ? Math.max(layer.height, 4)
            : layer.id === "front-subtitle-layer"
            ? Math.max(layer.height, 3)
            : layer.id === "front-author-layer"
            ? Math.max(layer.height, 3)
            : Math.max(layer.height, 3),
            };

    return (
      <div
        key={layer.id}
        onMouseDown={(event) => beginLayerDrag(event, layer, "move")}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedPanel(layer.panel);
          setSelectedLayerId(layer.id);
        }}
        style={{
          position: "absolute",
          pointerEvents: "auto",
          left: `${panelLeftPx + (bounds.x / 100) * panelWidthPx}px`,
          top: `${(bounds.y / 100) * wrapHeightPx}px`,
          width: `${(bounds.width / 100) * panelWidthPx}px`,
          height: "auto",
          minHeight: "auto",
          zIndex: 20,
          color: layer.color,
          fontFamily: layer.fontFamily === "Georgia" ? "CoverSerif" : layer.fontFamily,
          fontSize: `${Math.max(10, layer.fontSize * fontScale)}px`,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          letterSpacing: `${layer.letterSpacing}em`,
          lineHeight: layer.lineHeight,
          textAlign: layer.textAlign,
          opacity: layer.opacity,
          cursor: "grab",
          padding: isSelected ? "4px 6px" : "0px",
          border: isSelected ? "2px solid #d4af37" : "2px solid transparent",
          borderRadius: "12px",
          textShadow: "0 1px 2px rgba(255,255,255,0.35)",
        }}
      >
        <div className="whitespace-pre-wrap">{layer.text}</div>
      </div>
    );
  }

  function getPanelRect(panel: CoverPanelKey) {
  if (coverAssetMode === "kindle") {
    return {
      left: 0,
      top: 0,
      width: frontCoverWidthPx + bleedPx,
      height: wrapHeightPx,
    };
  }

  if (panel === "back") {
    return {
      left: 0,
      top: 0,
      width: backCoverWidthPx + bleedPx,
      height: wrapHeightPx,
    };
  }

  if (panel === "spine") {
    return {
      left: spineLeftPx,
      top: 0,
      width: spineWidthPx,
      height: wrapHeightPx,
    };
  }

  return {
    left: frontTrimLeftPx - safeMarginPx,
    top: 0,
    width: frontCoverWidthPx + bleedPx,
    height: wrapHeightPx,
  };
}

function renderArtworkOverlays() {
  const imageLayers = coverLayers.filter(
    (layer): layer is CoverImageLayer => layer.type === "image"
  );

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      {imageLayers.map((layer) => {
    if (coverAssetMode === "kindle" && layer.panel !== "front") return null;
        const panelRect = getPanelRect(layer.panel);
        const isSelected = selectedLayerId === layer.id;

        return (
          <div
            key={layer.id}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              beginLayerDrag(event, layer, "move");
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSelectedPanel(layer.panel);
              setSelectedLayerId(layer.id);
            }}
            style={{
              position: "absolute",
              left: `${panelRect.left + (layer.x / 100) * panelRect.width}px`,
              top: `${panelRect.top + (layer.y / 100) * panelRect.height}px`,
              width:
  layer.id === "front-subtitle-layer"
    ? `${panelRect.width * 0.88}px`
    : `${(layer.width / 100) * panelRect.width}px`,
              height: `${(layer.height / 100) * panelRect.height}px`,
              opacity: layer.opacity,
              cursor: "grab",
              touchAction: "none",
              overflow: "hidden",
              pointerEvents: "auto",
              zIndex: Number(layer.zIndex || 20) + 60,
              border: isSelected ? "2px solid #d4af37" : "2px solid transparent",
              boxShadow: isSelected
                ? "0 0 0 4px rgba(212,175,55,0.22)"
                : "none",
            }}
          >
            <img
            src={layer.src}
            alt={layer.label}
            onMouseDown={(event) => beginImageCropDrag(event, layer)}
            style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            width: `${layer.imageScale ?? 100}%`,
            height: "auto",
            maxWidth: "none",
            maxHeight: "none",
            display: "block",
            pointerEvents: cropLayerId === layer.id ? "auto" : "none",
            cursor: cropLayerId === layer.id ? "move" : "inherit",
            filter: "none",
            transform: `translate(${layer.imageX ?? 0}px, ${layer.imageY ?? 0}px)`,
            transformOrigin: "top left",
            }}
            />

            {isSelected ? (
  <>
    {([
      ["top-left", "nw-resize", { left: "-10px", top: "-10px" }],
      ["top-right", "ne-resize", { right: "-10px", top: "-10px" }],
      ["bottom-left", "sw-resize", { left: "-10px", bottom: "-10px" }],
      ["bottom-right", "se-resize", { right: "-10px", bottom: "-10px" }],
    ] as const).map(([corner, cursor, position]) => (
      <div
        key={corner}
        onMouseDown={(event) => beginLayerDrag(event, layer, "resize", corner)}
        style={{
          position: "absolute",
          width: "20px",
          height: "20px",
          borderRadius: "999px",
          background: "#d4af37",
          border: "3px solid white",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          cursor,
          zIndex: 9999,
          ...position,
        }}
      />
    ))}

    {cropLayerId === layer.id
  ? ([
      ["top", "ns-resize", { left: "0px", right: "0px", top: "0px", height: "10px", borderTopWidth: "2px" }],
      ["right", "ew-resize", { top: "0px", bottom: "0px", right: "0px", width: "10px", borderRightWidth: "2px" }],
      ["bottom", "ns-resize", { left: "0px", right: "0px", bottom: "0px", height: "10px", borderBottomWidth: "2px" }],
      ["left", "ew-resize", { top: "0px", bottom: "0px", left: "0px", width: "10px", borderLeftWidth: "2px" }],
    ] as const).map(([edge, cursor, position]) => (
          <div
            key={edge}
            onMouseDown={(event) => beginCropEdgeDrag(event, layer, edge)}
            style={{
            position: "absolute",
            background: "transparent",
            borderColor: "#2563eb",
            borderStyle: "dashed",
            cursor,
            zIndex: 9998,
            ...position,
            }}
          />
        ))
      : null}
  </>
) : null}
          </div>
        );
      })}
    </div>
  );
}

  function renderCoreTextOverlays() {
    return (
      <div
        className="absolute inset-0"
        style={{ zIndex: 20, pointerEvents: "none" }}
      >
        {CORE_TEXT_LAYER_IDS.map((layerId) => renderCoreTextOverlay(layerId))}
      </div>
    );
  }

  function getPanelPixelSize(panel: CoverPanelKey) {
    if (panel === "back") {
      return { width: backCoverWidthPx + bleedPx, height: wrapHeightPx };
    }

    if (panel === "front") {
      return { width: frontCoverWidthPx + bleedPx, height: wrapHeightPx };
    }

    return { width: spineWidthPx, height: wrapHeightPx };
  }

  function beginCropEdgeDrag(
  event: ReactMouseEvent<HTMLDivElement>,
  layer: CoverImageLayer,
  edge: CropEdge
) {
  if (cropLayerId !== layer.id) return;

  event.preventDefault();
  event.stopPropagation();

  const size = getPanelPixelSize(layer.panel);

  dragStateRef.current = {
    mode: "crop-edge",
    layerId: layer.id,
    edge,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: layer.x,
    startY: layer.y,
    startWidth: layer.width,
    startHeight: layer.height,
    startImageX: layer.imageX ?? 0,
    startImageY: layer.imageY ?? 0,
    startImageScale: layer.imageScale ?? 100,
    panelWidthPx: size.width,
    panelHeightPx: size.height,
    startCropTop: layer.cropTop ?? 0,
    startCropRight: layer.cropRight ?? 0,
    startCropBottom: layer.cropBottom ?? 0,
    startCropLeft: layer.cropLeft ?? 0,
  };
}

  function beginImageCropDrag(
  event: ReactMouseEvent<HTMLImageElement>,
  layer: CoverImageLayer
) {
  if (cropLayerId !== layer.id) return;

  event.preventDefault();
  event.stopPropagation();

  const size = getPanelPixelSize(layer.panel);

  dragStateRef.current = {
    mode: "crop",
    layerId: layer.id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: layer.imageX ?? 0,
    startY: layer.imageY ?? 0,
    panelWidthPx: size.width,
    panelHeightPx: size.height,
  };
}

  function beginLayerDrag(
  event: ReactMouseEvent<HTMLDivElement>,
  layer: CoverLayer,
  mode: "move" | "resize",
  corner: ResizeCorner = "bottom-right"
) {
    event.preventDefault();
    event.stopPropagation();

    const size = getPanelPixelSize(layer.panel);

    dragStateRef.current =
      mode === "move"
        ? {
            mode,
            layerId: layer.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: layer.x,
            startY: layer.y,
            panelWidthPx: size.width,
            panelHeightPx: size.height,
          }
        : {
            mode,
            layerId: layer.id,
            corner,
            startX: layer.x,
            startY: layer.y,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startWidth: layer.width,
            startHeight: layer.height,
            startImageX: layer.type === "image" ? layer.imageX ?? 0 : 0,
            startImageY: layer.type === "image" ? layer.imageY ?? 0 : 0,
            panelWidthPx: size.width,
            panelHeightPx: size.height,
          };

    setSelectedPanel(layer.panel);
    setSelectedLayerId(layer.id);
  }

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const deltaXPercent =
        ((event.clientX - dragState.startClientX) / dragState.panelWidthPx) * 100;
      const deltaYPercent =
        ((event.clientY - dragState.startClientY) / dragState.panelHeightPx) * 100;

      if (dragState.mode === "move") {
  const draggedLayer = coverLayers.find((layer) => layer.id === dragState.layerId);
  const isImageLayer = draggedLayer?.type === "image";

  const nextXRaw = dragState.startX + deltaXPercent;
const nextYRaw = dragState.startY + deltaYPercent;

let nextX = clampNumber(nextXRaw, isImageLayer ? -50 : 0, 96);
let nextY = clampNumber(nextYRaw, isImageLayer ? -50 : 0, 96);

if (draggedLayer && draggedLayer.panel !== "spine") {
  const layerCenterX = nextX + draggedLayer.width / 2;
  const distanceFromCenter = Math.abs(layerCenterX - 50);

  if (distanceFromCenter <= 1.25) {
    nextX = 50 - draggedLayer.width / 2;
    setSnapGuide({
      panel: draggedLayer.panel,
      type: "vertical-center",
    });
  } else {
    setSnapGuide(null);
  }
}

updateLayer(dragState.layerId, {
  x: nextX,
  y: nextY,
});

  return;
}

if (dragState.mode === "crop") {
  updateLayer(dragState.layerId, {
    imageX: dragState.startX + event.clientX - dragState.startClientX,
    imageY: dragState.startY + event.clientY - dragState.startClientY,
  } as Partial<CoverLayer>);

  return;
}

if (dragState.mode === "crop-edge") {
  const minSize = 5;

  const nextUpdates: Partial<CoverImageLayer> = {};

  if (dragState.edge === "left") {
  const maxDelta = dragState.startWidth - minSize;
  const safeDelta = clampNumber(deltaXPercent, -50, maxDelta);
  const nextWidth = dragState.startWidth - safeDelta;

  nextUpdates.x = dragState.startX + safeDelta;
  nextUpdates.width = nextWidth;
  nextUpdates.imageScale =
    dragState.startImageScale * (dragState.startWidth / nextWidth);
  nextUpdates.imageX =
    dragState.startImageX - (safeDelta / 100) * dragState.panelWidthPx;
}

  if (dragState.edge === "right") {
  const nextWidth = clampNumber(
    dragState.startWidth + deltaXPercent,
    minSize,
    160
  );

  nextUpdates.width = nextWidth;
  nextUpdates.imageScale =
    dragState.startImageScale * (dragState.startWidth / nextWidth);
}

  if (dragState.edge === "top") {
    const maxDelta = dragState.startHeight - minSize;
    const safeDelta = clampNumber(deltaYPercent, -50, maxDelta);

    nextUpdates.y = dragState.startY + safeDelta;
    nextUpdates.height = dragState.startHeight - safeDelta;
    nextUpdates.imageY =
        dragState.startImageY - (safeDelta / 100) * dragState.panelHeightPx;
  }

  if (dragState.edge === "bottom") {
    nextUpdates.height = clampNumber(
      dragState.startHeight + deltaYPercent,
      minSize,
      160
    );
  }

  updateLayer(dragState.layerId, nextUpdates as Partial<CoverLayer>);
  return;
}

  const aspectRatio = dragState.startHeight / dragState.startWidth;

let scaleDelta = 0;

if (dragState.corner === "top-left") {
  scaleDelta = Math.max(-deltaXPercent, -deltaYPercent);
}

if (dragState.corner === "top-right") {
  scaleDelta = Math.max(deltaXPercent, -deltaYPercent);
}

if (dragState.corner === "bottom-left") {
  scaleDelta = Math.max(-deltaXPercent, deltaYPercent);
}

if (dragState.corner === "bottom-right") {
  scaleDelta = Math.max(deltaXPercent, deltaYPercent);
}

const nextWidth = clampNumber(
  dragState.startWidth + scaleDelta,
  5,
  160
);

const nextHeight = clampNumber(
  nextWidth * aspectRatio,
  5,
  160
);

const widthScaleRatio = nextWidth / dragState.startWidth;
const heightScaleRatio = nextHeight / dragState.startHeight;

const nextUpdates: Partial<CoverLayer> = {
  width: nextWidth,
  height: nextHeight,
  imageX: dragState.startImageX * widthScaleRatio,
  imageY: dragState.startImageY * heightScaleRatio,
};

if (dragState.corner.includes("left")) {
  nextUpdates.x =
    dragState.startX +
    (dragState.startWidth - nextWidth);
}

if (dragState.corner.includes("top")) {
  nextUpdates.y =
    dragState.startY +
    (dragState.startHeight - nextHeight);
}

updateLayer(dragState.layerId, nextUpdates);
    }

   function handleMouseUp() {
  dragStateRef.current = null;
  setSnapGuide(null);
}

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  function renderTextLayer(
    layer: CoverTextLayer,
    panelWidthPx: number,
    panelHeightPx: number,
    isSelected: boolean
  ) {
    if (layer.panel === "spine") {
      return (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${panelWidthPx} ${panelHeightPx}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <text
            x={panelWidthPx / 2}
            y={panelHeightPx / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(90 ${panelWidthPx / 2} ${panelHeightPx / 2})`}
            style={{
              fill: layer.color,
              fontFamily: layer.fontFamily === "Georgia" ? "CoverSerif" : layer.fontFamily,
              fontSize: `${layer.fontSize}px`,
              fontWeight: layer.fontWeight,
              fontStyle: layer.fontStyle,
              letterSpacing: `${layer.letterSpacing * 14}px`,
              textTransform: "uppercase",
            }}
          >
            {layer.text}
          </text>
        </svg>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          color: layer.color,
          fontFamily: layer.fontFamily === "Georgia" ? "CoverSerif" : layer.fontFamily,
          fontSize: `${layer.fontSize}px`,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          letterSpacing: `${layer.letterSpacing}em`,
          lineHeight: layer.lineHeight,
          textAlign: layer.textAlign,
          display: "flex",
          alignItems: "flex-start",
          justifyContent:
            layer.textAlign === "center"
              ? "center"
              : layer.textAlign === "right"
              ? "flex-end"
              : "flex-start",
          overflow: "hidden",
          padding: "0px",
        }}
      >
        <div className="whitespace-pre-wrap">{layer.text}</div>
      </div>
    );
  }

  function renderCoverLayer(
    layer: CoverLayer,
    panelWidthPx: number,
    panelHeightPx: number
  ) {
    const isSelected = selectedLayerId === layer.id;

    const commonStyle: CSSProperties = {
      position: "absolute",
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      width: `${Math.max(layer.width, 8)}%`,
      height: `${Math.max(layer.height, 8)}%`,
      opacity: layer.opacity,
      zIndex: layer.type === "image" ? 40 : layer.zIndex,
      cursor: "grab",
      touchAction: "none",
      border: isSelected ? "2px solid #d4af37" : "2px solid transparent",
      background: "transparent",
      borderRadius: "0px",

    };

    return (
      <div
        key={layer.id}
        onMouseDown={(event) => beginLayerDrag(event, layer, "move")}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedPanel(layer.panel);
          setSelectedLayerId(layer.id);
        }}
        style={commonStyle}
      >
        {layer.type === "text" ? (
          renderTextLayer(layer, panelWidthPx, panelHeightPx, isSelected)
        ) : (
          <img
        src={layer.src}
        alt={layer.label}
        className="block h-full w-full"
        style={{
            objectFit: layer.objectFit,
            objectPosition: "center",
            pointerEvents: "none",
            display: "block",
        }}
        onError={() => {
            console.error("Cover image failed to load:", layer.label);
        }}
        />
        )}

        {isSelected && layer.panel !== "spine" ? (
          <div
            onMouseDown={(event) => beginLayerDrag(event, layer, "resize")}
            className="absolute bottom-[-7px] right-[-7px] h-4 w-4 cursor-se-resize rounded-full border-2 border-white bg-[#d4af37] shadow"
          />
        ) : null}
      </div>
    );
  }

  function renderPanel(panel: CoverPanelKey) {
    const panelWidthPx =
      panel === "back"
        ? backCoverWidthPx + bleedPx
        : panel === "front"
        ? frontCoverWidthPx + bleedPx
        : spineWidthPx;

    const panelStyle = panelStyles[panel];

    return (
      <section
        key={panel}
        className="relative h-full overflow-hidden"
        style={{
          width: `${panelWidthPx}px`,
          height: `${wrapHeightPx}px`,
          backgroundColor: fullWrapBackgroundImage
        ? "transparent"
        : panelStyle.backgroundColor,
          borderLeft: panel === "spine" ? "1px solid rgba(0,0,0,0.16)" : undefined,
          borderRight: panel === "spine" ? "1px solid rgba(0,0,0,0.16)" : undefined,
        }}
        onClick={() => {
          setSelectedPanel(panel);
          setSelectedLayerId(null);
        }}
      >
        {panelStyle.backgroundImage ? (
          <img
            src={panelStyle.backgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full"
            style={{
              objectFit: panelStyle.backgroundFit,
              transform: `translate(${panelStyle.backgroundX}px, ${panelStyle.backgroundY}px) scale(${
                panelStyle.backgroundScale / 100
              })`,
              transformOrigin: "center",
              zIndex: 1,
            }}
          />
        ) : null}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 2,
            background:
              panel === "spine"
                ? "linear-gradient(to right, rgba(0,0,0,0.14), rgba(255,255,255,0.16), rgba(0,0,0,0.14))"
                : "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(0,0,0,0.03))",
          }}
        />

        <div className="absolute inset-0" style={{ zIndex: 10 }}>
  {getPanelLayers(panel)
    .filter((layer) => layer.type !== "image")
    .map((layer) => renderCoverLayer(layer, panelWidthPx, wrapHeightPx))}
</div>

        {panel === "back" ? (
  <div
    className="pointer-events-none absolute z-[70] flex items-center justify-center"
    style={{
      right: `${safeMarginPx + 4}px`,
      bottom: `${bleedPx + safeMarginPx + 4}px`,
      width: viewportWidth < 768 ? "72px" : "108px",
      height: viewportWidth < 768 ? "38px" : "58px",
      background: "transparent",
      border: "none",
      borderRadius: "0px",
      boxShadow: "none",
      padding: "0px",
    }}
  >
    <img
      src="/barcode-placeholder.svg"
      alt="ISBN barcode placeholder"
      className="h-full w-full object-contain"
    />
  </div>
) : null}
      </section>
    );
  }

  function buildKindleLayersFromPaperback() {
  return paperbackLayers
    .filter((layer) => layer.panel === "front")
    .map((layer) => ({
      ...layer,
      panel: "front" as CoverPanelKey,
    }));
}

  function renderKindlePreview() {
  return (
    <div className="mt-8 flex justify-center rounded-[1.5rem] bg-black/10 p-4 sm:p-6">
      <div
        className="relative rounded-[20px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.28)]"
        style={{
          width: `${frontCoverWidthPx + bleedPx}px`,
          height: `${wrapHeightPx}px`,
          overflow: "hidden",
        }}
      >
        <section
          className="relative h-full w-full overflow-hidden"
          style={{
            backgroundColor: fullWrapBackgroundImage
              ? "transparent"
              : panelStyles.front.backgroundColor,
          }}
          onClick={() => setSelectedLayerId(null)}
        >
          {fullWrapBackgroundImage ? (
            <img
              src={fullWrapBackgroundImage}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{
                objectFit: fullWrapImageFitMode,
                objectPosition: "center",
                transform: fullWrapImageTransform,
                transformOrigin: "center",
                zIndex: 1,
              }}
            />
          ) : null}

          {!fullWrapBackgroundImage && panelStyles.front.backgroundImage ? (
            <img
              src={panelStyles.front.backgroundImage}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{
                objectFit: panelStyles.front.backgroundFit,
                transform: `translate(${panelStyles.front.backgroundX}px, ${panelStyles.front.backgroundY}px) scale(${
                  panelStyles.front.backgroundScale / 100
                })`,
                transformOrigin: "center",
                zIndex: 1,
              }}
            />
          ) : null}

          <div
            className="absolute inset-0"
            style={{
              zIndex: 2,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(0,0,0,0.03))",
            }}
          />

          {renderArtworkOverlays()}
          {renderCoreTextOverlays()}
          {renderSnapGuide()}
        </section>
      </div>
    </div>
  );
}

  function renderSnapGuide() {
  if (!snapGuide) return null;

  const panelRect = getPanelRect(snapGuide.panel);

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${panelRect.left + panelRect.width / 2}px`,
        top: `${panelRect.top}px`,
        height: `${panelRect.height}px`,
        width: "0px",
        borderLeft: "3px solid #2563eb",
        zIndex: 10,
        boxShadow: "0 0 12px rgba(37,99,235,0.55)",
      }}
    />
  );
}

  function renderGuides() {
    if (!showGuides) return null;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", inset: 0, border: "2px solid #dc2626" }} />

        <div
          style={{
            position: "absolute",
            left: `${bleedPx}px`,
            right: `${bleedPx}px`,
            top: `${bleedPx}px`,
            bottom: `${bleedPx}px`,
            border: "2px dashed #f97316",
            background: "rgba(249,115,22,0.05)",
          }}
        />


        <div
          style={{
            position: "absolute",
            left: `${spineLeftPx}px`,
            top: 0,
            width: `${spineWidthPx}px`,
            height: "100%",
            borderLeft: "4px dashed #2563eb",
            borderRight: "4px dashed #2563eb",
            background: "rgba(37,99,235,0.08)",
          }}
        />
      </div>
    );
  }

  function renderLayerControls() {
    if (!selectedLayer) {
      return (
        <div className="rounded-[1.5rem] border border-black/10 bg-[#faf8f3] p-4 text-sm font-bold leading-6 text-black/55">
          Tap a text layer or image in the preview to edit it. Drag layers directly on the cover.
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-[1.5rem] border border-[#d4af37]/40 bg-[#fff8df] p-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#7a5a16]">
            Selected Layer
          </div>
          <div className="mt-1 text-lg font-black">{selectedLayer.label}</div>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
            Opacity
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={selectedLayer.opacity}
            onChange={(event) =>
              updateLayer(selectedLayer.id, { opacity: Number(event.target.value) })
            }
            className="mt-2 w-full accent-[#d4af37]"
          />
        </label>

        {selectedLayer.type === "text" ? (
          <>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
                Text
              </span>
              <textarea
                value={selectedLayer.text}
                onChange={(event) =>
                  updateTextLayer(selectedLayer.id, { text: event.target.value })
                }
                className="mt-1 min-h-[90px] w-full rounded-xl border border-black/10 bg-white p-3 text-sm font-bold leading-6"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
                Font
              </span>
              <select
                value={selectedLayer.fontFamily}
                onChange={(event) =>
                  updateTextLayer(selectedLayer.id, { fontFamily: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
  <button
    type="button"
    onClick={() =>
      updateTextLayer(selectedLayer.id, {
        fontWeight: selectedLayer.fontWeight >= 700 ? 400 : 900,
      })
    }
    className={`rounded-xl border px-3 py-2 text-xs font-black ${
      selectedLayer.fontWeight >= 700
        ? "border-[#d4af37] bg-white"
        : "border-black/10 bg-white/50"
    }`}
  >
    Bold
  </button>

  <button
    type="button"
    onClick={() =>
      updateTextLayer(selectedLayer.id, {
        fontStyle: selectedLayer.fontStyle === "italic" ? "normal" : "italic",
      })
    }
    className={`rounded-xl border px-3 py-2 text-xs font-black italic ${
      selectedLayer.fontStyle === "italic"
        ? "border-[#d4af37] bg-white"
        : "border-black/10 bg-white/50"
    }`}
  >
    Italic
  </button>
</div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
                  Font Size
                </span>
                <input
                  type="number"
                  value={selectedLayer.fontSize}
                  onChange={(event) =>
                    updateTextLayer(selectedLayer.id, {
                      fontSize: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
                  Font Color
                </span>
                <input
                  type="color"
                  value={selectedLayer.color}
                  onChange={(event) =>
                    updateTextLayer(selectedLayer.id, { color: event.target.value })
                  }
                  className="mt-1 h-[39px] w-full rounded-xl border border-black/10 bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["left", "center", "right"] as CoverTextAlign[]).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => updateTextLayer(selectedLayer.id, { textAlign: align })}
                  className={`rounded-xl border px-3 py-2 text-xs font-black capitalize ${
                    selectedLayer.textAlign === align
                      ? "border-[#d4af37] bg-white"
                      : "border-black/10 bg-white/50"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>

            
          </>
       ) : (
  <>

        <label className="block">
  <span className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
    Artwork Location
  </span>

  <select
    value={selectedLayer.panel}
    onChange={(event) =>
  updateLayer(selectedLayer.id, {
    panel: event.target.value as CoverPanelKey,
  } as Partial<CoverLayer>)
}
    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold"
  >
    <option value="front">Front Cover</option>
    <option value="back">Back Cover</option>
    <option value="spine">Spine</option>
  </select>
</label>

    <div className="space-y-3 rounded-2xl border border-black/10 bg-white/70 p-3">
  <div className="text-xs font-black uppercase tracking-[0.12em] text-black/40">
    Crop Image
  </div>

  <button
    type="button"
    onClick={() =>
      setCropLayerId(cropLayerId === selectedLayer.id ? null : selectedLayer.id)
    }
    className={`w-full rounded-xl border px-3 py-2 text-xs font-black ${
      cropLayerId === selectedLayer.id
        ? "border-[#d4af37] bg-[#fff8df]"
        : "border-black/10 bg-white"
    }`}
  >
    {cropLayerId === selectedLayer.id ? "Done Cropping" : "Crop Image"}
  </button>

  <button
    type="button"
    onClick={() =>
      updateLayer(selectedLayer.id, {
        imageX: 0,
        imageY: 0,
        imageScale: 100,
      } as Partial<CoverLayer>)
    }
    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black"
  >
    Reset Crop
  </button>
</div>
  </>
)}

        {selectedLayer.type === "image" ? (
          <button
            type="button"
            onClick={() => deleteLayer(selectedLayer.id)}
            className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:-translate-y-0.5"
          >
            Delete Selected Image
          </button>
        ) : null}
      </div>
    );
  }

  function beginLayerEditorDrag(event: ReactMouseEvent<HTMLDivElement>) {
  setIsDraggingLayerEditor(true);

  layerEditorDragOffsetRef.current = {
    x: event.clientX - layerEditorPosition.x,
    y: event.clientY - layerEditorPosition.y,
  };
}

  function renderFloatingLayerEditor() {
  if (!selectedLayer) return null;

  return (
    <div
  onMouseDown={(event) => event.stopPropagation()}
  style={{
        position: "fixed",
        left: `${layerEditorPosition.x}px`,
        top: `${layerEditorPosition.y}px`,
        zIndex: 999999,
        width: "380px",
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: "28px",
        padding: "16px",
        boxShadow: "0 28px 80px rgba(0,0,0,0.32)",
      }}
    >
      <div
        onMouseDown={beginLayerEditorDrag}
        className="mb-3 flex cursor-move items-center justify-between gap-3"
        >
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#b38b16]">
            Layer Editor
          </div>
          <div className="mt-1 text-lg font-black">{selectedLayer.label}</div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedLayerId(null)}
          className="rounded-full bg-black px-3 py-2 text-xs font-black text-[#d4af37]"
        >
          Close
        </button>
      </div>

      {renderLayerControls()}
    </div>
  );
}


  function handleRendererLayerMouseDown(
    event: ReactMouseEvent<HTMLDivElement>,
    layer: CoverLayer,
    mode: "move" | "resize" = "move",
    corner: ResizeCorner = "bottom-right"
  ) {
    beginLayerDrag(event, layer, mode, corner);
  }

  function handleRendererLayerClick(
    event: ReactMouseEvent<HTMLDivElement>,
    layer: CoverLayer
  ) {
    event.stopPropagation();
    setSelectedPanel(layer.panel);
    setSelectedLayerId(layer.id);
  }

  function handleRendererImageCropMouseDown(
    event: ReactMouseEvent<HTMLImageElement>,
    layer: CoverImageLayer
  ) {
    beginImageCropDrag(event, layer);
  }

  return (
   <div
  onMouseDown={() => setSelectedLayerId(null)}
  className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-8 sm:px-8"
>
      <aside className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5 sm:p-6">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-[#b38b16]">
          Step 8 of 9
        </div>

        <h2 className="mt-2 text-4xl font-black">
          Cover Creator
        </h2>

<p className="mt-3 text-sm leading-6 text-black/55">
  Design your paperback cover first. We’ll help adapt it into hardcover and Kindle versions.
</p>

<div className="mt-7 space-y-3">
  {[
  {
    key: "paperback",
    title: "Paperback Cover",
    description: "Main full wrap design",
  },
  {
    key: "hardcover",
    title: "Hardcover Cover",
    description: "Adapt from paperback",
  },
  {
    key: "kindle",
    title: "Kindle Cover",
    description: "Front cover ebook image",
  },
].map((asset) => (
    <button
      key={asset.key}
      type="button"
      onClick={() => {
  if (asset.key === "kindle" && kindleLayers.length === 0) {
  setKindleLayers(buildKindleLayersFromPaperback());
}

if (asset.key === "hardcover" && hardcoverLayers.length === 0) {
  setHardcoverLayers(paperbackLayers);
}

setCoverAssetMode(asset.key as "paperback" | "hardcover" | "kindle");

if (asset.key === "paperback" || asset.key === "hardcover") {
  setCoverFormat(asset.key as CoverFormat);
}

markUnsaved();
}}
      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
        coverAssetMode === asset.key
          ? "border-[#d4af37] bg-[#fff6d8]"
          : "border-black/10 bg-[#faf8f3] text-black/70"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black">{asset.title}</div>
          <div className="mt-1 text-xs font-bold text-black/45">
            {asset.description}
          </div>
        </div>

      </div>
    </button>
  ))}
  {coverAssetMode === "hardcover" ? (
  <button
  type="button"
  onClick={scrollToLivePreview}
  className="mt-4 w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm hover:bg-amber-100 transition"
>
    <p className="font-black"> ⚠️ Review Your Hardcover Cover Before Exporting.</p>
    <p className="mt-1">
      Hardcover covers use different wrap, spine, hinge, and fold areas than paperback.
      We adapt your paperback design, but you should review the live preview and adjust
      text or images before exporting.
    </p>

    {finalizedManuscriptTrimSize === "5x8" ? (
      <p className="mt-3 font-black text-red-700">
        ❌ Amazon KDP currently does not support 5 × 8 hardcover. Please select a different book size from the dropdown below.
      </p>
    ) : null}
  </button>
) : null}

{coverAssetMode === "kindle" ? (
  <button
  type="button"
  onClick={scrollToLivePreview}
  className="mt-4 w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm hover:bg-amber-100 transition"
>
    <p className="font-black"> ⚠️ Review Your Kindle Cover Before Exporting.</p>
    <p className="mt-1">
      Kindle covers use a front-cover-only layout. We adapt your paperback front cover,
      but you should review the preview and reposition or resize elements before exporting.
    </p>
  </button>
) : null}
</div>

<div className="mt-7">
  <label className="block">
    <span className="text-xs font-black uppercase tracking-[0.16em] text-black/40">
      Book Size
    </span>
   <select
  value={hardcoverRequiresManualTrimSize ? hardcoverTrimSizeOverride : trimSize}
  disabled={projectData.hasFinalizedManuscript && !hardcoverRequiresManualTrimSize}
  onChange={(event) => {
    if (hardcoverRequiresManualTrimSize) {
      setHardcoverTrimSizeOverride(event.target.value as CoverTrimSizeKey);
      markUnsaved();
      return;
    }

    if (projectData.hasFinalizedManuscript) return;

    setTrimSize(event.target.value as CoverTrimSizeKey);
    markUnsaved();
  }}
  className="mt-3 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-4 text-sm font-bold outline-none focus:border-[#d4af37] disabled:cursor-not-allowed disabled:opacity-60"
>
  {hardcoverRequiresManualTrimSize ? (
    <>
      <option value="">Select hardcover size</option>
      <option value="5.5x8.5">5.5 x 8.5</option>
      <option value="6x9">6 x 9</option>
    </>
  ) : (
    getCoverTrimSizeOptions().map((option) => (
      <option key={option.key} value={option.key}>
        {option.label}
      </option>
    ))
  )}
</select>

{hardcoverRequiresManualTrimSize ? (
  <p className="mt-2 text-xs font-bold leading-5 text-red-700">
    Select a supported hardcover size before exporting.
  </p>
) : projectData.hasFinalizedManuscript ? (
  <p className="mt-2 text-xs font-bold leading-5 text-black/45">
    Locked from finalized manuscript to prevent cover/manuscript size mismatch.
  </p>
) : (
  <p className="mt-2 text-xs font-bold leading-5 text-orange-700">
    Finalize your manuscript first to lock the official trim size.
  </p>
)}
  </label>
</div>

<div className="mt-7 rounded-[1.5rem] border border-[#d4af37]/30 bg-[#fff8df] p-5">
  <div className="text-xs font-black uppercase tracking-[0.16em] text-[#7a5a16]">
    {coverAssetMode === "kindle" ? "Kindle Cover Image" : "Calculated Cover Wrap"}
  </div>

  {coverAssetMode === "kindle" ? (
    <div className="mt-4 space-y-3 text-sm leading-6 text-black/70">
      <div className="flex justify-between gap-4">
        <span>Cover type</span>
        <strong>Front only</strong>
      </div>

      <div className="flex justify-between gap-4">
        <span>Recommended ratio</span>
        <strong>1.6:1</strong>
      </div>

      <div className="flex justify-between gap-4">
        <span>Export target</span>
        <strong>2560 × 1600 px</strong>
      </div>
    </div>
  ) : (
    <div className="mt-4 space-y-3 text-sm leading-6 text-black/70">
      <div className="flex justify-between gap-4">
        <span>Full wrap</span>
        <strong>
          {formatInches(layout.fullWrapWidthIn)} x {formatInches(layout.fullWrapHeightIn)}
        </strong>
      </div>

      <div className="flex justify-between gap-4">
        <span>Spine</span>
        <strong>{formatInches(layout.spineWidthIn)}</strong>
      </div>

      <div className="flex justify-between gap-4">
        <span>Bleed</span>
        <strong>{formatInches(layout.bleedIn)}</strong>
      </div>
    </div>
  )}
</div>

{coverAssetMode !== "kindle" && layout.spineWarning ? (
  <div className="mt-5 rounded-[1.5rem] border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
    {layout.spineWarning}
  </div>
) : null}
      </aside>

     <main
  ref={livePreviewRef}
  className="min-w-0 rounded-[2rem] border border-black/10 ..."
>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.24em] text-[#7a5a16]">
            Live Cover Wrap Preview
          </div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            {coverAssetMode === "kindle"
  ? "Kindle Cover"
  : "Back Cover, Spine, Front Cover"}
          </h2>

              <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
  <button
    type="button"
    onClick={() => setShowLayersPanel((current) => !current)}
    className="flex w-full items-center justify-between text-left"
  >
    <div>
      <div className="text-xs font-black uppercase tracking-[0.16em] text-black/40">
        Layers
      </div>
      <div className="mt-1 text-sm font-bold text-black/55">
        {visibleCoverLayers.length} layers
      </div>
    </div>

    <span className="text-lg font-black">
      {showLayersPanel ? "⌃" : "⌄"}
    </span>
  </button>

  {showLayersPanel ? (
    <div className="mt-3 space-y-2">
      {visibleCoverLayers
        .slice()
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
              selectedLayerId === layer.id
                ? "border-[#d4af37] bg-[#fff8df]"
                : "border-black/10 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedPanel(layer.panel);
                setSelectedLayerId(layer.id);
              }}
              className="flex-1 text-left"
            >
              <div className="text-sm font-black">{layer.label}</div>
              <div className="text-xs font-bold text-black/45 capitalize">
                {layer.panel}
              </div>
            </button>

            <div className="ml-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateLayer(layer.id, { zIndex: layer.zIndex + 1 })
                }
                className="rounded-lg border border-black/10 px-2 py-1 text-xs font-black"
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() =>
                  updateLayer(layer.id, {
                    zIndex: Math.max(1, layer.zIndex - 1),
                  })
                }
                className="rounded-lg border border-black/10 px-2 py-1 text-xs font-black"
              >
                ↓
              </button>

              {layer.type === "image" ? (
                <button
                  type="button"
                  onClick={() => deleteLayer(layer.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-black text-red-700"
                >
                  🗑
                </button>
              ) : null}
            </div>
          </div>
        ))}
    </div>
  ) : null}
</div>
          
        </div>

{coverAssetMode === "kindle" ? (
  renderKindlePreview()
) : (
  <div
    className="mt-8 rounded-[1.5rem] bg-black/10 p-4 sm:p-6"
    style={{
      overflowX: "auto",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}
  >
    <div
      className="relative mx-auto rounded-[28px] bg-[#151326] p-[10px] shadow-[0_35px_90px_rgba(0,0,0,0.32)]"
      style={{
        width: `${visualWrapWidthPx + 20}px`,
        minWidth: `${visualWrapWidthPx + 20}px`,
      }}
    >
      <CoverRenderer
        layers={coverLayers}
        panelStyles={panelStyles}
        fullWrapBackgroundImage={fullWrapBackgroundImage}
        fullWrapImageScale={fullWrapImageScale}
        fullWrapImageX={fullWrapImageX}
        fullWrapImageY={fullWrapImageY}
        fullWrapImageFitMode={fullWrapImageFitMode}
        visualWrapWidthPx={visualWrapWidthPx}
        wrapHeightPx={wrapHeightPx}
        bleedPx={bleedPx}
        safeMarginPx={safeMarginPx}
        backCoverWidthPx={backCoverWidthPx}
        frontCoverWidthPx={frontCoverWidthPx}
        spineWidthPx={spineWidthPx}
        spineLeftPx={spineLeftPx}
        frontTrimLeftPx={frontTrimLeftPx}
        previewScale={previewScale}
        showGuides={showGuides}
        snapGuide={snapGuide}
        selectedLayerId={selectedLayerId}
        cropLayerId={cropLayerId}
        interactive={true}
        onLayerMouseDown={handleRendererLayerMouseDown}
        onLayerClick={handleRendererLayerClick}
        onImageCropMouseDown={handleRendererImageCropMouseDown}
        mode="editor"
      />
    </div>
  </div>
)}

        {showGuides ? (
  <div className="mt-4 grid gap-2 rounded-2xl bg-white/85 p-4 text-xs font-black uppercase tracking-[0.12em] text-black/60 sm:grid-cols-4">
    <div className="flex items-center gap-2">
      <span
        style={{
          width: 32,
          height: 10,
          borderRadius: 999,
          backgroundColor: "#dc2626",
          display: "inline-block",
        }}
      />
      Full Bleed Edge
    </div>

    <div className="flex items-center gap-2">
      <span
        style={{
          width: 32,
          height: 10,
          borderRadius: 999,
          backgroundColor: "#f97316",
          display: "inline-block",
        }}
      />
      Trim Line
    </div>

    <div className="flex items-center gap-2">
      <span
        style={{
          width: 32,
          height: 10,
          borderRadius: 999,
          backgroundColor: "#2563eb",
          display: "inline-block",
        }}
      />
      Spine Edges
    </div>

    {coverAssetMode === "hardcover" ? (
      <div className="flex items-center gap-2">
        <span
          style={{
            width: 32,
            height: 10,
            borderRadius: 999,
            borderTop: "3px dotted #a855f7",
            display: "inline-block",
          }}
        />
        Hinge / Crease
      </div>
    ) : null}
  </div>
) : null}

      </main>

      <div className="mt-4 rounded-[1.5rem] border border-black/10 bg-white p-4">
  <label className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={showGuides}
      onChange={(event) => {
        setShowGuides(event.target.checked);
        markUnsaved();
      }}
      className="mt-1 h-4 w-4"
    />

    <div>
      <div className="text-sm font-black text-black">
        Show cover guide lines
      </div>

      <div className="mt-1 text-xs font-medium leading-5 text-black/55">
        Display bleed, trim, safe area, spine, and hardcover crease guides on the preview.
      </div>
    </div>
  </label>

  
</div>

      <aside className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5 sm:p-6 xl:max-h-[calc(100vh-48px)] xl:overflow-y-auto">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-[#b38b16]">Design Tools</div>
        <h2 className="mt-2 text-2xl font-black">Artwork and Text</h2>

        <div className="mt-7 space-y-7">
          <section>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-black/45">Selected Panel</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PANEL_CONTROL_ORDER.map((panel) => (
                <button
                  key={panel}
                  type="button"
                  onClick={() => {
                    setSelectedPanel(panel);
                    setSelectedLayerId(null);
                  }}
                  className={`rounded-2xl border px-3 py-3 text-xs font-black capitalize transition hover:-translate-y-0.5 ${
                    selectedPanel === panel
                      ? "border-[#d4af37] bg-[#fff6d8]"
                      : "border-black/10 bg-[#faf8f3] text-black/55"
                  }`}
                >
                  {panel}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Panel Background Color</span>
              <input
                type="color"
                value={panelStyles[selectedPanel].backgroundColor}
                onChange={(event) =>
                  updatePanelStyle(selectedPanel, { backgroundColor: event.target.value })
                }
                className="mt-2 h-[46px] w-full rounded-2xl border border-black/10 bg-[#faf8f3]"
              />
            </label>
          </section>

          <div className="rounded-[1.5rem] border border-black/10 bg-[#faf8f3] p-4 text-sm font-bold leading-6 text-black/55">
          Click any text or image on the cover to open its editor.
          </div>

          <section className="border-t border-black/10 pt-6">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-black/45">Add Artwork</h3>

            <label className="mt-3 block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Artwork Target</span>
              <select
                value={artworkTarget}
                onChange={(event) => setArtworkTarget(event.target.value as ArtworkTarget)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d4af37]"
              >
                {TARGET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingArtwork(true);
              }}
              onDragLeave={() => setIsDraggingArtwork(false)}
              onDrop={handleArtworkDrop}
              className={`mt-3 block cursor-pointer rounded-2xl border border-dashed p-5 text-center transition hover:-translate-y-0.5 ${
                isDraggingArtwork
                  ? "border-[#b38b16] bg-[#fff2b8] shadow-lg shadow-[#d4af37]/20"
                  : "border-[#d4af37]/60 bg-[#fff8df]"
              }`}
            >
              <span className="text-sm font-black text-black">Upload or Drag Cover Artwork</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-black/50">
                Choose whether it becomes a background or a moveable layer.
              </span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {backgroundSourceLabel ? (
              <div className="mt-3 rounded-2xl bg-[#faf8f3] p-4">
                <div className="text-xs font-bold leading-5 text-black/55">
                  Current artwork action: {backgroundSourceLabel}
                </div>
                <button
                  type="button"
                  onClick={removeBackgroundArtwork}
                  className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:-translate-y-0.5"
                >
                  Remove Background Artwork
                </button>
              </div>
            ) : null}
          </section>

          <section className="border-t border-black/10 pt-6">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-black/45">AI Cover Artwork Generator</h3>
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Example: A dramatic golden sunrise over a quiet mountain path, cinematic lighting, premium nonfiction book cover style, open space for title text."
              className="mt-3 min-h-[120px] w-full rounded-2xl border border-black/10 bg-[#faf8f3] p-4 text-sm font-semibold leading-6 outline-none focus:border-[#d4af37]"
            />
            <button
              type="button"
              onClick={generateAIBackground}
              disabled={isGeneratingImage || !aiPrompt.trim()}
              className="mt-3 w-full rounded-2xl bg-black px-5 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
            {isGeneratingImage ? (
            <span>
                Generating Artwork
                <span className="inline-block w-[24px] text-left">
                {".".repeat(generationDots)}
                </span>
            </span>
            ) : (
            "Generate AI Artwork"
            )}         
            </button>
            {isGeneratingImage ? (
              <div className="mt-3 rounded-2xl border border-[#d4af37]/30 bg-[#fff8df] p-4 text-sm font-bold leading-6 text-[#7a5a16]">
                Creating your cover background. This may take 20 to 60 seconds. Please keep this page open.
              </div>
            ) : null}
            {generationStatus && !isGeneratingImage ? (
              <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold leading-6 text-green-700">{generationStatus}</div>
            ) : null}
            {generationError ? (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">{generationError}</div>
            ) : null}
          </section>

          <section className="border-t border-black/10 pt-6">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-black/45">Core Cover Text</h3>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Title</span>
                <input value={title} onChange={(event) => updateTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d4af37]" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Subtitle</span>
                <input value={subtitle} onChange={(event) => updateSubtitle(event.target.value)} placeholder="Optional subtitle" className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d4af37]" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Author Name</span>
                <input value={authorName} onChange={(event) => updateAuthorName(event.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d4af37]" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Spine Title</span>
                <input value={spineTitle} onChange={(event) => updateSpineTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d4af37]" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Spine Author</span>
                <input value={spineAuthor} onChange={(event) => updateSpineAuthor(event.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3 text-sm font-bold outline-none focus:border-[#d4af37]" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-black/40">Back Cover Description</span>
                <textarea value={backCoverText} onChange={(event) => updateBackCoverText(event.target.value)} className="mt-2 min-h-[140px] w-full rounded-2xl border border-black/10 bg-[#faf8f3] p-4 text-sm font-semibold leading-6 outline-none focus:border-[#d4af37]" />
              </label>
            </div>
          </section>

          <section className="border-t border-black/10 pt-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
    <button
  type="button"
  onClick={saveCoverSettings}
  disabled={isSavingCover}
  className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-black text-[#d4af37] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isSavingCover ? "Saving..." : "Save Cover Settings"}
</button>

    <button
      type="button"
      onClick={exportPaperbackCover}
      disabled={isExportingCover}
      className="rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#e6c24a] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isExportingCover ? "Exporting Print Cover..." : "Export Print Cover PDF"}
    </button>

    <button
      type="button"
      onClick={exportKindleCover}
      disabled={isExportingKindleCover}
      className="rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isExportingKindleCover
        ? "Exporting Kindle Cover..."
        : "Export Kindle Cover JPG"}
    </button>
  </div>

  {saveMessage ? (
    <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
      {saveMessage}
      {lastSavedAt ? (
        <span className="ml-2 text-green-600/70">
          Last saved at {lastSavedAt}
        </span>
      ) : null}
    </div>
  ) : null}
</section>
        </div>
      </aside>
      {renderFloatingLayerEditor()}
    </div>
  );
}
