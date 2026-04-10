/**
 * Service d'envoi d'emails via Nodemailer (SMTP Gmail).
 * Utilisé pour l'OTP de réinitialisation mot de passe (template style FACAM).
 */

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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
  private readonly transporter: Transporter | null = null;
  private readonly fromName: string;
  private readonly fromEmail: string;
  private readonly logoUrl: string;

  constructor() {
    // Nettoyage : pas d'espaces ni guillemets (évite l'erreur 535 Gmail)
    const rawUser = process.env.SMTP_USER ?? '';
    const rawPass = process.env.SMTP_PASS ?? '';
    const user = rawUser.trim().replace(/^["']|["']$/g, '');
    const pass = rawPass
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\s/g, '');
    this.fromName = (process.env.EMAIL_FROM_NAME ?? 'facam_academia').trim();
    this.fromEmail = user;
    this.logoUrl = (process.env.APP_LOGO_URL ?? '').trim();

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: (process.env.SMTP_HOST ?? 'smtp.gmail.com').trim(),
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        tls: { rejectUnauthorized: true },
        // Évite de bloquer 2 min si le serveur SMTP ne répond pas (firewall, réseau, etc.)
        connectionTimeout: 15000,
        greetingTimeout: 10000,
      });
    }
  }

  /**
   * Envoie l'email contenant l'OTP de réinitialisation (style FACAM, expiration 3 min).
   */
  async envoyerOtpReinitialisation(
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter || !this.fromEmail) {
      return { success: false, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS)' };
    }
    const html = genererHtmlOtp(code, this.logoUrl);
    const from = `${this.fromName} <${this.fromEmail}>`;
    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'FACAM ACADEMIA — Code de réinitialisation (3 min)',
        html,
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur envoi email';
      // Log pour diagnostic (logs plateforme) sans exposer les détails au client
      console.error('[EmailService] Envoi OTP échoué:', message);
      return { success: false, error: message };
    }
  }
}
