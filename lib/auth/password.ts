import crypto from "node:crypto"

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
}

/**
 * Gera hash criptográfico seguro de senha no formato PHC ($scrypt$N=16384,r=8,p=1$salt$hash).
 * Nunca armazena senhas em texto puro (Seção 7 e RNF-004).
 */
export function hashPassword(plainPassword: string): string {
  if (!plainPassword || plainPassword.length < 6) {
    throw new Error("A senha deve ter no mínimo 6 caracteres.")
  }

  const salt = crypto.randomBytes(16)
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  })

  return `$scrypt$n=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${salt.toString("base64")}$${derivedKey.toString("base64")}`
}

/**
 * Verifica senha contra hash armazenado usando comparação em tempo constante (timingSafeEqual).
 */
export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash || !storedHash.startsWith("$scrypt$")) {
    return false
  }

  try {
    const parts = storedHash.split("$")
    // parts: ["", "scrypt", "n=16384,r=8,p=1", saltB64, hashB64]
    if (parts.length !== 5) return false

    const paramPairs = parts[2].split(",")
    const params: Record<string, number> = {}
    for (const pair of paramPairs) {
      const [k, v] = pair.split("=")
      params[k] = Number(v)
    }

    const salt = Buffer.from(parts[3], "base64")
    const expectedHash = Buffer.from(parts[4], "base64")
    const derivedKey = crypto.scryptSync(plainPassword, salt, expectedHash.length, {
      N: params.n || SCRYPT_PARAMS.N,
      r: params.r || SCRYPT_PARAMS.r,
      p: params.p || SCRYPT_PARAMS.p,
    })

    if (derivedKey.length !== expectedHash.length) return false
    return crypto.timingSafeEqual(derivedKey, expectedHash)
  } catch {
    return false
  }
}

/**
 * Gera hash SHA-256 determinístico para armazenar tokens de sessão/recuperação no banco
 * sem persistir o token bruto.
 */
export function hashTokenSha256(rawToken: string): string {
  return crypto.createHash("sha256").update(String(rawToken)).digest("hex")
}

/**
 * Gera token aleatório criptograficamente seguro (CSPRNG >= 256 bits).
 */
export function generateAuthToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex")
}

/**
 * Assina um payload de sessão com HMAC-SHA256 para validação rápida em Middleware e API.
 */
export function signSessionJwt(
  payload: {
    sessionId: string
    userId: string
    email: string
    name: string
    exp: number
  },
  secret = process.env.AUTH_SECRET || "planeja-plus-local-jwt-hmac-secret-2026-tcc-key"
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url")
  return `${header}.${body}.${signature}`
}

/**
 * Verifica e decodifica token de sessão HMAC-SHA256.
 */
export function verifySessionJwt(
  token: string | undefined | null,
  secret = process.env.AUTH_SECRET || "planeja-plus-local-jwt-hmac-secret-2026-tcc-key"
): {
  valid: boolean
  payload?: {
    sessionId: string
    userId: string
    email: string
    name: string
    exp: number
  }
} {
  if (!token || typeof token !== "string") return { valid: false }
  const parts = token.split(".")
  if (parts.length !== 3) return { valid: false }

  try {
    const [header, body, sig] = parts
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url")

    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false }
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    if (!payload || typeof payload.exp !== "number" || Date.now() >= payload.exp) {
      return { valid: false }
    }

    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}
