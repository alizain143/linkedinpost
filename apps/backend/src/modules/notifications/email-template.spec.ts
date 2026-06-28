import { NotificationType } from '@prisma/client';
import {
  buildEmailHtml,
  buildEmailText,
  escapeHtml,
  extractQuotedHook,
  getEmailTheme,
} from './email-template';

describe('email-template', () => {
  it('escapes HTML in user content', () => {
    const html = buildEmailHtml({
      type: NotificationType.publish_failed,
      title: '<script>alert(1)</script>',
      body: 'Post "A & B" failed',
      actionUrl: 'https://app.test/app/posts/1',
      frontendUrl: 'https://app.test',
    });

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('A &amp; B');
  });

  it('renders branded layout with logo and per-type CTA', () => {
    const html = buildEmailHtml({
      type: NotificationType.generation_complete,
      title: 'Generation complete',
      body: '"My hook" is ready for review.',
      actionUrl: 'https://app.test/app/posts/abc',
      frontendUrl: 'https://app.test',
    });

    expect(html).toContain('linkedinpost<span style="color:#5B3DF5;">.ai</span>');
    expect(html).toContain('data:image/png;base64,');
    expect(html).toContain('alt="linkedinpost.ai"');
    expect(html).toContain('Generation complete');
    expect(html).toContain('Review post');
    expect(html).toContain('Post preview');
    expect(html).toContain('My hook');
    expect(html).toContain('/app/settings');
  });

  it('uses failure styling for publish_failed', () => {
    const theme = getEmailTheme(NotificationType.publish_failed);

    expect(theme.badge).toBe('Action needed');
    expect(theme.ctaLabel).toBe('Fix & retry');
    expect(theme.accent).toBe('#DC2626');
  });

  it('extracts quoted hook from body', () => {
    expect(extractQuotedHook('"Hello world" is ready.')).toBe('Hello world');
    expect(extractQuotedHook('No hook here')).toBeNull();
  });

  it('builds plain-text fallback with settings link', () => {
    const text = buildEmailText({
      type: NotificationType.weekly_content_reminder,
      title: 'Weekly content reminder',
      body: "It's time to plan this week's LinkedIn content.",
      actionUrl: 'https://app.test/app/calendar',
      frontendUrl: 'https://app.test',
    });

    expect(text).toContain('linkedinpost.ai');
    expect(text).toContain('Plan this week: https://app.test/app/calendar');
    expect(text).toContain('https://app.test/app/settings');
  });

  it('escapeHtml handles quotes', () => {
    expect(escapeHtml(`"test"`)).toBe('&quot;test&quot;');
  });
});
