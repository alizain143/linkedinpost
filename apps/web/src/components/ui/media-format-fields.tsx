"use client";

import { SelectField } from "@/components/ui/select";
import {
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_SLIDES,
  estimateCarouselSlideCount,
  getCarouselCreditCost,
  MEDIA_CAROUSEL_CREDIT_PER_SLIDE,
  MEDIA_GENERATION_CREDIT_COST,
  MEDIA_TEMPLATE_CREDIT_COST,
} from "@/lib/credit-costs";
import type { MediaFormat, MediaMode } from "@/lib/api/types/media-template";
import { SYSTEM_CAROUSEL_IDENTITY_PRESET_ID } from "@/lib/template-layout-utils";

export type MediaFormatFieldValues = {
  mediaFormat: MediaFormat;
  carouselSlideCount: number | null;
  carouselStyle: "template" | "freestyle";
  mediaTemplateId: string;
};

type MediaFormatFieldsProps = {
  values: MediaFormatFieldValues;
  templateOptions: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (patch: Partial<MediaFormatFieldValues>) => void;
};

const SLIDE_COUNT_OPTIONS = [
  { value: "auto", label: "Auto (AI decides)" },
  ...Array.from({ length: CAROUSEL_MAX_SLIDES - CAROUSEL_MIN_SLIDES + 1 }, (_, i) => {
    const count = i + CAROUSEL_MIN_SLIDES;
    return { value: String(count), label: `${count} slides` };
  }),
];

export function MediaFormatFields({
  values,
  templateOptions,
  disabled,
  onChange,
}: MediaFormatFieldsProps) {
  const isCarousel = values.mediaFormat === "carousel";
  const slideEstimate = estimateCarouselSlideCount(values.carouselSlideCount);
  const carouselCost = getCarouselCreditCost(slideEstimate);
  const singleCost =
    values.carouselStyle === "template" && values.mediaTemplateId
      ? MEDIA_TEMPLATE_CREDIT_COST
      : MEDIA_GENERATION_CREDIT_COST;

  const carouselPresetAvailable = templateOptions.some(
    (option) =>
      option.value === SYSTEM_CAROUSEL_IDENTITY_PRESET_ID ||
      option.label.toLowerCase().includes("carousel"),
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-[12px] font-semibold text-[#64748b]">
          Media format
        </div>
        <div className="flex gap-2">
          {(["single", "carousel"] as MediaFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({
                  mediaFormat: format,
                  ...(format === "single"
                    ? {}
                    : {
                        carouselStyle:
                          values.carouselStyle === "freestyle" ||
                          !values.mediaTemplateId
                            ? "freestyle"
                            : "template",
                      }),
                })
              }
              className={`rounded-lg border px-3 py-2 text-[12px] font-semibold capitalize transition ${
                values.mediaFormat === format
                  ? "border-[#4f46e5] bg-[#eef2ff] text-[#4338ca]"
                  : "border-[#e3e6ef] bg-white text-[#64748b] hover:border-[#cbd5e1]"
              } disabled:opacity-60`}
            >
              {format === "single" ? "Single image" : "Carousel"}
            </button>
          ))}
        </div>
      </div>

      {isCarousel && (
        <>
          <SelectField
            label="Slide count"
            options={SLIDE_COUNT_OPTIONS}
            value={
              values.carouselSlideCount == null
                ? "auto"
                : String(values.carouselSlideCount)
            }
            onChange={(event) => {
              const value = event.target.value;
              onChange({
                carouselSlideCount:
                  value === "auto" ? null : Number.parseInt(value, 10),
              });
            }}
            disabled={disabled}
          />

          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-[#64748b]">
              Carousel style
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    carouselStyle: "freestyle",
                    mediaTemplateId: "",
                  })
                }
                className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                  values.carouselStyle === "freestyle"
                    ? "border-[#4f46e5] bg-[#eef2ff] text-[#4338ca]"
                    : "border-[#e3e6ef] bg-white text-[#64748b]"
                }`}
              >
                AI images (no template)
              </button>
              <button
                type="button"
                disabled={disabled || !carouselPresetAvailable}
                onClick={() =>
                  onChange({
                    carouselStyle: "template",
                    mediaTemplateId:
                      templateOptions.find(
                        (option) =>
                          option.value === SYSTEM_CAROUSEL_IDENTITY_PRESET_ID,
                      )?.value ??
                      templateOptions.find((option) =>
                        option.label.toLowerCase().includes("carousel"),
                      )?.value ??
                      values.mediaTemplateId,
                  })
                }
                className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                  values.carouselStyle === "template"
                    ? "border-[#4f46e5] bg-[#eef2ff] text-[#4338ca]"
                    : "border-[#e3e6ef] bg-white text-[#64748b]"
                } disabled:opacity-60`}
              >
                Branded template
              </button>
            </div>
          </div>
        </>
      )}

      {!isCarousel && templateOptions.length > 0 && (
        <SelectField
          label="Template"
          options={[
            { value: "", label: "No template (freestyle image)" },
            ...templateOptions,
          ]}
          value={values.mediaTemplateId}
          onChange={(event) =>
            onChange({ mediaTemplateId: event.target.value })
          }
          disabled={disabled}
        />
      )}

      {isCarousel && values.carouselStyle === "template" && (
        <SelectField
          label="Carousel template"
          options={templateOptions.filter(
            (option) =>
              option.value === SYSTEM_CAROUSEL_IDENTITY_PRESET_ID ||
              option.label.toLowerCase().includes("carousel"),
          )}
          value={values.mediaTemplateId}
          onChange={(event) =>
            onChange({ mediaTemplateId: event.target.value })
          }
          disabled={disabled}
        />
      )}

      <p className="text-[12px] text-[#94a3b8]">
        {isCarousel ? (
          <>
            {slideEstimate} slides × {MEDIA_CAROUSEL_CREDIT_PER_SLIDE} ={" "}
            {carouselCost} credits
            {values.carouselSlideCount == null ? " (estimated)" : ""}
          </>
        ) : (
          <>Uses {singleCost} credit{singleCost === 1 ? "" : "s"}</>
        )}
      </p>
    </div>
  );
}

export function mediaFormatValuesToRequestBody(values: MediaFormatFieldValues): {
  mediaFormat: MediaFormat;
  carouselSlideCount?: number;
  mediaMode?: MediaMode;
  mediaTemplateId?: string;
} {
  if (values.mediaFormat === "carousel") {
    return {
      mediaFormat: "carousel",
      ...(values.carouselSlideCount != null
        ? { carouselSlideCount: values.carouselSlideCount }
        : {}),
      ...(values.carouselStyle === "template" && values.mediaTemplateId
        ? {
            mediaMode: "template" as const,
            mediaTemplateId: values.mediaTemplateId,
          }
        : { mediaMode: "freestyle" as const }),
    };
  }

  return {
    mediaFormat: "single",
    ...(values.mediaTemplateId
      ? {
          mediaMode: "template" as const,
          mediaTemplateId: values.mediaTemplateId,
        }
      : { mediaMode: "freestyle" as const }),
  };
}
