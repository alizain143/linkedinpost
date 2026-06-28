-- PostType expansion
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'question_post';
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'framework';
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'myth_buster';
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'prediction';
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'behind_the_scenes';
ALTER TYPE "PostType" ADD VALUE IF NOT EXISTS 'comparison';

-- PostPackageStatus expansion
ALTER TYPE "PostPackageStatus" ADD VALUE IF NOT EXISTS 'awaiting_media_selection';

-- PostMediaType expansion
ALTER TYPE "PostMediaType" ADD VALUE IF NOT EXISTS 'branded_quote_card';
ALTER TYPE "PostMediaType" ADD VALUE IF NOT EXISTS 'stat_highlight';
ALTER TYPE "PostMediaType" ADD VALUE IF NOT EXISTS 'tip_card';
ALTER TYPE "PostMediaType" ADD VALUE IF NOT EXISTS 'infographic';
ALTER TYPE "PostMediaType" ADD VALUE IF NOT EXISTS 'photo_illustration';

-- CouncilAgentRole expansion
ALTER TYPE "CouncilAgentRole" ADD VALUE IF NOT EXISTS 'image_scout';

-- ContentProfile brand colors
ALTER TABLE "content_profiles" ADD COLUMN IF NOT EXISTS "brandPrimary" TEXT;
ALTER TABLE "content_profiles" ADD COLUMN IF NOT EXISTS "brandAccent" TEXT;

-- PostPackage media preferences
ALTER TABLE "post_packages" ADD COLUMN IF NOT EXISTS "mediaTypePreference" "PostMediaType";
ALTER TABLE "post_packages" ADD COLUMN IF NOT EXISTS "mediaCustomPrompt" TEXT;
ALTER TABLE "post_packages" ADD COLUMN IF NOT EXISTS "mediaTemplateId" TEXT;

-- PostMedia metadata
ALTER TABLE "post_media" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
