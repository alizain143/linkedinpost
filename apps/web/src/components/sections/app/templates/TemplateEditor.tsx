"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/app/query-state";
import { TemplateCanvasPreview } from "@/components/sections/app/templates/TemplateCanvasPreview";
import { Button } from "@/components/ui/button";
import {
  useMediaTemplate,
  usePreviewMediaTemplate,
  useUpdateMediaTemplate,
} from "@/hooks/api/use-media-templates-api";
import { useWorkspace } from "@/hooks/use-workspace";
import type {
  MediaTemplateLayout,
  TemplateElement,
  TextBind,
} from "@/lib/api/types/media-template";

export function TemplateEditor() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { activeWorkspaceId: workspaceId } = useWorkspace();
  const templateQuery = useMediaTemplate(workspaceId, id);
  const updateTemplate = useUpdateMediaTemplate(workspaceId);
  const preview = usePreviewMediaTemplate(workspaceId);

  const [name, setName] = useState("");
  const [layout, setLayout] = useState<MediaTemplateLayout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (templateQuery.data) {
      setName(templateQuery.data.name);
      setLayout(templateQuery.data.layout);
    }
  }, [templateQuery.data]);

  const selected = useMemo(
    () => layout?.elements.find((el) => el.id === selectedId) ?? null,
    [layout, selectedId],
  );

  function updateElement(id: string, patch: Partial<TemplateElement>) {
    setLayout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as TemplateElement) : el,
        ),
      };
    });
  }

  function moveElement(id: string, x: number, y: number) {
    updateElement(id, { x, y } as Partial<TemplateElement>);
  }

  async function handleSave() {
    if (!layout || !id) return;
    try {
      await updateTemplate.mutateAsync({
        id,
        body: { name: name.trim() || "Untitled", layout },
      });
      toast.success("Template saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handlePreview() {
    if (!layout) return;
    try {
      const result = await preview.mutateAsync({
        body: { layout },
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
            <aside className="rounded-2xl border border-[#eceef3] bg-white p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                Layers
              </div>
              <ul className="space-y-1">
                {layout.elements.map((el) => (
                  <li key={el.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(el.id)}
                      className={`w-full rounded-lg px-2 py-1.5 text-left text-xs ${
                        selectedId === el.id
                          ? "bg-[#eef2ff] font-semibold text-[#4338ca]"
                          : "text-[#475569] hover:bg-[#f8fafc]"
                      }`}
                    >
                      {el.type} · {el.id}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#eceef3] bg-[#f8fafc] p-6">
              <TemplateCanvasPreview
                layout={layout}
                width={templateQuery.data.width}
                height={templateQuery.data.height}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={moveElement}
                scale={0.5}
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
                  <Field label="X">
                    <input
                      type="number"
                      className={fieldClass}
                      value={selected.x}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          x: Number(e.target.value),
                        } as Partial<TemplateElement>)
                      }
                    />
                  </Field>
                  <Field label="Y">
                    <input
                      type="number"
                      className={fieldClass}
                      value={selected.y}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          y: Number(e.target.value),
                        } as Partial<TemplateElement>)
                      }
                    />
                  </Field>
                  {"w" in selected && (
                    <Field label="Width">
                      <input
                        type="number"
                        className={fieldClass}
                        value={selected.w}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            w: Number(e.target.value),
                          } as Partial<TemplateElement>)
                        }
                      />
                    </Field>
                  )}
                  {"size" in selected && (
                    <Field label="Size">
                      <input
                        type="number"
                        className={fieldClass}
                        value={selected.size}
                        onChange={(e) =>
                          updateElement(selected.id, {
                            size: Number(e.target.value),
                          } as Partial<TemplateElement>)
                        }
                      />
                    </Field>
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
                      <Field label="Font size">
                        <input
                          type="number"
                          className={fieldClass}
                          value={selected.style.fontSize}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                fontSize: Number(e.target.value),
                              },
                            } as Partial<TemplateElement>)
                          }
                        />
                      </Field>
                      <Field label="Color">
                        <input
                          className={fieldClass}
                          value={selected.style.color}
                          onChange={(e) =>
                            updateElement(selected.id, {
                              style: {
                                ...selected.style,
                                color: e.target.value,
                              },
                            } as Partial<TemplateElement>)
                          }
                        />
                      </Field>
                      {"highlightColor" in selected.style && (
                        <Field label="Highlight">
                          <input
                            className={fieldClass}
                            value={selected.style.highlightColor ?? ""}
                            onChange={(e) =>
                              updateElement(selected.id, {
                                style: {
                                  ...selected.style,
                                  highlightColor: e.target.value,
                                },
                              } as Partial<TemplateElement>)
                            }
                          />
                        </Field>
                      )}
                    </>
                  )}
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
