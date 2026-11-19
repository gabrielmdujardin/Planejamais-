import { readFileFromLocalStorage } from "@/lib/storage/local-storage"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ bucket: string; filename: string }> }
) {
  const { bucket, filename } = await context.params
  const result = readFileFromLocalStorage(bucket, decodeURIComponent(filename))

  if (!result) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
      "Content-Length": String(result.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
