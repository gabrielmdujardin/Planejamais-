/**
 * Serviço de email usando Resend
 */

import { Resend } from "resend"

const fromEmail = process.env.RESEND_FROM_EMAIL || "Planeja+ <onboarding@resend.dev>"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

interface SendApprovalEmailInput {
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

interface SendRejectionEmailInput {
  to: string
  guestName: string
  eventTitle: string
  reason?: string
}

interface SendConfirmationReminderInput {
  to: string
  guestName: string
  eventTitle: string
  confirmationToken: string
  confirmationDeadline: string
}

export const EmailService = {
  /**
   * Envia email de aprovação com link de confirmação
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
    const confirmUrl = `${baseUrl}/confirm/${confirmationToken}`

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

    const resend = getResendClient()
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

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
              ${approvedCompanions.map((name) => `<li>${name}</li>`).join("")}
            </ul>
          `
              : ""
          }
          ${
            rejectedCompanions.length > 0
              ? `
            <p style="margin: 8px 0; color: #dc2626; font-weight: 500;">Não aprovados:</p>
            <ul style="margin: 4px 0; padding-left: 20px; color: #4a5568;">
              ${rejectedCompanions.map((name) => `<li>${name}</li>`).join("")}
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
          <title>Convite Aprovado - ${eventTitle}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Convite Aprovado!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px; margin-top: 0;">Olá, <strong>${guestName}</strong>!</p>
            
            <p>Sua solicitação para participar do evento foi aprovada. Estamos muito felizes em tê-lo(a) conosco!</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px;">${eventTitle}</h2>
              <p style="margin: 8px 0; color: #4a5568;"><strong>Data:</strong> ${eventDate}</p>
              <p style="margin: 8px 0; color: #4a5568;"><strong>Horário:</strong> ${eventTime}</p>
              <p style="margin: 8px 0; color: #4a5568;"><strong>Local:</strong> ${eventLocation}</p>
            </div>
            
            ${companionsSection}
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 500;">
                Por favor, confirme sua presença até ${confirmationDeadline}
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmar Presença
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Ou acesse o link: <a href="${confirmUrl}" style="color: #667eea;">${confirmUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este é um email automático enviado pelo Planeja+. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `Convite Aprovado - ${eventTitle}`,
        html,
      })

      if (error) {
        console.error("Erro ao enviar email de aprovação:", error)
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  },

  /**
   * Envia email de rejeição
   */
  async sendRejectionEmail(input: SendRejectionEmailInput): Promise<{ success: boolean; error?: string; id?: string }> {
    const { to, guestName, eventTitle, reason } = input

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

    const resend = getResendClient()
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Atualização sobre sua solicitação - ${eventTitle}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h1 style="color: #1a1a1a; margin: 0 0 24px 0; font-size: 24px;">Atualização sobre sua solicitação</h1>
            
            <p style="font-size: 16px;">Olá, <strong>${guestName}</strong>,</p>
            
            <p>Agradecemos seu interesse em participar do evento <strong>${eventTitle}</strong>.</p>
            
            <p>Infelizmente, não foi possível aprovar sua solicitação desta vez.</p>
            
            ${
              reason
                ? `
              <div style="background-color: #fff; border-left: 4px solid #94a3b8; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #4a5568;"><strong>Motivo:</strong> ${reason}</p>
              </div>
            `
                : ""
            }
            
            <p>Se você tiver dúvidas, entre em contato com o organizador do evento.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este é um email automático enviado pelo Planeja+. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `Atualização sobre sua solicitação - ${eventTitle}`,
        html,
      })

      if (error) {
        console.error("Erro ao enviar email de rejeição:", error)
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  },

  /**
   * Envia lembrete de confirmação
   */
  async sendConfirmationReminder(
    input: SendConfirmationReminderInput
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    const { to, guestName, eventTitle, confirmationToken, confirmationDeadline } = input

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const confirmUrl = `${baseUrl}/confirm/${confirmationToken}`

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

    const resend = getResendClient()
    if (!resend) {
      return { success: false, error: "RESEND_API_KEY não configurada no servidor" }
    }

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
            
            <p style="font-size: 16px;">Olá, <strong>${guestName}</strong>,</p>
            
            <p>Você ainda não confirmou sua presença no evento <strong>${eventTitle}</strong>.</p>
            
            <p style="color: #dc2626; font-weight: 500;">O prazo para confirmação é ${confirmationDeadline}.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmar Agora
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este é um email automático enviado pelo Planeja+. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `Lembrete: Confirme sua presença - ${eventTitle}`,
        html,
      })

      if (error) {
        console.error("Erro ao enviar lembrete:", error)
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  },
}
