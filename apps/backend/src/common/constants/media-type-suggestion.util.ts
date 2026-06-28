import { PostMediaType, PostType } from '@prisma/client';

const POST_TYPE_TO_MEDIA: Partial<Record<PostType, PostMediaType>> = {
  personal_story: PostMediaType.branded_quote_card,
  list_post: PostMediaType.tip_card,
  how_to: PostMediaType.branded_quote_card,
  contrarian_take: PostMediaType.branded_quote_card,
  hot_take: PostMediaType.branded_quote_card,
  case_study: PostMediaType.stat_highlight,
  question_post: PostMediaType.branded_quote_card,
  framework: PostMediaType.branded_quote_card,
  myth_buster: PostMediaType.stat_highlight,
  prediction: PostMediaType.infographic,
  behind_the_scenes: PostMediaType.photo_illustration,
  comparison: PostMediaType.tip_card,
};

export function suggestMediaType(
  postType?: PostType | null,
): PostMediaType {
  if (postType && POST_TYPE_TO_MEDIA[postType]) {
    return POST_TYPE_TO_MEDIA[postType]!;
  }
  return PostMediaType.branded_quote_card;
}

export const TEMPLATE_MEDIA_TYPES: PostMediaType[] = [
  PostMediaType.branded_quote_card,
  PostMediaType.stat_highlight,
  PostMediaType.tip_card,
];

export const GENERATIVE_MEDIA_TYPES: PostMediaType[] = [
  PostMediaType.quote_card,
  PostMediaType.infographic,
  PostMediaType.photo_illustration,
];

export function isTemplateMediaType(mediaType: PostMediaType): boolean {
  return TEMPLATE_MEDIA_TYPES.includes(mediaType);
}
