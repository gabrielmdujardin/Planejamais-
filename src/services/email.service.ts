/**
 * Serviço de e-mail transacional do Planeja+ (Seção 8, RF-030, RN-017, RN-002, RNF-004).
 * Suporta:
 *   1. Desenvolvimento local via Mailpit (SMTP_HOST=mailpit|127.0.0.1, SMTP_PORT=1025)
 *   2. Envio externo real via SMTP (Nodemailer) ou Resend
 * Todos os campos dinâmicos são sanitizados com escapeHtml contra XSS/HTML injection.
 * Não considera captura pelo Mailpit como entrega a destinatário externo (isExternalDelivery = false).
 */

import { escapeHtml } from "../../lib/domain/business-rules.ts"
import { dispatchTransactionalEmail } from "../../lib/email/smtp-transport.ts"

function getAppBaseUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export interface SendApprovalEmailInput {
  to: string
  guestName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  confirmationToken: string
  confirmationDeadline: string
  approvedCompanions: string[]
  rejectedCompanions: string[]
}

export interface SendRejectionEmailInput {
  to: string
  guestName: string
  eventTitle: string
  reason?: string
}

export interface SendConfirmationReminderInput {
  to: string
  guestName: string
  eventTitle: string
  confirmationToken: string
  confirmationDeadline: string
}

export interface SendRegistrationConfirmationInput {
  to: string
  userName: string
  verificationToken: string
  expiresInHours?: number
}

export interface SendPasswordRecoveryInput {
  to: string
  userName: string
  resetToken: string
  expiresInMinutes?: number
}

export interface SendTeamInvitationInput {
  to: string
  inviteeName: string
  inviterName: string
  eventTitle: string
  eventId: string
  roleLabel: string
  inviteToken: string
  expiresAt: string
}

export interface SendEventAnnouncementInput {
  to: string
  recipientName: string
  eventTitle: string
  subject: string
  message: string
}

export const EmailService = {
  /**
   * 1. Confirmação de cadastro de usuário (Seção 7 e 8)
   */
  async sendRegistrationConfirmationEmail(input: SendRegistrationConfirmationInput) {
    const baseUrl = getAppBaseUrl()
    const verifyUrl = `${baseUrl}/login?verifyToken=${encodeURIComponent(input.verificationToken)}`
    const safeName = escapeHtml(input.userName)
    const safeUrl = escapeHtml(verifyUrl)
    const hours = input.expiresInHours || 24

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Confirme seu cadastro no Planeja+</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Bem-vindo(a) ao Planeja+!</h1>
          </div>
          <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Olá, <strong>${safeName}</strong>!</p>
            <p>Sua conta foi criada com sucesso no Planeja+. Clique no botão abaixo para confirmar seu endereço de e-mail:</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${safeUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Confirmar Meu E-mail
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Este link é válido por ${hours} horas. Endereço direto: <a href="${safeUrl}">${safeUrl}</a></p>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to: input.to,
      subject: "Planeja+ — Confirme seu endereço de e-mail",
      template: "registration_confirmation",
      html,
      metadata: { expiresInHours: hours },
    })
  },

  /**
   * 2. Recuperação de senha com token temporário (Seção 7 e 8)
   */
  async sendPasswordRecoveryEmail(input: SendPasswordRecoveryInput) {
    const baseUrl = getAppBaseUrl()
    const resetUrl = `${baseUrl}/login?resetToken=${encodeURIComponent(input.resetToken)}`
    const safeName = escapeHtml(input.userName)
    const safeUrl = escapeHtml(resetUrl)
    const mins = input.expiresInMinutes || 60

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Recuperação de Senha — Planeja+</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1e293b; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Recuperação de Senha — Planeja+</h1>
          </div>
          <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Olá, <strong>${safeName}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b;">O link expira em ${mins} minutos. Caso não tenha solicitado, ignore este e-mail com segurança.</p>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to: input.to,
      subject: "Planeja+ — Instruções para recuperação de senha",
      template: "password_recovery",
      html,
      metadata: { expiresInMinutes: mins },
    })
  },

  /**
   * 3. Aviso de senha redefinida/alterada com sucesso (Seção 7 e 8)
   */
  async sendPasswordResetNoticeEmail(to: string, userName: string) {
    const safeName = escapeHtml(userName)
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Senha Atualizada — Planeja+</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="margin-top: 0; color: #059669;">Senha alterada com sucesso</h2>
            <p>Olá, <strong>${safeName}</strong>,</p>
            <p>Informamos que a senha da sua conta no Planeja+ foi alterada e todas as sessões anteriores foram revogadas por segurança.</p>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to,
      subject: "Planeja+ — Sua senha foi atualizada",
      template: "password_reset_notice",
      html,
    })
  },

  /**
   * 4. Convite para equipe colaborativa do evento (RN-002, RF-039, RF-042)
   */
  async sendTeamInvitationEmail(input: SendTeamInvitationInput) {
    const baseUrl = getAppBaseUrl()
    const inviteUrl = `${baseUrl}/event/${encodeURIComponent(input.eventId)}?teamInviteToken=${encodeURIComponent(input.inviteToken)}`
    const safeInvitee = escapeHtml(input.inviteeName)
    const safeInviter = escapeHtml(input.inviterName)
    const safeEvent = escapeHtml(input.eventTitle)
    const safeRole = escapeHtml(input.roleLabel)
    const safeExpires = escapeHtml(input.expiresAt)
    const safeUrl = escapeHtml(inviteUrl)

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Convite para Equipe — ${safeEvent}</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Convite de Colaboração — Planeja+</h1>
          </div>
          <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Olá, <strong>${safeInvitee}</strong>!</p>
            <p><strong>${safeInviter}</strong> convidou você para integrar a equipe organizadora do evento <strong>${safeEvent}</strong> com o papel de <strong>${safeRole}</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${safeUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Aceitar Convite da Equipe
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Convite válido até ${safeExpires}.</p>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to: input.to,
      subject: `Planeja+ — Convite para equipe do evento ${input.eventTitle}`,
      template: "team_invitation",
      html,
      metadata: { eventId: input.eventId, role: input.roleLabel },
    })
  },

  /**
   * 5. Envia e-mail de convite/aprovação de convidado com link único de confirmação
   */
  async sendApprovalEmail(input: SendApprovalEmailInput) {
    const {
      to,
      guestName,
      eventTitle,
      eventDate,
      eventTime,
      eventLocation,
      confirmationToken,
      confirmationDeadline,
      approvedCompanions,
      rejectedCompanions,
    } = input

    const baseUrl = getAppBaseUrl()
    const confirmUrl = `${baseUrl}/confirm/${encodeURIComponent(confirmationToken)}`

    const safeGuestName = escapeHtml(guestName)
    const safeEventTitle = escapeHtml(eventTitle)
    const safeEventDate = escapeHtml(eventDate)
    const safeEventTime = escapeHtml(eventTime)
    const safeEventLocation = escapeHtml(eventLocation)
    const safeDeadline = escapeHtml(confirmationDeadline)
    const safeConfirmUrl = escapeHtml(confirmUrl)

    const companionsSection =
      approvedCompanions.length > 0 || rejectedCompanions.length > 0
        ? `
        <div style="margin: 24px 0; padding: 16px; background-color: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">Acompanhantes</h3>
          ${
            approvedCompanions.length > 0
              ? `
            <p style="margin: 8px 0; color: #059669; font-weight: 500;">Aprovados:</p>
            <ul style="margin: 4px 0 12px 0; padding-left: 20px; color: #4a5568;">
              ${approvedCompanions.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
            </ul>
          `
              : ""
          }
          ${
            rejectedCompanions.length > 0
              ? `
            <p style="margin: 8px 0; color: #dc2626; font-weight: 500;">Não aprovados:</p>
            <ul style="margin: 4px 0; padding-left: 20px; color: #4a5568;">
              ${rejectedCompanions.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
            </ul>
          `
              : ""
          }
        </div>
      `
        : ""

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite - ${safeEventTitle}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Você foi convidado!</h1>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px; margin-top: 0;">Olá, <strong>${safeGuestName}</strong>!</p>
            <p>Confira os detalhes do evento e registre sua confirmação de presença:</p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px;">${safeEventTitle}</h2>
              <p style="margin: 8px 0; color: #4a5568;"><strong>Data:</strong> ${safeEventDate}</p>
              <p style="margin: 8px 0; color: #4a5568;"><strong>Horário:</strong> ${safeEventTime}</p>
              <p style="margin: 8px 0; color: #4a5568;"><strong>Local:</strong> ${safeEventLocation}</p>
            </div>
            ${companionsSection}
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                Por favor, responda até ${safeDeadline}
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${safeConfirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmar Presença
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Ou acesse o link: <a href="${safeConfirmUrl}" style="color: #2563eb;">${safeConfirmUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to,
      subject: `Convite - ${eventTitle.replace(/[\r\n]/g, " ")}`,
      template: "guest_approval_invite",
      html,
    })
  },

  /**
   * 6. Envia e-mail de rejeição de solicitação externa
   */
  async sendRejectionEmail(input: SendRejectionEmailInput) {
    const { to, guestName, eventTitle, reason } = input
    const safeGuestName = escapeHtml(guestName)
    const safeEventTitle = escapeHtml(eventTitle)
    const safeReason = reason ? escapeHtml(reason) : ""

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Atualização sobre sua solicitação - ${safeEventTitle}</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h1 style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 24px;">Atualização sobre sua solicitação</h1>
            <p style="font-size: 16px;">Olá, <strong>${safeGuestName}</strong>,</p>
            <p>Agradecemos seu interesse em participar do evento <strong>${safeEventTitle}</strong>.</p>
            <p>Infelizmente, não foi possível aprovar sua solicitação desta vez.</p>
            ${
              safeReason
                ? `<div style="background-color: #fff; border-left: 4px solid #94a3b8; padding: 16px; margin: 24px 0;"><p style="margin: 0; color: #4a5568;"><strong>Motivo:</strong> ${safeReason}</p></div>`
                : ""
            }
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to,
      subject: `Atualização sobre sua solicitação - ${eventTitle.replace(/[\r\n]/g, " ")}`,
      template: "guest_rejection",
      html,
    })
  },

  /**
   * 7. Envia lembrete de confirmação para convidados pendentes (RN-017, RF-030)
   */
  async sendConfirmationReminder(input: SendConfirmationReminderInput) {
    const { to, guestName, eventTitle, confirmationToken, confirmationDeadline } = input
    const baseUrl = getAppBaseUrl()
    const confirmUrl = `${baseUrl}/confirm/${encodeURIComponent(confirmationToken)}`

    const safeGuestName = escapeHtml(guestName)
    const safeEventTitle = escapeHtml(eventTitle)
    const safeDeadline = escapeHtml(confirmationDeadline)
    const safeConfirmUrl = escapeHtml(confirmUrl)

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Lembrete - Confirme sua presença</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef3c7; padding: 32px; border-radius: 12px; border: 1px solid #f59e0b;">
            <h1 style="color: #92400e; margin: 0 0 24px 0; font-size: 24px;">Lembrete: Confirme sua presença!</h1>
            <p style="font-size: 16px;">Olá, <strong>${safeGuestName}</strong>,</p>
            <p>Você ainda não confirmou sua presença no evento <strong>${safeEventTitle}</strong>.</p>
            <p style="color: #dc2626; font-weight: 500;">O prazo para confirmação é ${safeDeadline}.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${safeConfirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmar Agora
              </a>
            </div>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to,
      subject: `Lembrete: Confirme sua presença - ${eventTitle.replace(/[\r\n]/g, " ")}`,
      template: "rsvp_reminder",
      html,
    })
  },

  /**
   * 8. Comunicados e notificações do evento
   */
  async sendEventAnnouncementEmail(input: SendEventAnnouncementInput) {
    const safeRecipient = escapeHtml(input.recipientName)
    const safeEvent = escapeHtml(input.eventTitle)
    const safeMessage = escapeHtml(input.message)

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>${escapeHtml(input.subject)}</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="margin-top: 0; color: #1e293b;">Comunicado: ${safeEvent}</h2>
            <p>Olá, <strong>${safeRecipient}</strong>,</p>
            <p style="white-space: pre-line;">${safeMessage}</p>
          </div>
        </body>
      </html>
    `

    return dispatchTransactionalEmail({
      to: input.to,
      subject: `${input.eventTitle} — ${input.subject}`,
      template: "event_announcement",
      html,
    })
  },
}
