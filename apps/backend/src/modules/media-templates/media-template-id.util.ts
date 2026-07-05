import { isMediaTemplateId } from '../../common/validators/media-template-id.validator';

/** System presets are resolved at runtime and must not be stored in the UUID FK column. */
export function toDbMediaTemplateId(
  mediaTemplateId?: string | null,
): string | null | undefined {
  if (mediaTemplateId == null) {
    return mediaTemplateId;
  }
  if (!isMediaTemplateId(mediaTemplateId)) {
    return null;
  }
  return mediaTemplateId.startsWith('system:') ? null : mediaTemplateId;
}
