import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

export type StorageBucket = "event-photos" | "avatars" | "documents" | "attachments"

const ALLOWED_Buckets: StorageBucket[] = ["event-photos", "avatars", "documents", "attachments"]

const ALLOWED_MIME_TYPES: Record<StorageBucket, string[]> = {
  "event-photos": ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  avatars: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  documents: ["application/pdf", "text/csv", "text/plain", "application/json"],
  attachments: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/csv",
    "text/plain",
  ],
}

const MAX_SIZE_BYTES: Record<StorageBucket, number> = {
  "event-photos": 5 * 1024 * 1024, // 5 MB (RF-028)
  avatars: 2 * 1024 * 1024, // 2 MB
  documents: 10 * 1024 * 1024, // 10 MB
  attachments: 10 * 1024 * 1024, // 10 MB
}

export function getStorageRootDir(): string {
  return process.env.STORAGE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads")
}

export function sanitizeFilename(rawName: string): string {
  const base = path.basename(String(rawName || "file")).replace(/[^a-zA-Z0-9._-]/g, "_")
  return base.slice(0, 120) || "file.bin"
}

export interface SaveFileInput {
  bucket: StorageBucket
  filename: string
  content: Buffer | string // Buffer binário ou Data URL (data:image/png;base64,...)
  mimeType?: string
  eventId?: string
  userId?: string
}

export interface SavedFileRecord {
  id: string
  bucket: StorageBucket
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  publicUrl: string
  checksumSha256: string
}

/**
 * Salva um arquivo no volume persistente local com validação de tipo MIME,
 * tamanho máximo, proteção contra Path Traversal e cálculo de hash SHA-256 (Seção 10).
 */
export function saveFileToLocalStorage(input: SaveFileInput): SavedFileRecord {
  const { bucket, filename, content } = input

  if (!ALLOWED_Buckets.includes(bucket)) {
    throw new Error(`Bucket de armazenamento inválido: ${bucket}`)
  }

  let buffer: Buffer
  let detectedMime = input.mimeType || "application/octet-stream"

  if (typeof content === "string") {
    const dataUrlMatch = content.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/)
    if (dataUrlMatch) {
      detectedMime = dataUrlMatch[1].toLowerCase()
      buffer = Buffer.from(dataUrlMatch[2], "base64")
    } else if (content.startsWith("http://") || content.startsWith("https://") || content.startsWith("/")) {
      // Caso seja uma URL externa ou caminho estático já existente, preserva referência
      const id = crypto.randomUUID()
      const safeOriginal = sanitizeFilename(filename)
      return {
        id,
        bucket,
        filename: safeOriginal,
        originalName: filename,
        mimeType: input.mimeType || "image/jpeg",
        sizeBytes: Buffer.byteLength(content),
        storagePath: content,
        publicUrl: content,
        checksumSha256: crypto.createHash("sha256").update(content).digest("hex"),
      }
    } else {
      buffer = Buffer.from(content, "base64")
    }
  } else {
    buffer = content
  }

  const allowedMimes = ALLOWED_MIME_TYPES[bucket]
  if (!allowedMimes.includes(detectedMime.toLowerCase())) {
    throw new Error(`Tipo de arquivo não permitido (${detectedMime}) para o bucket ${bucket}.`)
  }

  const maxSize = MAX_SIZE_BYTES[bucket]
  if (buffer.length > maxSize) {
    throw new Error(
      `O arquivo excede o tamanho máximo permitido de ${Math.round(maxSize / (1024 * 1024))} MB.`
    )
  }

  const id = crypto.randomUUID()
  const safeOriginal = sanitizeFilename(filename)
  const storedFilename = `${id}-${safeOriginal}`
  const bucketDir = path.join(getStorageRootDir(), bucket)

  fs.mkdirSync(bucketDir, { recursive: true })
  const fullPath = path.join(bucketDir, storedFilename)
  fs.writeFileSync(fullPath, buffer)

  const checksumSha256 = crypto.createHash("sha256").update(buffer).digest("hex")
  const publicUrl = `/api/storage/${bucket}/${encodeURIComponent(storedFilename)}`

  return {
    id,
    bucket,
    filename: storedFilename,
    originalName: filename,
    mimeType: detectedMime,
    sizeBytes: buffer.length,
    storagePath: fullPath,
    publicUrl,
    checksumSha256,
  }
}

/**
 * Lê um arquivo do armazenamento local com proteção estrita contra Path Traversal.
 */
export function readFileFromLocalStorage(bucket: string, filename: string): {
  buffer: Buffer
  mimeType: string
  fullPath: string
} | null {
  if (!ALLOWED_Buckets.includes(bucket as StorageBucket)) {
    return null
  }

  const safeFile = path.basename(filename)
  const bucketDir = path.resolve(getStorageRootDir(), bucket)
  const fullPath = path.resolve(bucketDir, safeFile)

  if (!fullPath.startsWith(bucketDir) || !fs.existsSync(fullPath)) {
    return null
  }

  const ext = path.extname(safeFile).toLowerCase()
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".csv": "text/csv",
    ".txt": "text/plain",
  }

  return {
    buffer: fs.readFileSync(fullPath),
    mimeType: mimeMap[ext] || "application/octet-stream",
    fullPath,
  }
}

/**
 * Remove um arquivo do armazenamento local.
 */
export function deleteFileFromLocalStorage(bucket: string, filenameOrUrl: string): boolean {
  if (!ALLOWED_Buckets.includes(bucket as StorageBucket)) {
    return false
  }

  const extractedName = filenameOrUrl.includes("/api/storage/")
    ? decodeURIComponent(filenameOrUrl.split("/").pop() || "")
    : path.basename(filenameOrUrl)

  if (!extractedName) return false

  const bucketDir = path.resolve(getStorageRootDir(), bucket)
  const fullPath = path.resolve(bucketDir, path.basename(extractedName))

  if (fullPath.startsWith(bucketDir) && fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
    return true
  }
  return false
}
