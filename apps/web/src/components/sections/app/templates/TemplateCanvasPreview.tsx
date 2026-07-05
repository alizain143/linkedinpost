"use client";

import { useCallback, useRef, useState } from "react";
import type {
  MediaTemplateLayout,
  TemplateElement,
} from "@/lib/api/types/media-template";
import { clampElement, getElementBounds } from "@/lib/template-layout-bounds";
import {
  resolveBackgroundStyle,
  resolveRectFill,
} from "@/lib/template-layout-gradient";
import { computeSnap, type SnapGuide } from "@/lib/template-layout-snap";

const GUIDE_COLOR = "#FF2D55";
const CROSSHAIR_SIZE = 12;

type Props = {
  layout: MediaTemplateLayout;
  width: number;
  height: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  scale?: number;
  profileName?: string;
  roleTitle?: string;
  currentCompany?: string;
  industry?: string;
  avatarUrl?: string | null;
  headline?: string;
  headlineHighlight?: string;
  subhead?: string;
};

function resolveText(
  el: Extract<TemplateElement, { type: "text" }>,
  profileName: string,
  roleTitle: string,
  currentCompany: string,
  industry: string,
): string {
  switch (el.bind) {
    case "profile.name":
      return profileName;
    case "profile.roleTitle":
      return roleTitle;
    case "profile.currentCompany":
      return currentCompany;
    case "profile.industry":
      return industry;
    default:
      return el.value ?? "";
  }
}

function highlightParts(text: string, highlight?: string) {
  if (!highlight || !text.includes(highlight)) {
    return [{ text, highlight: false }];
  }
  const parts = text.split(highlight);
  const out: { text: string; highlight: boolean }[] = [];
  parts.forEach((part, i) => {
    if (part) out.push({ text: part, highlight: false });
    if (i < parts.length - 1) out.push({ text: highlight, highlight: true });
  });
  return out;
}

export function TemplateCanvasPreview({
  layout,
  width,
  height,
  selectedId,
  onSelect,
  onMove,
  scale = 0.45,
  profileName = "Your Name",
  roleTitle = "Your Title",
  currentCompany = "Your Company",
  industry = "Industry",
  avatarUrl,
  headline = "Your headline goes here with emphasis.",
  headlineHighlight = "emphasis.",
  subhead = "Supporting line that explains the idea in one sentence.",
}: Props) {
  const { start: startDrag, guides } = useSnapDrag(
    onMove,
    layout.elements,
    width,
    height,
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#e5e7eb] shadow-sm"
      style={{
        width: width * scale,
        height: height * scale,
        background: resolveBackgroundStyle(layout.background),
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
        }}
      >
        {layout.elements.map((el) => {
          const selected = selectedId === el.id;
          const common = {
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              onSelect?.(el.id);
            },
            onMouseDown: (e: React.MouseEvent) => {
              if (!onMove) return;
              e.stopPropagation();
              onSelect?.(el.id);
              startDrag(el, e.clientX, e.clientY, scale);
            },
            className: `absolute cursor-move ${selected ? "outline outline-2 outline-[#5B3DF5]" : ""}`,
          };

          if (el.type === "avatar") {
            return (
              <div
                key={el.id}
                {...common}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.size,
                  height: el.size,
                  borderRadius: "999px",
                  background: "#E4E4E7",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 600,
                  color: "#52525B",
                  fontSize: el.size * 0.32,
                  overflow: "hidden",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
            );
          }

          if (el.type === "rect") {
            return (
              <div
                key={el.id}
                {...common}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  background: resolveRectFill(el),
                  borderRadius: el.radius ?? 0,
                  opacity: el.opacity ?? 1,
                }}
              />
            );
          }

          if (el.type === "visual_zone") {
            return (
              <div
                key={el.id}
                {...common}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  border: "1px dashed rgba(47,111,237,0.35)",
                  background:
                    "linear-gradient(180deg, rgba(74,143,240,0.12), rgba(47,111,237,0.06))",
                  display: "grid",
                  placeItems: "center",
                  color: "rgba(47,111,237,0.55)",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                Hero image
              </div>
            );
          }

          if (el.type === "carousel_nav") {
            return (
              <div
                key={el.id}
                {...common}
                style={{
                  left: el.x,
                  top: el.y,
                  fontFamily: el.style.fontFamily ?? "Inter, sans-serif",
                  fontSize: el.style.fontSize,
                  fontWeight: el.style.fontWeight ?? 600,
                  color: el.style.color,
                  textAlign: el.style.align ?? "right",
                }}
              >
                {el.label}
              </div>
            );
          }

          const text =
            el.type === "text"
              ? resolveText(el, profileName, roleTitle, currentCompany, industry)
              : el.type === "post_headline"
                ? headline
                : subhead;
          const style = el.style;
          const parts =
            el.type === "post_headline"
              ? highlightParts(text, headlineHighlight)
              : [{ text, highlight: false }];

          return (
            <div
              key={el.id}
              {...common}
              style={{
                left: el.x,
                top: el.y,
                width: el.w,
                fontFamily: style.fontFamily ?? "Inter, sans-serif",
                fontSize: style.fontSize,
                fontWeight: style.fontWeight ?? 400,
                color: style.color,
                textAlign: style.align ?? "left",
                lineHeight: style.lineHeight ?? 1.2,
                whiteSpace: "pre-wrap",
              }}
            >
              {parts.map((part, i) => (
                <span
                  key={i}
                  style={{
                    color: part.highlight
                      ? (style.highlightColor ?? "#0056D2")
                      : style.color,
                  }}
                >
                  {part.text}
                </span>
              ))}
            </div>
          );
        })}
        <AlignmentGuides guides={guides} width={width} height={height} />
      </div>
    </div>
  );
}

function AlignmentGuides({
  guides,
  width,
  height,
}: {
  guides: SnapGuide[];
  width: number;
  height: number;
}) {
  if (!guides.length) return null;

  const verticals = guides.filter((g) => g.orientation === "vertical");
  const horizontals = guides.filter((g) => g.orientation === "horizontal");
  const hasIntersection = verticals.length > 0 && horizontals.length > 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {verticals.map((guide, i) => (
        <div
          key={`v-${guide.position}-${i}`}
          className="absolute top-0 w-px"
          style={{
            left: guide.position,
            height,
            backgroundColor: GUIDE_COLOR,
          }}
        />
      ))}
      {horizontals.map((guide, i) => (
        <div
          key={`h-${guide.position}-${i}`}
          className="absolute left-0 h-px"
          style={{
            top: guide.position,
            width,
            backgroundColor: GUIDE_COLOR,
          }}
        />
      ))}
      {hasIntersection
        ? verticals.flatMap((v, vi) =>
            horizontals.map((h, hi) => (
              <Crosshair
                key={`ix-${vi}-${hi}`}
                x={v.position}
                y={h.position}
                emphasized
              />
            )),
          )
        : guides.map((guide, i) => (
            <Crosshair
              key={`c-${i}`}
              x={
                guide.orientation === "vertical" ? guide.position : guide.crossAt
              }
              y={
                guide.orientation === "horizontal" ? guide.position : guide.crossAt
              }
            />
          ))}
    </div>
  );
}

function Crosshair({
  x,
  y,
  emphasized = false,
}: {
  x: number;
  y: number;
  emphasized?: boolean;
}) {
  const half = CROSSHAIR_SIZE / 2;
  const stroke = emphasized ? 2 : 1.5;
  return (
    <svg
      className="absolute overflow-visible"
      style={{ left: x - half, top: y - half, width: CROSSHAIR_SIZE, height: CROSSHAIR_SIZE }}
      aria-hidden
    >
      <line
        x1={half}
        y1={0}
        x2={half}
        y2={CROSSHAIR_SIZE}
        stroke={GUIDE_COLOR}
        strokeWidth={stroke}
      />
      <line
        x1={0}
        y1={half}
        x2={CROSSHAIR_SIZE}
        y2={half}
        stroke={GUIDE_COLOR}
        strokeWidth={stroke}
      />
    </svg>
  );
}

function useSnapDrag(
  onMove?: (id: string, x: number, y: number) => void,
  elements: TemplateElement[] = [],
  canvasW = 1080,
  canvasH = 1080,
) {
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const stateRef = useRef({
    id: "",
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    scale: 1,
    element: null as TemplateElement | null,
  });

  const start = useCallback(
    (
      element: TemplateElement,
      clientX: number,
      clientY: number,
      scale: number,
    ) => {
      if (!onMove) return;
      const state = stateRef.current;
      state.id = element.id;
      state.element = element;
      state.originX = element.x;
      state.originY = element.y;
      state.startX = clientX;
      state.startY = clientY;
      state.scale = scale;

      const onMoveWindow = (e: MouseEvent) => {
        const dx = (e.clientX - state.startX) / state.scale;
        const dy = (e.clientY - state.startY) / state.scale;
        const current =
          state.element ?? elements.find((el) => el.id === state.id) ?? null;
        if (!current) return;

        const rawX = Math.round(state.originX + dx);
        const rawY = Math.round(state.originY + dy);
        const bounds = getElementBounds({ ...current, x: rawX, y: rawY });
        const snap = computeSnap(
          bounds,
          canvasW,
          canvasH,
          elements,
          state.id,
        );

        const clamped = clampElement(
          { ...current, x: snap.x, y: snap.y },
          canvasW,
          canvasH,
        );

        setGuides(snap.guides);
        onMove(state.id, clamped.x, clamped.y);
      };

      const onUp = () => {
        setGuides([]);
        window.removeEventListener("mousemove", onMoveWindow);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMoveWindow);
      window.addEventListener("mouseup", onUp);
    },
    [onMove, elements, canvasW, canvasH],
  );

  return { start, guides };
}
