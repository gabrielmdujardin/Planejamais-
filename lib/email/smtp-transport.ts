import net from "node:net"
import nodemailer from "nodemailer"
import { pgQuery } from "../db/postgres.ts"

export interface DispatchEmailInput {
  to: string
  subject: string
  template: string
  html: string
  metadata?: Record<string, any>
}

export interface DispatchEmailResult {
  success: boolean
  id?: string
  status: "sent" | "captured_mailpit" | "queued" | "failed"
  isExternalDelivery: boolean
  provider: "smtp-external" | "mailpit-local" | "outbox-queue"
  error?: string
}

function checkTcpPort(host: string, port: number, timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once("connect", () => finish(true))
    socket.once("timeout", () => finish(false))
    socket.once("error", () => finish(false))
    socket.connect(port, host)
  })
}

export function isMailpitHost(host: string, port: number): boolean {
  const lower = (host || "").toLowerCase()
  return lower === "mailpit" || lower === "localhost" || lower === "127.0.0.1" || port === 1025
}

/**
 * Envia e-mail via Nodemailer (SMTP real ou Mailpit local) e registra auditoria em public.email_outbox.
 * Distingue estritamente captura em Mailpit (isExternalDelivery = false) de entrega externa real.
 */
export async function dispatchTransactionalEmail(
  input: DispatchEmailInput
): Promise<DispatchEmailResult> {
  const smtpHost = process.env.SMTP_HOST || "127.0.0.1"
  const smtpPort = Number(process.env.SMTP_PORT || 1025)
  const smtpUser = process.env.SMTP_USER || ""
  const smtpPass = process.env.SMTP_PASS || ""
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465
  const mailFrom =
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "Planeja+ <nao-responda@planeja.local>"

  const mailpitMode = isMailpitHost(smtpHost, smtpPort) && !smtpUser
  const provider = mailpitMode ? "mailpit-local" : "smtp-external"
  const isExternalDelivery = !mailpitMode && Boolean(smtpHost && smtpUser && smtpPass)

  let outboxId: string | undefined
  try {
    const inserted = await pgQuery<{ id: string }>(
      `INSERT INTO public.email_outbox (
        to_email, subject, template, html_body, status, provider, is_external_delivery, metadata
      ) VALUES ($1, $2, $3, $4, 'queued', $5, $6, $7)
      RETURNING id`,
      [
        input.to,
        input.subject,
        input.template,
        input.html,
        provider,
        isExternalDelivery,
        JSON.stringify(input.metadata || {}),
      ]
    )
    outboxId = inserted.rows[0]?.id
  } catch {
    // Caso a tabela ainda esteja sendo inicializada
  }

  const reachable = await checkTcpPort(smtpHost, smtpPort)
  if (!reachable) {
    const reason = mailpitMode
      ? `Servidor Mailpit local (${smtpHost}:${smtpPort}) não está ativo no momento; e-mail enfileirado em public.email_outbox para reprocessamento.`
      : `Servidor SMTP externo (${smtpHost}:${smtpPort}) inacessível.`

    if (outboxId) {
      await pgQuery(
        `UPDATE public.email_outbox
            SET status = 'queued',
                error_message = $2
          WHERE id = $1`,
        [outboxId, reason]
      ).catch(() => {})
    }

    return {
      success: false,
      id: outboxId,
      status: "queued",
      isExternalDelivery: false,
      provider: "outbox-queue",
      error: reason,
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      ...(smtpUser
        ? {
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          }
        : {}),
      tls: {
        rejectUnauthorized: !mailpitMode,
      },
    })

    const info = await transporter.sendMail({
      from: mailFrom,
      to: input.to,
      subject: input.subject.replace(/[\r\n]/g, " "),
      html: input.html,
    })

    const finalStatus = mailpitMode ? "captured_mailpit" : "sent"

    if (outboxId) {
      await pgQuery(
        `UPDATE public.email_outbox
            SET status = $2,
                message_id = $3,
                sent_at = now(),
                error_message = NULL
          WHERE id = $1`,
        [outboxId, finalStatus, info.messageId || null]
      ).catch(() => {})
    }

    return {
      success: true,
      id: info.messageId || outboxId,
      status: finalStatus,
      isExternalDelivery,
      provider,
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    if (outboxId) {
      await pgQuery(
        `UPDATE public.email_outbox
            SET status = 'failed',
                retry_count = retry_count + 1,
                error_message = $2
          WHERE id = $1`,
        [outboxId, errorMessage]
      ).catch(() => {})
    }

    return {
      success: false,
      id: outboxId,
      status: "failed",
      isExternalDelivery: false,
      provider,
      error: errorMessage,
    }
  }
}

/**
 * Reprocessa e-mails enfileirados ou com falha temporária em public.email_outbox.
 */
export async function retryQueuedEmails(limit = 25): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const pending = await pgQuery<{
    id: string
    to_email: string
    subject: string
    template: string
    html_body: string
    metadata: any
  }>(
    `SELECT id, to_email, subject, template, html_body, metadata
       FROM public.email_outbox
      WHERE status IN ('queued', 'failed')
        AND retry_count < 3
      ORDER BY created_at ASC
      LIMIT $1`,
    [limit]
  )

  let succeeded = 0
  let failed = 0

  for (const row of pending.rows) {
    const res = await dispatchTransactionalEmail({
      to: row.to_email,
      subject: row.subject,
      template: row.template,
      html: row.html_body,
      metadata: typeof row.metadata === "object" ? row.metadata : {},
    })
    if (res.success) {
      succeeded++
      await pgQuery(`DELETE FROM public.email_outbox WHERE id = $1`, [row.id]).catch(() => {})
    } else {
      failed++
    }
  }

  return {
    processed: pending.rows.length,
    succeeded,
    failed,
  }
}
