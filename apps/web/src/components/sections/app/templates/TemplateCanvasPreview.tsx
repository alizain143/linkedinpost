"use client";

import type {
  MediaTemplateLayout,
  TemplateElement,
} from "@/lib/api/types/media-template";

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
  headline?: string;
  headlineHighlight?: string;
  subhead?: string;
};

function resolveText(
  el: Extract<TemplateElement, { type: "text" }>,
  profileName: string,
  roleTitle: string,
): string {
  switch (el.bind) {
    case "profile.name":
      return profileName;
    case "profile.roleTitle":
      return roleTitle;
    case "profile.industry":
      return "Industry";
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
  headline = "Your headline goes here with emphasis.",
  headlineHighlight = "emphasis.",
  subhead = "Supporting line that explains the idea in one sentence.",
}: Props) {
  const dragRef = useRefDrag(onMove);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#e5e7eb] shadow-sm"
      style={{
        width: width * scale,
        height: height * scale,
        background: layout.background.color,
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
            key: el.id,
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
              onSelect?.(el.id);
            },
            onMouseDown: (e: React.MouseEvent) => {
              if (!onMove) return;
              e.stopPropagation();
              onSelect?.(el.id);
              dragRef.start(el.id, el.x, el.y, e.clientX, e.clientY, scale);
            },
            className: `absolute cursor-move ${selected ? "outline outline-2 outline-[#5B3DF5]" : ""}`,
          };

          if (el.type === "avatar") {
            return (
              <div
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
                }}
              >
                {profileName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            );
          }

          if (el.type === "rect") {
            return (
              <div
                {...common}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  background: el.fill,
                  borderRadius: el.radius ?? 0,
                  opacity: el.opacity ?? 1,
                }}
              />
            );
          }

          if (el.type === "visual_zone") {
            return (
              <div
                {...common}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  border: "1px dashed #cbd5e1",
                  background: "rgba(148,163,184,0.08)",
                }}
              />
            );
          }

          const text =
            el.type === "text"
              ? resolveText(el, profileName, roleTitle)
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
      </div>
    </div>
  );
}

function useRefDrag(
  onMove?: (id: string, x: number, y: number) => void,
) {
  const state = { id: "", startX: 0, startY: 0, originX: 0, originY: 0, scale: 1 };

  function start(
    id: string,
    x: number,
    y: number,
    clientX: number,
    clientY: number,
    scale: number,
  ) {
    if (!onMove) return;
    state.id = id;
    state.originX = x;
    state.originY = y;
    state.startX = clientX;
    state.startY = clientY;
    state.scale = scale;

    const onMoveWindow = (e: MouseEvent) => {
      const dx = (e.clientX - state.startX) / state.scale;
      const dy = (e.clientY - state.startY) / state.scale;
      onMove(state.id, Math.round(state.originX + dx), Math.round(state.originY + dy));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMoveWindow);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMoveWindow);
    window.addEventListener("mouseup", onUp);
  }

  return { start };
}
