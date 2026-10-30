/**
 * Motor de exportação de PDF documental — Planeja+
 * Utiliza Paged Media CSS A4 em ambiente isolado (iframe) para garantir
 * saída vetorial nítida a 300 DPI, zero poluição de URLs do navegador e
 * nome de arquivo sugerido padronizado.
 */

export function generatePdfFileName(reportType: string, eventTitle?: string): string {
  const dateStr = new Date().toISOString().slice(0, 10)
  const cleanType = reportType
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/__+/g, "_")
    .toLowerCase()

  const cleanEvent = eventTitle
    ? `_${eventTitle
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 24)}`
    : ""

  return `PlanejaMais_${cleanType}${cleanEvent}_${dateStr}`
}

/**
 * Imprime o HTML do documento formatado para A4 em um iframe limpo e isolado
 */
export async function printIsolatedDocument(
  containerElement: HTMLElement,
  documentTitle: string,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      // 1. Criar iframe oculto
      const iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      iframe.style.visibility = "hidden"
      iframe.setAttribute("aria-hidden", "true")

      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc || !iframe.contentWindow) {
        document.body.removeChild(iframe)
        resolve({ success: false, error: "Não foi possível inicializar o motor de impressão." })
        return
      }

      // 2. Extrair estilos da aplicação principal
      const styleSheets = Array.from(document.styleSheets)
      let aggregatedStyles = ""

      styleSheets.forEach((sheet) => {
        try {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach((rule) => {
              aggregatedStyles += rule.cssText + "\n"
            })
          }
        } catch {
          // Ignorar folhas de estilo de domínios cruzados
        }
      })

      // 3. Montar CSS específico para impressão A4 de alta fidelidade
      const pagedMediaCss = `
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 12mm 12mm;
        }

        @page :left {
          margin: 10mm 12mm 12mm 12mm;
        }

        @page :right {
          margin: 10mm 12mm 12mm 12mm;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          font-size: 11pt !important;
          line-height: 1.45 !important;
        }

        .report-page-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .report-a4-sheet {
          width: 100% !important;
          min-height: auto !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 0 16mm 0 !important;
          page-break-after: always !important;
          break-after: page !important;
        }

        .report-a4-sheet:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
          margin-bottom: 0 !important;
        }

        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .avoid-break-after {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
        }

        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        thead {
          display: table-header-group !important;
        }

        tfoot {
          display: table-footer-group !important;
        }

        .no-print {
          display: none !important;
        }
      `

      // 4. Inserir estrutura no iframe
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${documentTitle}</title>
            <style>
              ${aggregatedStyles}
              ${pagedMediaCss}
            </style>
          </head>
          <body>
            ${containerElement.outerHTML}
          </body>
        </html>
      `)
      iframeDoc.close()

      // 5. Acionar impressão após carregamento dos recursos
      const triggerPrint = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            resolve({ success: true })
          } catch (err: any) {
            resolve({ success: false, error: err?.message || "Falha ao invocar diálogo de impressão." })
          } finally {
            // Remover iframe após o diálogo fechar
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe)
              }
            }, 1000)
          }
        }, 350)
      }

      if (iframeDoc.readyState === "complete") {
        triggerPrint()
      } else {
        iframe.onload = triggerPrint
      }
    } catch (e: any) {
      resolve({ success: false, error: e?.message || "Erro inesperado ao gerar documento." })
    }
  })
}
