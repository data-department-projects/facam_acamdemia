/**
 * Service d'envoi d'emails via Resend.
 * Utilisé pour l'OTP de réinitialisation mot de passe (template style FACAM).
 */

import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

const DUREE_OTP_MINUTES = 3;

/**
 * Génère le HTML de l'email OTP (style image fournie : en-tête bleu, logo, code en évidence, expiration 3 min).
 */
function genererHtmlOtp(code: string, logoUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de réinitialisation</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- En-tête bleu -->
          <tr>
            <td style="background-color:#02123B;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;">Code de réinitialisation</h1>
                    <p style="margin:8px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Mot de passe oublié — Administration FACAM ACADEMIA</p>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    ${logoUrl ? `<img src="${logoUrl}" alt="FACAM ACADEMIA" width="120" height="36" style="display:block;" />` : '<span style="font-size:18px;font-weight:bold;color:#ffffff;">FACAM ACADEMIA</span>'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Ligne jaune -->
          <tr>
            <td style="height:4px;background-color:#ffae03;"></td>
          </tr>
          <!-- Corps -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">Utilisez le code ci-dessous pour réinitialiser le mot de passe de votre compte. Ce code expire dans ${DUREE_OTP_MINUTES} minutes.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="padding:20px;border:2px solid #001b61;border-radius:8px;background-color:#f9fafb;">
                    <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#001b61;">${code}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#6b7280;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            </td>
          </tr>
          <!-- Pied -->
          <tr>
            <td style="padding:16px 32px;background-color:#f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">FACAM ACADEMIA — Administration du site</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logoUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : (null as unknown as Resend);
    this.from = process.env.RESEND_FROM_EMAIL ?? 'FACAM ACADEMIA <onboarding@resend.dev>';
    this.logoUrl = process.env.APP_LOGO_URL ?? '';
  }

  /**
   * Envoie l'email contenant l'OTP de réinitialisation (style FACAM, expiration 3 min).
   */
  async envoyerOtpReinitialisation(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      return { success: false, error: 'RESEND_API_KEY non configuré' };
    }
    const html = genererHtmlOtp(code, this.logoUrl);
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [email],
        subject: 'FACAM ACADEMIA — Code de réinitialisation (3 min)',
        html,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur envoi email';
      return { success: false, error: message };
    }
  }
}
