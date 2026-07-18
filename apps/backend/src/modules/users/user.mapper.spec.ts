import { UserPlan } from '@prisma/client';
import { buildUser } from '../../test/fixtures';
import { toUserResponse } from './user.mapper';

describe('user.mapper', () => {
  describe('toUserResponse', () => {
    it('maps user fields and notification prefs', () => {
      const user = buildUser({
        emailWeeklyReminders: false,
        emailProductUpdates: true,
        plan: UserPlan.starter,
      });

      const result = toUserResponse(
        user,
        'https://img.example/avatar.png',
        'ws-id',
      );

      expect(result.email).toBe('test@example.com');
      expect(result.profileImageUrl).toBe('https://img.example/avatar.png');
      expect(result.defaultWorkspaceId).toBe('ws-id');
      expect(result.notifications).toEqual({
        weeklyReminders: false,
        generationComplete: true,
        productUpdates: true,
        publishAlerts: true,
        pushEnabled: true,
      });
      expect(result.plan).toBe(UserPlan.starter);
      expect(result.toursSeen).toEqual({});
      expect(result.lastAcknowledgedPlan).toBe(UserPlan.pro);
    });

    it('parses toursSeen json map', () => {
      const user = buildUser({
        toursSeen: { 'product-core-v1': '2026-07-19T00:00:00.000Z' },
        lastAcknowledgedPlan: UserPlan.free,
      });

      const result = toUserResponse(user);

      expect(result.toursSeen).toEqual({
        'product-core-v1': '2026-07-19T00:00:00.000Z',
      });
      expect(result.lastAcknowledgedPlan).toBe(UserPlan.free);
    });
  });
});
