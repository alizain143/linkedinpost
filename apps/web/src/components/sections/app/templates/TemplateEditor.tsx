"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/app/query-state";
import { TemplateCanvasPreview } from "@/components/sections/app/templates/TemplateCanvasPreview";
import { Button } from "@/components/ui/button";
import { ColorPickerField } from "@/components/ui/color-picker";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useMediaTemplate,
  usePreviewMediaTemplate,
  useUpdateMediaTemplate,
} from "@/hooks/api/use-media-templates-api";
import { useContentProfiles } from "@/hooks/api/use-content-profiles-api";
import { useLinkedInProfile } from "@/hooks/api/use-linkedin-api";
import { useWorkspace } from "@/hooks/use-workspace";
import type {
  AnyMediaTemplateLayout,
  CarouselPageRole,
  MediaTemplateLayout,
  TemplateElement,
  TextBind,
} from "@/lib/api/types/media-template";
import {
  CAROUSEL_PAGE_TABS,
  getEditablePageLayout,
  isCarouselLayout,
  setEditablePageLayout,
} from "@/lib/template-layout-utils";
import {
  ADDABLE_LAYER_OPTIONS,
  type AddableLayerType,
  addLayerTypeLabel,
  canAddLayerType,
  createLayer,
} from "@/lib/template-layer-factory";
import { clampElement, clampLayout } from "@/lib/template-layout-bounds";
import {
  getLinkedInPreviewCompany,
  getLinkedInPreviewTitle,
} from "@/lib/linkedin-utils";

export function TemplateEditor() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { activeWorkspaceId: workspaceId } = useWorkspace();
  const templateQuery = useMediaTemplate(workspaceId, id);
  const updateTemplate = useUpdateMediaTemplate(workspaceId);
  const preview = usePreviewMediaTemplate(workspaceId);
  const { data: linkedInProfile } = useLinkedInProfile(workspaceId);
  const { data: contentProfiles } = useContentProfiles(workspaceId);

  const [name, setName] = useState("");
  const [rootLayout, setRootLayout] = useState<AnyMediaTemplateLayout | null>(
    null,
  );
  const [carouselPage, setCarouselPage] = useState<CarouselPageRole>("first");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isCarousel = rootLayout ? isCarouselLayout(rootLayout) : false;
  const layout: MediaTemplateLayout | null = rootLayout
    ? getEditablePageLayout(rootLayout, carouselPage)
    : null;

  const commitPageLayout = useCallback(
    (pageLayout: MediaTemplateLayout) => {
      setRootLayout((prev) =>
        prev ? setEditablePageLayout(prev, carouselPage, pageLayout) : prev,
      );
    },
    [carouselPage],
  );

  const canvasWidth = templateQuery.data?.width ?? 1080;
  const canvasHeight = templateQuery.data?.height ?? 1080;

  const defaultContentProfile = useMemo(() => {
    if (!contentProfiles?.length) return null;
    return (
      contentProfiles.find((profile) => profile.isDefault) ?? contentProfiles[0]
    );
  }, [contentProfiles]);

  const previewProfileName =
    linkedInProfile?.fullName ?? defaultContentProfile?.name ?? "Your Name";
  const previewRoleTitle =
    getLinkedInPreviewTitle(linkedInProfile) ??
    defaultContentProfile?.roleTitle ??
    "Your Title";
  const previewCurrentCompany =
    getLinkedInPreviewCompany(linkedInProfile) ?? "Your Company";
  const previewIndustry = defaultContentProfile?.industry ?? "Industry";

  useEffect(() => {
    if (templateQuery.data) {
      setName(templateQuery.data.name);
      const loaded = templateQuery.data.layout;
      setRootLayout(
        isCarouselLayout(loaded)
          ? loaded
          : clampLayout(
              loaded,
              templateQuery.data.width,
              templateQuery.data.height,
            ),
      );
    }
  }, [templateQuery.data]);

  const selected = useMemo(
    () => layout?.elements.find((el) => el.id === selectedId) ?? null,
    [layout, selectedId],
  );

  const updateElement = useCallback(
    (elementId: string, patch: Partial<TemplateElement>) => {
      if (!layout) return;
      const nextPage: MediaTemplateLayout = {
        ...layout,
        elements: layout.elements.map((el) => {
          if (el.id !== elementId) return el;
          const merged = { ...el, ...patch } as TemplateElement;
          return clampElement(merged, canvasWidth, canvasHeight);
        }),
      };
      commitPageLayout(nextPage);
    },
    [layout, canvasWidth, canvasHeight, commitPageLayout],
  );

  const moveElement = useCallback(
    (elementId: string, x: number, y: number) => {
      updateElement(elementId, { x, y } as Partial<TemplateElement>);
    },
    [updateElement],
  );

  function removeElement(elementId: string) {
    if (!layout) return;
    if (layout.elements.length <= 1) {
      toast.error("Template must keep at least one layer");
      return;
    }
    commitPageLayout({
      ...layout,
      elements: layout.elements.filter((el) => el.id !== elementId),
    });
    setSelectedId((current) => (current === elementId ? null : current));
  }

  function addLayer(type: AddableLayerType) {
    if (!layout) return;
    if (!canAddLayerType(type, layout.elements)) {
      toast.error(
        `This template already includes a ${addLayerTypeLabel(type)} layer`,
      );
      return;
    }

    const next = createLayer(
      type,
      canvasWidth,
      canvasHeight,
      layout.elements,
    );
    commitPageLayout({
      ...layout,
      elements: [...layout.elements, next],
    });
    setSelectedId(next.id);
  }

  async function handleSave() {
    if (!rootLayout || !id) return;
    try {
      await updateTemplate.mutateAsync({
        id,
        body: {
          name: name.trim() || "Untitled",
          layout: isCarouselLayout(rootLayout)
            ? rootLayout
            : clampLayout(rootLayout, canvasWidth, canvasHeight),
        },
      });
      toast.success("Template saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handlePreview() {
    if (!rootLayout) return;
    try {
      const result = await preview.mutateAsync({
        body: {
          layout: rootLayout,
          pageRole: carouselPage,
        },
        templateId: id,
      });
      setPreviewUrl(`data:${result.mimeType};base64,${result.pngBase64}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/templates"
            className="text-sm font-medium text-[#64748b] hover:text-[#0f172a]"
          >
            ← Templates
          </Link>
          <input
            className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#5B3DF5]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => void handlePreview()}
            disabled={preview.isPending || !layout}
          >
            {preview.isPending ? "Rendering…" : "PNG preview"}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={updateTemplate.isPending || !layout}
          >
            {updateTemplate.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={templateQuery.isLoading}
        error={templateQuery.error}
        onRetry={() => void templateQuery.refetch()}
      >
        {layout && templateQuery.data && (
          <div className="grid gap-4 lg:grid-cols-[220px_1fr_280px]">
            {isCarousel && (
              <div className="lg:col-span-3 flex flex-wrap gap-2">
                {CAROUSEL_PAGE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setCarouselPage(tab.id);
                      setSelectedId(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      carouselPage === tab.id
                        ? "bg-[#5B3DF5] text-white"
                        : "bg-[#f1f5f9] text-[#475569]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            <aside className="rounded-2xl border border-[#eceef3] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                  Layers
                </div>
                <select
                  className="max-w-[110px] rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-semibold text-[#4338ca] outline-none focus:border-[#5B3DF5]"
                  defaultValue=""
                  onChange={(event) => {
                    const type = event.target.value as AddableLayerType | "";
                    if (!type) return;
                    addLayer(type);
                    event.target.value = "";
                  }}
                >
                  <option value="">+ Add</option>
                  {ADDABLE_LAYER_OPTIONS.map((option) => {
                    const disabled =
                      layout &&
                      !canAddLayerType(option.type, layout.elements);
                    return (
                      <option
                        key={option.type}
                        value={option.type}
                        disabled={disabled}
                      >
                        {option.label}
                        {disabled && option.type !== "text" ? " (present)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <ul className="space-y-1">
                {layout.elements.map((el) => (
                  <li key={el.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedId(el.id)}
                      className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-xs ${
                        selectedId === el.id
                          ? "bg-[#eef2ff] font-semibold text-[#4338ca]"
                          : "text-[#475569] hover:bg-[#f8fafc]"
                      }`}
                    >
                      {el.type} · {el.id}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${el.id}`}
                      onClick={() => removeElement(el.id)}
                      className="rounded-md p-1 text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                    >
                      <MsIcon name="delete" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#eceef3] bg-[#f8fafc] p-6">
              {linkedInProfile ? (
                <p className="text-xs text-[#64748b]">
                  Preview uses LinkedIn profile data
                </p>
              ) : (
                <p className="text-xs text-[#94a3b8]">
                  Connect LinkedIn in Settings for profile preview
                </p>
              )}
              <TemplateCanvasPreview
                layout={layout}
                width={canvasWidth}
                height={canvasHeight}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={moveElement}
                scale={0.5}
                profileName={previewProfileName}
                roleTitle={previewRoleTitle}
                currentCompany={previewCurrentCompany}
                industry={previewIndustry}
                avatarUrl={linkedInProfile?.pictureUrl}
              />
              {previewUrl && (
                <div>
                  <div className="mb-2 text-xs font-semibold text-[#64748b]">
                    Exported PNG
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Template PNG preview"
                    className="max-w-full rounded-xl border border-[#e5e7eb]"
                  />
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-[#eceef3] bg-white p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                Properties
              </div>
              {!selected ? (
                <p className="text-sm text-[#64748b]">
                  Select an element to edit position, binding, and typography.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-[#f8fafc] px-2 py-1.5 text-xs text-[#64748b]">
                    {selected.type} · {selected.id}
                  </div>

                  <Field label="X">
                    <NumberInput
                      value={selected.x}
                      onChange={(value) =>
                        updateElement(selected.id, {
                          x: value,
                        } as Partial<TemplateElement>)
                      }
                    />
                  </Field>
                  <Field label="Y">
                    <NumberInput
                      value={selected.y}
                      onChange={(value) =>
                        updateElement(selected.id, {
                          y: value,
                        } as Partial<TemplateElement>)
                      }
                    />
                  </Field>

                  {"w" in selected && (
                    <Field label="Width">
                      <NumberInput
                        value={selected.w}
                        onChange={(value) =>
                          updateElement(selected.id, {
                            w: value,
                          } as Partial<TemplateElement>)
                        }
                      />
                    </Field>
                  )}

                  {"h" in selected && (
                    <Field label="Height">
                      <NumberInput
                        value={selected.h}
                        onChange={(value) =>
                          updateElement(selected.id, {
                            h: value,
                          } as Partial<TemplateElement>)
                        }
                      />
                    </Field>
                  )}

                  {"size" in selected && (
                    <Field label="Size">
                      <NumberInput
                        value={selected.size}
                        onChange={(value) =>
                          updateElement(selected.id, {
                            size: value,
                          } as Partial<TemplateElement>)
                        }
                      />
                    </Field>
                  )}

                  {selected.type === "rect" && (
                    <>
                      <ColorPickerField
                        label="Fill"
                        value={selected.fill}
                        onChange={(value) =>
                          updateElement(selected.id, { fill: value })
                        }
                        fieldClassName="[&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-[#94a3b8] [&_label]:font-semibold [&_label]:mb-1"
                      />
                      <Field label="Radius">
                        <NumberInput
                          value={selected.radius ?? 0}
                          onChange={(value) =>
                            updateElement(selected.id, { radius: value })
                          }
                        />
                      </Field>
                      <Field label="Opacity">
                        <NumberInput
                          value={selected.opacity ?? 1}
                          step={0.1}
                          onChange={(value) =>
                            updateElement(selected.id, { opacity: value })
                          }
                        />
                      </Field>
                    </>
                  )}

                  {selected.type === "text" && (
                    <>
                      <Field label="Bind">
                        <select
                          className={fieldClass}
                          value={selected.bind}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              bind: e.target.value as TextBind,
                            })
                          }
                        >
                          <option value="static">static</option>
                          <option value="profile.name">profile.name</option>
                          <option value="profile.roleTitle">
                            profile.roleTitle
                          </option>
                          <option value="profile.currentCompany">
                            profile.currentCompany
                          </option>
                          <option value="profile.industry">
                            profile.industry
                          </option>
                        </select>
                      </Field>
                      {selected.bind === "static" && (
                        <Field label="Value">
                          <input
                            className={fieldClass}
                            value={selected.value ?? ""}
                            onChange={(e) =>
                              updateElement(selected.id, {
                                value: e.target.value,
                              })
                            }
                          />
                        </Field>
                      )}
                    </>
                  )}

                  {"style" in selected && selected.style && (
                    <>
                      <Field label="Font">
                        <select
                          className={fieldClass}
                          value={selected.style.fontFamily ?? "Inter"}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                fontFamily: e.target.value,
                              },
                            } as Partial<TemplateElement>)
                          }
                        >
                          {TEMPLATE_FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Font size">
                        <NumberInput
                          value={selected.style.fontSize}
                          onChange={(value) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                fontSize: value,
                              },
                            } as Partial<TemplateElement>)
                          }
                        />
                      </Field>
                      {"fontWeight" in selected.style && (
                        <Field label="Font weight">
                          <NumberInput
                            value={selected.style.fontWeight ?? 400}
                            onChange={(value) =>
                              updateElement(selected.id, {
                                style: {
                                  ...selected.style,
                                  fontWeight: value,
                                },
                              } as Partial<TemplateElement>)
                            }
                          />
                        </Field>
                      )}
                      <ColorPickerField
                        label="Color"
                        value={selected.style.color}
                        onChange={(value) =>
                          updateElement(selected.id, {
                            style: {
                              ...selected.style,
                              color: value,
                            },
                          } as Partial<TemplateElement>)
                        }
                        fieldClassName="[&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-[#94a3b8] [&_label]:font-semibold [&_label]:mb-1"
                      />
                      <Field label="Align">
                        <select
                          className={fieldClass}
                          value={selected.style.align ?? "left"}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                align: e.target.value as
                                  | "left"
                                  | "center"
                                  | "right",
                              },
                            } as Partial<TemplateElement>)
                          }
                        >
                          <option value="left">left</option>
                          <option value="center">center</option>
                          <option value="right">right</option>
                        </select>
                      </Field>
                      <Field label="Line height">
                        <NumberInput
                          value={selected.style.lineHeight ?? 1.2}
                          step={0.1}
                          onChange={(value) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                lineHeight: value,
                              },
                            } as Partial<TemplateElement>)
                          }
                        />
                      </Field>
                      {"highlightColor" in selected.style && (
                        <ColorPickerField
                          label="Highlight"
                          value={selected.style.highlightColor ?? "#0056D2"}
                          onChange={(value) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                highlightColor: value,
                              },
                            } as Partial<TemplateElement>)
                          }
                          fieldClassName="[&_label]:text-[11px] [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-[#94a3b8] [&_label]:font-semibold [&_label]:mb-1"
                        />
                      )}
                    </>
                  )}

                  <Button
                    variant="destructive"
                    className="mt-4 w-full"
                    onClick={() => removeElement(selected.id)}
                  >
                    Delete layer
                  </Button>
                </div>
              )}
            </aside>
          </div>
        )}
      </QueryState>

      {!templateQuery.isLoading && templateQuery.isError && (
        <Button variant="secondary" onClick={() => router.push("/app/templates")}>
          Back to templates
        </Button>
      )}
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-[13px] outline-none focus:border-[#5B3DF5]";

const TEMPLATE_FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "Newsreader", label: "Newsreader" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Helvetica", label: "Helvetica" },
] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      className={fieldClass}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
