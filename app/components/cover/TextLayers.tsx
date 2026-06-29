import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";

export type CoverPanelKey = "back" | "spine" | "front";
export type CoverTextAlign = "left" | "center" | "right";

export type CoverTextLayer = {
  id: string;
  panel: CoverPanelKey;
  type: "text";
  label: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: CoverTextAlign;
  letterSpacing: number;
  lineHeight: number;
};

export type PanelRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type TextLayersProps = {
  layers: CoverTextLayer[];
  panelRects: Record<CoverPanelKey, PanelRect>;
  wrapHeightPx: number;
  previewScale: number;
  selectedLayerId?: string | null;
  interactive?: boolean;
  onLayerMouseDown?: (
    event: ReactMouseEvent<HTMLDivElement>,
    layer: CoverTextLayer
  ) => void;
  onLayerClick?: (
    event: ReactMouseEvent<HTMLDivElement>,
    layer: CoverTextLayer
  ) => void;
  renderMode?: "editor" | "export";
};

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getCoverFontFamily(fontFamily: string) {
  return fontFamily === "Georgia" ? "CoverSerif, Georgia, serif" : fontFamily;
}

export default function TextLayers({
  layers,
  panelRects,
  wrapHeightPx,
  previewScale,
  selectedLayerId = null,
  interactive = false,
  onLayerMouseDown,
  onLayerClick,
  renderMode = "editor",
}: TextLayersProps) {
  const isExport = renderMode === "export";
  const fontScale = Math.max(0.55, Math.min(1, previewScale / 70));

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      {layers.map((layer) => {
        const panelRect = panelRects[layer.panel];
        const isSelected = selectedLayerId === layer.id;

        if (!panelRect) return null;

        const textInteractionProps: {
          onMouseDown?: (event: ReactMouseEvent<HTMLDivElement>) => void;
          onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
        } = interactive
          ? {
              onMouseDown: (event) => {
                event.preventDefault();
                event.stopPropagation();
                onLayerMouseDown?.(event, layer);
              },
              onClick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                onLayerClick?.(event, layer);
              },
            }
          : {};

        if (layer.panel === "spine" || layer.rotation !== 0) {
          const spineWidthPx = panelRect.width;
          const spineHeightPx = panelRect.height;

          return (
            <div
              key={layer.id}
              {...textInteractionProps}
              style={{
                position: "absolute",
                pointerEvents: interactive ? "auto" : "none",
                left: `${panelRect.left}px`,
                top: `${panelRect.top}px`,
                width: `${spineWidthPx}px`,
                height: `${spineHeightPx}px`,
                zIndex: Number(layer.zIndex || 20) + 100,
                cursor: interactive && !isExport ? "grab" : "default",
                outline:
                  !isExport && isSelected ? "2px solid #d4af37" : "none",
                opacity: layer.opacity,
              }}
            >
              <svg
                width={spineWidthPx}
                height={spineHeightPx}
                viewBox={`0 0 ${spineWidthPx} ${spineHeightPx}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "visible",
                  pointerEvents: "none",
                }}
              >
                <text
                  x={spineWidthPx / 2}
                  y={spineHeightPx / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${layer.rotation || 90} ${
                    spineWidthPx / 2
                  } ${spineHeightPx / 2})`}
                  style={{
                    fill: layer.color,
                    fontFamily: getCoverFontFamily(layer.fontFamily),
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
        };

        const style: CSSProperties = {
          position: "absolute",
          pointerEvents: interactive ? "auto" : "none",
          left: `${panelRect.left + (bounds.x / 100) * panelRect.width}px`,
          top: `${(bounds.y / 100) * wrapHeightPx}px`,
          width: `${(bounds.width / 100) * panelRect.width}px`,
          height: "auto",
          minHeight: "auto",
          zIndex: Number(layer.zIndex || 20) + 100,
          color: layer.color,
          fontFamily: getCoverFontFamily(layer.fontFamily),
          fontSize: `${Math.max(10, layer.fontSize * fontScale)}px`,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          letterSpacing: `${layer.letterSpacing}em`,
          lineHeight: layer.lineHeight,
          textAlign: layer.textAlign,
          opacity: layer.opacity,
          cursor: interactive && !isExport ? "grab" : "default",
          padding: isExport ? "0px" : isSelected ? "4px 6px" : "0px",
          border: isExport
            ? "none"
            : isSelected
            ? "2px solid #d4af37"
            : "2px solid transparent",
          borderRadius: isExport ? "0px" : "12px",
          textShadow: isExport
            ? "none"
            : "0 1px 2px rgba(255,255,255,0.35)",
          whiteSpace: "pre-wrap",
          background: "transparent",
          boxShadow: "none",
        };

        return (
          <div key={layer.id} {...textInteractionProps} style={style}>
            <div style={{ whiteSpace: "pre-wrap", background: "transparent" }}>
              {layer.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}