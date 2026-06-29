import type { MouseEvent as ReactMouseEvent } from "react";
import type { CoverPanelKey, PanelRect } from "./TextLayers";

export type ImageFitMode = "cover" | "contain";

export type CoverImageLayer = {
  id: string;
  panel: CoverPanelKey;
  type: "image";
  label: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  objectFit: ImageFitMode;
  imageX: number;
  imageY: number;
  imageScale: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
};

type ArtworkLayersProps = {
  layers: CoverImageLayer[];
  panelRects: Record<CoverPanelKey, PanelRect>;
  selectedLayerId?: string | null;
  cropLayerId?: string | null;
  interactive?: boolean;
  onLayerMouseDown?: (
    event: ReactMouseEvent<HTMLDivElement>,
    layer: CoverImageLayer,
    mode: "move" | "resize",
    corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  ) => void;
  onLayerClick?: (
    event: ReactMouseEvent<HTMLDivElement>,
    layer: CoverImageLayer
  ) => void;
  onImageCropMouseDown?: (
    event: ReactMouseEvent<HTMLImageElement>,
    layer: CoverImageLayer
  ) => void;
};

export default function ArtworkLayers({
  layers,
  panelRects,
  selectedLayerId = null,
  cropLayerId = null,
  interactive = false,
  onLayerMouseDown,
  onLayerClick,
  onImageCropMouseDown,
}: ArtworkLayersProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      {layers.map((layer) => {
        const panelRect = panelRects[layer.panel];

        if (!panelRect) return null;

        const isSelected = selectedLayerId === layer.id;

        const layerInteractionProps: {
          onMouseDown?: (event: ReactMouseEvent<HTMLDivElement>) => void;
          onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
        } = interactive
          ? {
              onMouseDown: (event) => {
                event.preventDefault();
                event.stopPropagation();
                onLayerMouseDown?.(event, layer, "move");
              },
              onClick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                onLayerClick?.(event, layer);
              },
            }
          : {};

        const imageCropInteractionProps: {
          onMouseDown?: (event: ReactMouseEvent<HTMLImageElement>) => void;
        } =
          interactive && cropLayerId === layer.id
            ? {
                onMouseDown: (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onImageCropMouseDown?.(event, layer);
                },
              }
            : {};

        return (
          <div
            key={layer.id}
            {...layerInteractionProps}
            style={{
              position: "absolute",
              left: `${panelRect.left + (layer.x / 100) * panelRect.width}px`,
              top: `${panelRect.top + (layer.y / 100) * panelRect.height}px`,
              width: `${(layer.width / 100) * panelRect.width}px`,
              height: `${(layer.height / 100) * panelRect.height}px`,
              opacity: layer.opacity,
              zIndex: Number(layer.zIndex || 20) + 60,
              cursor: interactive ? "grab" : "default",
              touchAction: "none",
              overflow: "hidden",
              pointerEvents: interactive ? "auto" : "none",
              border: isSelected
                ? "2px solid #d4af37"
                : "2px solid transparent",
              boxShadow: isSelected
                ? "0 0 0 4px rgba(212,175,55,0.22)"
                : "none",
            }}
          >
            <img
              src={layer.src}
              alt={layer.label}
              {...imageCropInteractionProps}
              style={{
                position: "absolute",
                left: "0px",
                top: "0px",
                width: `${layer.imageScale ?? 100}%`,
                height: "auto",
                maxWidth: "none",
                maxHeight: "none",
                display: "block",
                pointerEvents:
                  interactive && cropLayerId === layer.id ? "auto" : "none",
                cursor:
                  interactive && cropLayerId === layer.id ? "move" : "inherit",
                filter: "none",
                transform: `translate(${layer.imageX ?? 0}px, ${
                  layer.imageY ?? 0
                }px)`,
                transformOrigin: "top left",
              }}
            />

            {interactive && isSelected ? (
              <>
                {(
                  [
                    ["top-left", "nw-resize", { left: "-10px", top: "-10px" }],
                    [
                      "top-right",
                      "ne-resize",
                      { right: "-10px", top: "-10px" },
                    ],
                    [
                      "bottom-left",
                      "sw-resize",
                      { left: "-10px", bottom: "-10px" },
                    ],
                    [
                      "bottom-right",
                      "se-resize",
                      { right: "-10px", bottom: "-10px" },
                    ],
                  ] as const
                ).map(([corner, cursor, position]) => (
                  <div
                    key={corner}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onLayerMouseDown?.(event, layer, "resize", corner);
                    }}
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
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}