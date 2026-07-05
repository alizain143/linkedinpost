import type {
  AnyMediaTemplateLayout,
  CarouselMediaTemplateLayout,
  CarouselPageRole,
  MediaTemplateLayout,
} from "@/lib/api/types/media-template";

export function isCarouselLayout(
  layout: AnyMediaTemplateLayout,
): layout is CarouselMediaTemplateLayout {
  return layout.version === 2 && layout.kind === "carousel";
}

export function getEditablePageLayout(
  root: AnyMediaTemplateLayout,
  page: CarouselPageRole,
): MediaTemplateLayout {
  if (isCarouselLayout(root)) {
    return root.pages[page];
  }
  return root;
}

export function setEditablePageLayout(
  root: AnyMediaTemplateLayout,
  page: CarouselPageRole,
  pageLayout: MediaTemplateLayout,
): AnyMediaTemplateLayout {
  if (isCarouselLayout(root)) {
    return {
      ...root,
      pages: {
        ...root.pages,
        [page]: pageLayout,
      },
    };
  }
  return pageLayout;
}

export const CAROUSEL_PAGE_TABS: { id: CarouselPageRole; label: string }[] = [
  { id: "first", label: "First" },
  { id: "middle", label: "Middle" },
  { id: "last", label: "Last" },
];

export const SYSTEM_CAROUSEL_IDENTITY_PRESET_ID = "system:carousel-identity";

export function getPreviewLayout(
  layout: AnyMediaTemplateLayout,
): MediaTemplateLayout {
  if (isCarouselLayout(layout)) {
    return layout.pages.first;
  }
  return layout;
}
