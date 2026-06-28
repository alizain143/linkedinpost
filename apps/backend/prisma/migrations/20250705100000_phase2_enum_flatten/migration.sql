-- Phase 2: flatten Document, PostMedia, AutopilotConfig, WorkspaceMemberRole

-- WorkspaceMemberRole enum
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('owner', 'editor', 'viewer');
ALTER TABLE "workspace_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "workspace_members" ALTER COLUMN "role" TYPE "WorkspaceMemberRole" USING ("role"::"WorkspaceMemberRole");
ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'owner';

-- DocumentPurpose: remove user_document
ALTER TYPE "DocumentPurpose" RENAME TO "DocumentPurpose_old";
CREATE TYPE "DocumentPurpose" AS ENUM ('profile');
ALTER TABLE "documents" ALTER COLUMN "purpose" TYPE "DocumentPurpose" USING ("purpose"::text::"DocumentPurpose");
DROP TYPE "DocumentPurpose_old";

-- Drop Document polymorphic attach columns
ALTER TABLE "documents" DROP COLUMN "attachedToType";
ALTER TABLE "documents" DROP COLUMN "attachedToId";
DROP TYPE "DocumentAttachedToType";

-- Drop PostMediaSource
ALTER TABLE "post_media" DROP COLUMN "source";
DROP TYPE "PostMediaSource";

-- Drop AutopilotConfig.frequency
ALTER TABLE "autopilot_configs" DROP COLUMN "frequency";
DROP TYPE "AutopilotFrequency";
