import ArtworkLayers, {
  type CoverImageLayer,
} from "./ArtworkLayers";
import CoverGuides from "./CoverGuides";
import TextLayers, {
  type CoverPanelKey,
  type CoverTextLayer,
  type PanelRect,
} from "./TextLayers";

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

export type CoverLayer = CoverTextLayer | CoverImageLayer;

type CoverRendererProps = {
  layers: CoverLayer[];
  panelStyles: CoverPanelStyles;
  fullWrapBackgroundImage: string;
  fullWrapImageScale: number;
  fullWrapImageX: number;
  fullWrapImageY: number;
  fullWrapImageFitMode: ImageFitMode;
  visualWrapWidthPx: number;
  wrapHeightPx: number;
  bleedPx: number;
  safeMarginPx: number;
  backCoverWidthPx: number;
  frontCoverWidthPx: number;
  spineWidthPx: number;
  spineLeftPx: number;
  frontTrimLeftPx: number;
  previewScale: number;
  showGuides?: boolean;
  snapGuide?: {
    panel: CoverPanelKey;
    type: "vertical-center";
  } | null;
  selectedLayerId?: string | null;
  cropLayerId?: string | null;
  interactive?: boolean;
  onLayerMouseDown?: any;
  onLayerClick?: any;
  onImageCropMouseDown?: any;
  mode?: "editor" | "export";
};

const PHYSICAL_WRAP_ORDER: CoverPanelKey[] = ["back", "spine", "front"];

export default function CoverRenderer({
  layers,
  panelStyles,
  fullWrapBackgroundImage,
  fullWrapImageScale,
  fullWrapImageX,
  fullWrapImageY,
  fullWrapImageFitMode,
  visualWrapWidthPx,
  wrapHeightPx,
  bleedPx,
  safeMarginPx,
  backCoverWidthPx,
  frontCoverWidthPx,
  spineWidthPx,
  spineLeftPx,
  frontTrimLeftPx,
  previewScale,
  showGuides = false,
  snapGuide = null,
  selectedLayerId = null,
  cropLayerId = null,
  interactive = false,
  onLayerMouseDown,
  onLayerClick,
  onImageCropMouseDown,
  mode,
}: CoverRendererProps) {
  const effectiveMode = mode ?? (interactive ? "editor" : "export");
  const isExport = effectiveMode === "export";

  const panelRects: Record<CoverPanelKey, PanelRect> = {
    back: {
      left: 0,
      top: 0,
      width: backCoverWidthPx + bleedPx,
      height: wrapHeightPx,
    },
    spine: {
      left: spineLeftPx,
      top: 0,
      width: spineWidthPx,
      height: wrapHeightPx,
    },
    front: {
      left: frontTrimLeftPx - safeMarginPx,
      top: 0,
      width: frontCoverWidthPx + bleedPx,
      height: wrapHeightPx,
    },
  };

  const textLayers = layers.filter(
    (layer): layer is CoverTextLayer => layer.type === "text"
  );

  const imageLayers = layers.filter(
    (layer): layer is CoverImageLayer => layer.type === "image"
  );

  const fullWrapImageTransform = `translate(${fullWrapImageX}px, ${fullWrapImageY}px) scale(${
    fullWrapImageScale / 100
  })`;

  const approximateBleedIn = previewScale > 0 ? bleedPx / previewScale : 0;
  const shouldShowHardcoverHingeGuides =
    !isExport && showGuides && approximateBleedIn > 0.5;

  const hardcoverHingeOffsetPx = 0.4 * previewScale;
  const backHingeLineX = spineLeftPx - hardcoverHingeOffsetPx;
  const frontHingeLineX = spineLeftPx + spineWidthPx + hardcoverHingeOffsetPx;

  return (
    <div
      className={
        isExport
          ? "relative overflow-hidden bg-white"
          : "relative overflow-hidden rounded-[20px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18),inset_18px_0_24px_rgba(0,0,0,0.08),inset_-18px_0_24px_rgba(0,0,0,0.08)]"
      }
      style={{
        width: `${visualWrapWidthPx}px`,
        height: `${wrapHeightPx}px`,
      }}
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
      ) : (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background:
              "radial-gradient(circle at center, #fffdf7 0%, #f2ead8 42%, #d8cdb7 100%)",
          }}
        />
      )}

      <div
        className="absolute left-0 top-0 flex"
        style={{
          zIndex: 20,
          width: `${visualWrapWidthPx}px`,
          height: `${wrapHeightPx}px`,
        }}
      >
        {PHYSICAL_WRAP_ORDER.map((panel) => {
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
                borderLeft:
                  !isExport && panel === "spine"
                    ? "1px solid rgba(0,0,0,0.16)"
                    : undefined,
                borderRight:
                  !isExport && panel === "spine"
                    ? "1px solid rgba(0,0,0,0.16)"
                    : undefined,
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

              {!isExport ? (
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
              ) : null}

              {panel === "back" && !isExport ? (
                <div
                  className="pointer-events-none absolute z-[70] flex items-center justify-center"
                  style={{
                    right: `${safeMarginPx + 4}px`,
                    bottom: `${bleedPx + safeMarginPx + 4}px`,
                    width: "108px",
                    height: "58px",
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
        })}
      </div>

      <ArtworkLayers
        layers={imageLayers}
        panelRects={panelRects}
        selectedLayerId={selectedLayerId}
        cropLayerId={cropLayerId}
        interactive={interactive}
        onLayerMouseDown={onLayerMouseDown}
        onLayerClick={onLayerClick}
        onImageCropMouseDown={onImageCropMouseDown}
      />

      <TextLayers
        layers={textLayers}
        panelRects={panelRects}
        wrapHeightPx={wrapHeightPx}
        previewScale={previewScale}
        selectedLayerId={selectedLayerId}
        interactive={interactive}
        onLayerMouseDown={onLayerMouseDown}
        onLayerClick={onLayerClick}
        renderMode={isExport ? "export" : "editor"}
      />

      {!isExport ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 30,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.06), transparent 8%, transparent 42%, rgba(0,0,0,0.12) 49%, rgba(255,255,255,0.16) 50%, rgba(0,0,0,0.12) 51%, transparent 58%, transparent 92%, rgba(0,0,0,0.06))",
          }}
        />
      ) : null}

      {!isExport ? (
        <CoverGuides
          showGuides={showGuides}
          bleedPx={bleedPx}
          spineLeftPx={spineLeftPx}
          spineWidthPx={spineWidthPx}
          snapGuide={snapGuide}
          panelRects={panelRects}
        />
      ) : null}

      {shouldShowHardcoverHingeGuides ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 98 }}
        >
          {[backHingeLineX, frontHingeLineX].map((x, index) => (
            <div
              key={`hardcover-hinge-guide-${index}`}
              style={{
                position: "absolute",
                left: `${x}px`,
                top: "0px",
                height: `${wrapHeightPx}px`,
                borderLeft: "3px dotted #a855f7",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.75)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}