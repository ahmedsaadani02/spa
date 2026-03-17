const { Resend } = require('resend');
const { bootstrapEnv, getEnvDiagnostics } = require('../config/env');

const loadEnv = () => bootstrapEnv();

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const resendConfigFromEnv = () => {
  loadEnv();

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
  const fromName = process.env.RESEND_FROM_NAME?.trim() || 'SPA Facturation';

  return { apiKey, fromEmail, fromName, diagnostics: getEnvDiagnostics() };
};

const buildCodeMessage = ({ title, code, expiresMinutes }) => `
${title}

Code temporaire: ${code}
Valide pendant ${expiresMinutes} minutes.

Si vous n'etes pas a l'origine de cette demande, ignorez ce message.
`.trim();

const buildCodeHtml = ({ title, code, expiresMinutes }) => `
<div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px;">
    <h2 style="margin: 0 0 12px 0; color: #0f172a;">${escapeHtml(title)}</h2>
    <p style="margin: 0 0 12px 0;">Code temporaire :</p>
    <div style="font-size: 26px; letter-spacing: 4px; font-weight: 700; margin: 0 0 12px 0;">${escapeHtml(code)}</div>
    <p style="margin: 0 0 12px 0;">Valide pendant ${escapeHtml(expiresMinutes)} minutes.</p>
    <p style="margin: 0; color: #475569;">Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>
  </div>
</div>
`.trim();

class AuthEmailService {
  constructor() {
    this.resendConfig = resendConfigFromEnv();
    this.resendClient = this.resendConfig.apiKey ? new Resend(this.resendConfig.apiKey) : null;
    console.log('[mail] resend env diagnostics', {
      sourceUsed: this.resendConfig.diagnostics?.sourceUsed ?? 'unknown',
      appIsPackaged: this.resendConfig.diagnostics?.appIsPackaged ?? false,
      apiKeyLoaded: !!this.resendConfig.apiKey,
      fromEmailLoaded: !!this.resendConfig.fromEmail
    });
  }

  async sendLogin2FACode(user, code, expiresMinutes = 8) {
    const subject = 'Code de verification connexion ERP';
    const text = buildCodeMessage({
      title: `Bonjour ${user.nom || user.username},`,
      code,
      expiresMinutes
    });
    const html = buildCodeHtml({
      title: `Bonjour ${user.nom || user.username},`,
      code,
      expiresMinutes
    });
    return this.sendCodeEmail(user.email, subject, text, html, code);
  }

  async sendPasswordSetupCode(user, code, expiresMinutes = 10) {
    const subject = 'Activation de compte ERP';
    const text = buildCodeMessage({
      title: `Activation du compte protege (${user.email}).`,
      code,
      expiresMinutes
    });
    const html = buildCodeHtml({
      title: `Activation du compte protege (${user.email}).`,
      code,
      expiresMinutes
    });
    return this.sendCodeEmail(user.email, subject, text, html, code);
  }

  async sendPasswordResetCode(user, code, expiresMinutes = 10) {
    const subject = 'Reinitialisation mot de passe ERP';
    const text = buildCodeMessage({
      title: `Demande de reinitialisation pour ${user.email}.`,
      code,
      expiresMinutes
    });
    const html = buildCodeHtml({
      title: `Demande de reinitialisation pour ${user.email}.`,
      code,
      expiresMinutes
    });
    return this.sendCodeEmail(user.email, subject, text, html, code);
  }

  async sendCodeEmail(to, subject, text, html, code) {
    if (!to) {
      throw new Error('MAIL_TO_ADDRESS_REQUIRED');
    }

    if (!this.resendClient) {
      const message = '[mail] RESEND_API_KEY missing. Configure .env before using auth emails.';
      console.error(message);
      throw new Error('RESEND_API_KEY_MISSING');
    }

    if (!this.resendConfig.fromEmail) {
      const message = '[mail] RESEND_FROM_EMAIL missing. Configure .env before using auth emails.';
      console.error(message);
      throw new Error('RESEND_FROM_EMAIL_MISSING');
    }

    const from = `${this.resendConfig.fromName} <${this.resendConfig.fromEmail}>`;

    const response = await this.resendClient.emails.send({
      from,
      to: [to],
      subject,
      text,
      html
    });

    if (response?.error) {
      console.error('[mail] resend send failed', {
        to,
        subject,
        code,
        error: response.error
      });
      throw new Error(`RESEND_SEND_FAILED: ${response.error.message || 'Unknown error'}`);
    }

    console.log('[mail] resend send success', {
      to,
      subject,
      id: response?.data?.id ?? null
    });

    return { sent: true, provider: 'resend', id: response?.data?.id ?? null };
  }
}

module.exports = {
  AuthEmailService
};
