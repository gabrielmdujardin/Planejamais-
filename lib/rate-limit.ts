/**
 * Utility de Rate Limiting por IP para rotas públicas da aplicação.
 * Utiliza janela de tempo deslizante em memória (resiliente e de alta performance).
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const ipMap = new Map<string, RateLimitRecord>()

// Limpeza periódica de IPs inativos a cada 5 minutos para evitar vazamento de memória
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    ipMap.forEach((record, ip) => {
      if (now > record.resetTime) {
        ipMap.delete(ip)
      }
    })
  }, 5 * 60 * 1000)
}

export function checkRateLimit(
  ip: string,
  limit = 10,
  windowMs = 60 * 1000
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = ipMap.get(ip)

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    ipMap.set(ip, newRecord)
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: newRecord.resetTime,
    }
  }

  record.count += 1
  ipMap.set(ip, record)

  if (record.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  }
}
