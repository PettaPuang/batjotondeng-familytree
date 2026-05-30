import { get } from "@vercel/blob"
import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/api/unauthorized"
import { isVercelBlobUrl } from "@/lib/blob/person-photo"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { response } = await requireApiSession()
  if (response) {
    return response
  }

  const url = new URL(request.url).searchParams.get("url")

  if (!url || !isVercelBlobUrl(url)) {
    return NextResponse.json({ error: "URL foto tidak valid." }, { status: 400 })
  }

  const owner = await prisma.person.findFirst({
    where: { photoUrl: url },
    select: { id: true },
  })

  if (!owner) {
    return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 })
  }

  const result = await get(url, { access: "private" })

  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 })
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
