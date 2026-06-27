import { registerAs } from '@nestjs/config';
import { DocumentPurpose } from '../common/constants/document.constants';

export default registerAs('r2', () => ({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  publicProfileUrl: process.env.R2_PUBLIC_PROFILE_URL ?? '',
  buckets: {
    [DocumentPurpose.PROFILE]:
      process.env.R2_BUCKET_PROFILE_IMAGES ?? 'profile-images',
    [DocumentPurpose.USER_DOCUMENT]:
      process.env.R2_BUCKET_USER_DOCUMENTS ?? 'user-documents',
  },
}));
