import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { EnvironmentVariables } from '../../config/env.validation';

interface AuthEmailInput {
  to: string;
  name?: string | null;
  token: string;
  expiresAt: Date;
}

interface SendTransactionalEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend?: Resend;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async sendEmailVerification(input: AuthEmailInput): Promise<void> {
    const actionUrl = this.buildWebUrl('/verify-email', input.token);
    const expiresAt = input.expiresAt.toISOString();

    await this.sendTransactionalEmail({
      to: input.to,
      subject: 'Verify your email address',
      html: this.renderActionEmail({
        actionLabel: 'Verify email',
        actionUrl,
        body: 'Please verify your email address to finish setting up your account.',
        expiresAt,
        greeting: this.getGreeting(input.name),
        title: 'Verify your email address',
      }),
      text: this.renderActionText({
        actionLabel: 'Verify email',
        actionUrl,
        body: 'Please verify your email address to finish setting up your account.',
        expiresAt,
        greeting: this.getGreeting(input.name),
      }),
      idempotencyKey: `email-verification-${this.hashToken(input.token)}`,
    });
  }

  async sendPasswordReset(input: AuthEmailInput): Promise<void> {
    const actionUrl = this.buildWebUrl('/reset-password', input.token);
    const expiresAt = input.expiresAt.toISOString();

    await this.sendTransactionalEmail({
      to: input.to,
      subject: 'Reset your password',
      html: this.renderActionEmail({
        actionLabel: 'Reset password',
        actionUrl,
        body: 'We received a request to reset your password. You can ignore this email if you did not request it.',
        expiresAt,
        greeting: this.getGreeting(input.name),
        title: 'Reset your password',
      }),
      text: this.renderActionText({
        actionLabel: 'Reset password',
        actionUrl,
        body: 'We received a request to reset your password. You can ignore this email if you did not request it.',
        expiresAt,
        greeting: this.getGreeting(input.name),
      }),
      idempotencyKey: `password-reset-${this.hashToken(input.token)}`,
    });
  }

  private async sendTransactionalEmail(
    input: SendTransactionalEmailInput,
  ): Promise<void> {
    const mailProvider = this.configService.get('MAIL_PROVIDER', {
      infer: true,
    });

    if (mailProvider === 'console') {
      this.logger.log(
        `[console email] ${input.subject} -> ${input.to}\n${input.text}`,
      );
      return;
    }

    const response = await this.getResendClient().emails.send(
      {
        from: this.configService.get('MAIL_FROM', { infer: true }),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );

    if (response.error) {
      this.logger.warn(
        `Resend email failed with status ${response.error.statusCode}: ${response.error.message}`,
      );
      return;
    }

    const emailId = response.data?.id ? ` (${response.data.id})` : '';

    this.logger.log(`Resend email sent to ${input.to}${emailId}`);
  }

  private buildWebUrl(path: string, token: string): string {
    const appWebUrl = this.configService
      .get('APP_WEB_URL', { infer: true })
      .replace(/\/+$/, '');
    const url = new URL(path, `${appWebUrl}/`);

    url.searchParams.set('token', token);

    return url.toString();
  }

  private renderActionEmail(input: {
    title: string;
    greeting: string;
    body: string;
    actionLabel: string;
    actionUrl: string;
    expiresAt: string;
  }): string {
    return `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1 style="font-size:20px">${this.escapeHtml(input.title)}</h1>
        <p>${this.escapeHtml(input.greeting)}</p>
        <p>${this.escapeHtml(input.body)}</p>
        <p>
          <a href="${this.escapeHtml(input.actionUrl)}" style="display:inline-block;background:#111827;color:#ffffff;padding:10px 16px;text-decoration:none;border-radius:6px">
            ${this.escapeHtml(input.actionLabel)}
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${this.escapeHtml(input.actionUrl)}">${this.escapeHtml(input.actionUrl)}</a></p>
        <p>This link expires at ${this.escapeHtml(input.expiresAt)}.</p>
      </div>
    `;
  }

  private renderActionText(input: {
    greeting: string;
    body: string;
    actionLabel: string;
    actionUrl: string;
    expiresAt: string;
  }): string {
    return [
      input.greeting,
      '',
      input.body,
      '',
      `${input.actionLabel}: ${input.actionUrl}`,
      '',
      `This link expires at ${input.expiresAt}.`,
    ].join('\n');
  }

  private getGreeting(name?: string | null): string {
    return name ? `Hi ${name},` : 'Hi,';
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex').slice(0, 32);
  }

  private getResendClient(): Resend {
    if (!this.resend) {
      this.resend = new Resend(
        this.configService.get('RESEND_API_KEY', { infer: true }),
      );
    }

    return this.resend;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
