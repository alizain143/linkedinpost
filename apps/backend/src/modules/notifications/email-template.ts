import { NotificationType } from '@prisma/client';
import { EMAIL_LOGO_URL } from './email-logo';

export const EMAIL_BRAND = {
  violet: '#5B3DF5',
  violetDark: '#4A2FD4',
  violetLight: '#EDE9FE',
  ink: '#0F172A',
  inkMuted: '#334155',
  slate: '#64748B',
  slateLight: '#94A3B8',
  border: '#E2E8F0',
  canvas: '#F8FAFC',
  white: '#FFFFFF',
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
} as const;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

export interface EmailTheme {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  accent: string;
  accentHover: string;
  ctaLabel: string;
}

const EMAIL_THEMES: Record<NotificationType, EmailTheme> = {
  [NotificationType.generation_complete]: {
    badge: 'Generation complete',
    badgeBg: EMAIL_BRAND.violetLight,
    badgeColor: EMAIL_BRAND.violet,
    accent: EMAIL_BRAND.violet,
    accentHover: EMAIL_BRAND.violetDark,
    ctaLabel: 'Review post',
  },
  [NotificationType.post_ready_for_approval]: {
    badge: 'Awaiting approval',
    badgeBg: EMAIL_BRAND.warningBg,
    badgeColor: EMAIL_BRAND.warning,
    accent: EMAIL_BRAND.violet,
    accentHover: EMAIL_BRAND.violetDark,
    ctaLabel: 'Review & approve',
  },
  [NotificationType.client_approved]: {
    badge: 'Client approved',
    badgeBg: EMAIL_BRAND.successBg,
    badgeColor: EMAIL_BRAND.success,
    accent: EMAIL_BRAND.success,
    accentHover: '#047857',
    ctaLabel: 'View post',
  },
  [NotificationType.client_requested_changes]: {
    badge: 'Changes requested',
    badgeBg: EMAIL_BRAND.warningBg,
    badgeColor: EMAIL_BRAND.warning,
    accent: EMAIL_BRAND.violet,
    accentHover: EMAIL_BRAND.violetDark,
    ctaLabel: 'View feedback',
  },
  [NotificationType.publish_succeeded]: {
    badge: 'Published',
    badgeBg: EMAIL_BRAND.successBg,
    badgeColor: EMAIL_BRAND.success,
    accent: EMAIL_BRAND.success,
    accentHover: '#047857',
    ctaLabel: 'View post',
  },
  [NotificationType.publish_failed]: {
    badge: 'Action needed',
    badgeBg: EMAIL_BRAND.dangerBg,
    badgeColor: EMAIL_BRAND.danger,
    accent: EMAIL_BRAND.danger,
    accentHover: '#B91C1C',
    ctaLabel: 'Fix & retry',
  },
  [NotificationType.weekly_content_reminder]: {
    badge: 'Weekly reminder',
    badgeBg: EMAIL_BRAND.violetLight,
    badgeColor: EMAIL_BRAND.violet,
    accent: EMAIL_BRAND.violet,
    accentHover: EMAIL_BRAND.violetDark,
    ctaLabel: 'Plan this week',
  },
  [NotificationType.product_update]: {
    badge: 'Product update',
    badgeBg: EMAIL_BRAND.violetLight,
    badgeColor: EMAIL_BRAND.violet,
    accent: EMAIL_BRAND.violet,
    accentHover: EMAIL_BRAND.violetDark,
    ctaLabel: "See what's new",
  },
};

const DEFAULT_THEME: EmailTheme = {
  badge: 'Update',
  badgeBg: EMAIL_BRAND.violetLight,
  badgeColor: EMAIL_BRAND.violet,
  accent: EMAIL_BRAND.violet,
  accentHover: EMAIL_BRAND.violetDark,
  ctaLabel: 'Open linkedinpost.ai',
};

export function getEmailTheme(type: NotificationType): EmailTheme {
  return EMAIL_THEMES[type] ?? DEFAULT_THEME;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function extractQuotedHook(body: string): string | null {
  const match = body.match(/"([^"]+)"/);
  return match?.[1]?.trim() || null;
}

export interface BuildEmailHtmlParams {
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  frontendUrl: string;
}

export function buildEmailHtml(params: BuildEmailHtmlParams): string {
  const theme = getEmailTheme(params.type);
  const hook = extractQuotedHook(params.body);
  const safeTitle = escapeHtml(params.title);
  const safeBody = escapeHtml(params.body);
  const safeHook = hook ? escapeHtml(hook) : null;
  const settingsUrl = `${params.frontendUrl.replace(/\/$/, '')}/app/settings`;
  const year = new Date().getFullYear();

  const hookBlock = safeHook
    ? `
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 0;border-collapse:collapse;">
            <tr>
              <td style="padding:20px 22px;background-color:${EMAIL_BRAND.canvas};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
                <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.slateLight};">Post preview</p>
                <p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.6;font-weight:500;color:${EMAIL_BRAND.ink};">&ldquo;${safeHook}&rdquo;</p>
              </td>
            </tr>
          </table>`
    : '';

  const ctaBlock = params.actionUrl
    ? `
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0 0;border-collapse:collapse;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="border-radius:8px;background-color:${theme.accent};">
                      <a href="${escapeHtml(params.actionUrl)}" target="_blank" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:8px;mso-padding-alt:0;">
                        <!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%;mso-text-raise:26pt">&nbsp;</i><![endif]-->
                        <span style="mso-text-raise:13pt;">${escapeHtml(theme.ctaLabel)} &rarr;</span>
                        <!--[if mso]><i style="letter-spacing:32px;mso-font-width:-100%">&nbsp;</i><![endif]-->
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 28px 22px !important; }
      .email-header { padding: 28px 22px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${safeBody}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${EMAIL_BRAND.canvas};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width:560px;border-collapse:collapse;">
          <tr>
            <td class="email-header" style="padding:0 0 24px;">
              <a href="${escapeHtml(params.frontendUrl)}" target="_blank" style="text-decoration:none;display:inline-block;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;padding:0 12px 0 0;">
                      <img src="${EMAIL_LOGO_URL}" width="36" height="36" alt="linkedinpost.ai" style="display:block;width:36px;height:36px;border:0;border-radius:8px;">
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:-0.02em;color:${EMAIL_BRAND.ink};">
                        linkedinpost<span style="color:${EMAIL_BRAND.violet};">.ai</span>
                      </span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="height:3px;background-color:${theme.accent};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="email-body" style="padding:32px 36px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td>
                          <span style="display:inline-block;padding:5px 12px;border-radius:6px;background-color:${theme.badgeBg};font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.02em;color:${theme.badgeColor};">${escapeHtml(theme.badge)}</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:16px 0 0;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:${EMAIL_BRAND.ink};">${safeTitle}</h1>
                    <p style="margin:12px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;color:${EMAIL_BRAND.inkMuted};">${safeBody}</p>
                    ${hookBlock}
                    ${ctaBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 4px 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.6;color:${EMAIL_BRAND.slate};">
                You're receiving this because notification emails are enabled for your account.
              </p>
              <p style="margin:0 0 16px;font-family:${FONT};font-size:13px;line-height:1.6;color:${EMAIL_BRAND.slate};">
                <a href="${escapeHtml(settingsUrl)}" style="color:${EMAIL_BRAND.violet};text-decoration:none;font-weight:600;">Manage notification preferences</a>
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${EMAIL_BRAND.slateLight};">
                &copy; ${year} linkedinpost.ai
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEmailText(params: {
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  frontendUrl: string;
}): string {
  const theme = getEmailTheme(params.type);
  const settingsUrl = `${params.frontendUrl.replace(/\/$/, '')}/app/settings`;
  const lines = [
    'linkedinpost.ai',
    '',
    params.title,
    '',
    params.body,
  ];

  if (params.actionUrl) {
    lines.push('', `${theme.ctaLabel}: ${params.actionUrl}`);
  }

  lines.push(
    '',
    '---',
    "Manage notification preferences:",
    settingsUrl,
    '',
    `© ${new Date().getFullYear()} linkedinpost.ai`,
  );

  return lines.join('\n');
}
