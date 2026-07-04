"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import {
  useAiDraftMediaTemplate,
  useCreateMediaTemplate,
  useCreateMediaTemplateFromPreset,
  useDeleteMediaTemplate,
  useMediaTemplates,
  useSetDefaultMediaMode,
  useSetDefaultMediaTemplate,
} from "@/hooks/api/use-media-templates-api";
import { useWorkspace } from "@/hooks/use-workspace";
import { TemplateCanvasPreview } from "@/components/sections/app/templates/TemplateCanvasPreview";

export function TemplatesList() {
  const router = useRouter();
  const { activeWorkspaceId: workspaceId } = useWorkspace();
  const listQuery = useMediaTemplates(workspaceId);
  const createFromPreset = useCreateMediaTemplateFromPreset(workspaceId);
  const createTemplate = useCreateMediaTemplate(workspaceId);
  const deleteTemplate = useDeleteMediaTemplate(workspaceId);
  const setDefault = useSetDefaultMediaTemplate(workspaceId);
  const setMode = useSetDefaultMediaMode(workspaceId);
  const aiDraft = useAiDraftMediaTemplate(workspaceId);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const data = listQuery.data;

  async function handleUsePreset(presetId: string) {
    try {
      const created = await createFromPreset.mutateAsync(presetId);
      toast.success("Preset added to your templates");
      router.push(`/app/templates/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add preset");
    }
  }

  async function handleAiCreate() {
    if (aiPrompt.trim().length < 10) {
      toast.error("Describe the template in a bit more detail");
      return;
    }
    try {
      const draft = await aiDraft.mutateAsync(aiPrompt.trim());
      const created = await createTemplate.mutateAsync({
        name: draft.name,
        description: draft.description ?? undefined,
        width: draft.width,
        height: draft.height,
        layout: draft.layout,
      });
      toast.success("AI template created — tweak it in the editor");
      setAiOpen(false);
      setAiPrompt("");
      router.push(`/app/templates/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI draft failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold text-[#0f172a]">
            Media templates
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Design branded layouts. AI fills only the center content when you
            generate posts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setAiOpen(true)}>
            AI create
          </Button>
          <Button
            onClick={() =>
              data?.presets[0] && void handleUsePreset(data.presets[0].id)
            }
            disabled={!data?.presets[0] || createFromPreset.isPending}
          >
            Add identity card
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={listQuery.isLoading}
        error={listQuery.error}
        onRetry={() => void listQuery.refetch()}
      >
        {data && (
          <>
            <section className="mb-8 rounded-2xl border border-[#eceef3] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#0f172a]">
                Default media mode
              </h2>
              <p className="mt-1 text-xs text-[#64748b]">
                Used by council, autopilot, and generate-media when a post has no
                override.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["freestyle", "template"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      void setMode.mutateAsync(mode).then(() =>
                        toast.success(
                          mode === "template"
                            ? "Default mode: template"
                            : "Default mode: freestyle",
                        ),
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                      data.defaultMediaMode === mode
                        ? "bg-[#5B3DF5] text-white"
                        : "bg-[#f1f5f9] text-[#475569]"
                    }`}
                  >
                    {mode}
                    {mode === "template" ? " (1 cr)" : " (2 cr)"}
                  </button>
                ))}
              </div>
            </section>

            {data.presets.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">
                  System presets
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="rounded-2xl border border-[#eceef3] bg-white p-4"
                    >
                      <TemplateCanvasPreview
                        layout={preset.layout}
                        width={preset.width}
                        height={preset.height}
                        scale={0.28}
                      />
                      <div className="mt-3">
                        <div className="font-semibold text-[#0f172a]">
                          {preset.name}
                        </div>
                        <p className="mt-1 text-xs text-[#64748b]">
                          {preset.description}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3"
                          variant="secondary"
                          onClick={() => void handleUsePreset(preset.id)}
                          disabled={createFromPreset.isPending}
                        >
                          Use preset
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold text-[#0f172a]">
                Your templates
              </h2>
              {data.templates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d1d5db] bg-[#fafafa] p-8 text-center text-sm text-[#64748b]">
                  No custom templates yet. Add the identity card preset or create
                  one with AI.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.templates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-2xl border border-[#eceef3] bg-white p-4"
                    >
                      <Link href={`/app/templates/${template.id}`}>
                        <TemplateCanvasPreview
                          layout={template.layout}
                          width={template.width}
                          height={template.height}
                          scale={0.28}
                        />
                      </Link>
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/app/templates/${template.id}`}
                            className="font-semibold text-[#0f172a] hover:underline"
                          >
                            {template.name}
                          </Link>
                          {template.isWorkspaceDefault && (
                            <div className="mt-0.5 text-[11px] font-semibold text-[#5B3DF5]">
                              Workspace default
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          href={`/app/templates/${template.id}`}
                        >
                          Edit
                        </Button>
                        {!template.isWorkspaceDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void setDefault
                                .mutateAsync({
                                  scope: "workspace",
                                  templateId: template.id,
                                })
                                .then(() =>
                                  toast.success("Set as workspace default"),
                                )
                            }
                          >
                            Set default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void deleteTemplate
                              .mutateAsync(template.id)
                              .then(() => toast.success("Template deleted"))
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </QueryState>

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0f172a]">
              AI create template
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Describe the layout. You can edit positions and bindings after it
              is created.
            </p>
            <textarea
              className="mt-4 w-full rounded-xl border border-[#e5e7eb] p-3 text-sm outline-none focus:border-[#5B3DF5]"
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Minimal white card, avatar and name top left, title top right, skills bottom left, Save & Repost bottom right, big headline center"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAiOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleAiCreate()}
                disabled={aiDraft.isPending || createTemplate.isPending}
              >
                {aiDraft.isPending || createTemplate.isPending
                  ? "Creating…"
                  : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
