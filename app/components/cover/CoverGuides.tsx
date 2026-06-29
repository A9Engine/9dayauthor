import type { CoverPanelKey } from "./TextLayers";

type SnapGuide = {
  panel: CoverPanelKey;
  type: "vertical-center";
} | null;

type PanelRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type CoverGuidesProps = {
  showGuides: boolean;
  bleedPx: number;
  spineLeftPx: number;
  spineWidthPx: number;
  snapGuide?: SnapGuide;
  panelRects: Record<CoverPanelKey, PanelRect>;
};

export default function CoverGuides({
  showGuides,
  bleedPx,
  spineLeftPx,
  spineWidthPx,
  snapGuide = null,
  panelRects,
}: CoverGuidesProps) {
  return (
    <>
      {showGuides ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid #dc2626",
            }}
          />

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
      ) : null}

      {snapGuide ? (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${
              panelRects[snapGuide.panel].left +
              panelRects[snapGuide.panel].width / 2
            }px`,
            top: `${panelRects[snapGuide.panel].top}px`,
            height: `${panelRects[snapGuide.panel].height}px`,
            width: "0px",
            borderLeft: "3px solid #2563eb",
            zIndex: 10,
            boxShadow: "0 0 12px rgba(37,99,235,0.55)",
          }}
        />
      ) : null}
    </>
  );
}