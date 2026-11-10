/**
 * Serviço de e-mail transacional usando Resend (RF-030, RN-017, RNF-004).
 * Todos os campos dinâmicos são sanitizados com escapeHtml contra XSS/HTML injection.
 */

import { escapeHtml } from "../../lib/domain/business-rules.ts"
import { Resend } from "resend"

const fromEmail = process.env.RESEND_FROM_EMAIL || "Planeja+ <onboarding@resend.dev>"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
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

export const EmailService = {
  /**
   * Envia e-mail de convite/aprovação com link único de confirmação
   */
  async sendApprovalEmail(input: SendApprovalEmailInput): Promise<{ success: boolean; error?: string; id?: string }> {
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const confirmUrl = `${baseUrl}/confirm/${encodeURIComponent(confirmationToken)}`

    const resend = getResendClient()
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

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
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este é um e-mail automático enviado pelo Planeja+. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `Convite - ${eventTitle.replace(/[\r\n]/g, " ")}`,
        html,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  },

  /**
   * Envia e-mail de rejeição de solicitação externa
   */
  async sendRejectionEmail(input: SendRejectionEmailInput): Promise<{ success: boolean; error?: string; id?: string }> {
    const { to, guestName, eventTitle, reason } = input

    const resend = getResendClient()
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

    const safeGuestName = escapeHtml(guestName)
    const safeEventTitle = escapeHtml(eventTitle)
    const safeReason = reason ? escapeHtml(reason) : ""

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Atualização sobre sua solicitação - ${safeEventTitle}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h1 style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 24px;">Atualização sobre sua solicitação</h1>
            
            <p style="font-size: 16px;">Olá, <strong>${safeGuestName}</strong>,</p>
            
            <p>Agradecemos seu interesse em participar do evento <strong>${safeEventTitle}</strong>.</p>
            
            <p>Infelizmente, não foi possível aprovar sua solicitação desta vez.</p>
            
            ${
              safeReason
                ? `
              <div style="background-color: #fff; border-left: 4px solid #94a3b8; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #4a5568;"><strong>Motivo:</strong> ${safeReason}</p>
              </div>
            `
                : ""
            }
            
            <p>Se você tiver dúvidas, entre em contato com o organizador do evento.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este é um e-mail automático enviado pelo Planeja+. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `Atualização sobre sua solicitação - ${eventTitle.replace(/[\r\n]/g, " ")}`,
        html,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  },

  /**
   * Envia lembrete de confirmação para convidados pendentes (RN-017, RF-030)
   */
  async sendConfirmationReminder(
    input: SendConfirmationReminderInput
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    const { to, guestName, eventTitle, confirmationToken, confirmationDeadline } = input

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const confirmUrl = `${baseUrl}/confirm/${encodeURIComponent(confirmationToken)}`

    const resend = getResendClient()
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

    const safeGuestName = escapeHtml(guestName)
    const safeEventTitle = escapeHtml(eventTitle)
    const safeDeadline = escapeHtml(confirmationDeadline)
    const safeConfirmUrl = escapeHtml(confirmUrl)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete - Confirme sua presença</title>
        </head>
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
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este é um e-mail automático enviado pelo Planeja+. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `Lembrete: Confirme sua presença - ${eventTitle.replace(/[\r\n]/g, " ")}`,
        html,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  },
}
