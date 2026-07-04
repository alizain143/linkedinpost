-- PostMediaType: neutral type for unbound AI images
ALTER TYPE "PostMediaType" ADD VALUE IF NOT EXISTS 'generated';

-- Drop media preference / template columns (custom prompt remains)
ALTER TABLE "post_packages" DROP COLUMN IF EXISTS "mediaTypePreference";
ALTER TABLE "post_packages" DROP COLUMN IF EXISTS "mediaTemplateId";
