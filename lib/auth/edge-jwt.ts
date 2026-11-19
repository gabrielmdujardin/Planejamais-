/**
 * Verificador JWT HMAC-SHA256 100% compatível com Edge Runtime e Node.js
 * utilizando exclusivamente Web Crypto API (globalThis.crypto.subtle) sem depender de 'node:crypto'.
 */

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function decodeBase64UrlJson(base64Url: string): any {
  const bytes = base64UrlToUint8Array(base64Url)
  const text = new TextDecoder().decode(bytes)
  return JSON.parse(text)
}

export async function verifySessionJwtEdge(
  token: string | undefined | null,
  secret = process.env.AUTH_SECRET || "planeja-plus-local-jwt-hmac-secret-2026-tcc-key"
): Promise<{
  valid: boolean
  payload?: {
    sessionId: string
    userId: string
    email: string
    name: string
    exp: number
  }
}> {
  if (!token || typeof token !== "string") return { valid: false }
  const parts = token.split(".")
  if (parts.length !== 3) return { valid: false }

  try {
    const [header, body, sig] = parts
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )

    const signatureBytes = base64UrlToUint8Array(sig)
    const dataBytes = encoder.encode(`${header}.${body}`)
    const isValidSig = await globalThis.crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes as BufferSource,
      dataBytes
    )

    if (!isValidSig) {
      return { valid: false }
    }

    const payload = decodeBase64UrlJson(body)
    if (!payload || typeof payload.exp !== "number" || Date.now() >= payload.exp) {
      return { valid: false }
    }

    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}
