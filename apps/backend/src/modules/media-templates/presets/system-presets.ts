import { ResolvedMediaTemplate } from '../layout.types';
import { getSystemCarouselIdentityPreset } from './carousel-identity.preset';
import { getSystemIdentityCardPreset } from './identity-card.preset';

export const SYSTEM_PRESETS: ResolvedMediaTemplate[] = [
  getSystemIdentityCardPreset(),
  getSystemCarouselIdentityPreset(),
];
