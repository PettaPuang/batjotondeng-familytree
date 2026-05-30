import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

import { forbiddenResponse, requireApiSession } from "@/lib/api/unauthorized"
import { ManageForbiddenError } from "@/lib/auth/errors"
import {
  buildPersonPhotoPath,
  resolvePersonPhotoContentType,
  validatePersonPhotoFile,
} from "@/lib/blob/person-photo"

export async function POST(request: Request) {
  const { response, actor } = await requireApiSession()
  if (response) {
    return response
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "File foto wajib dipilih." }, { status: 400 })
    }

    validatePersonPhotoFile(file)

    const blob = await put(buildPersonPhotoPath(actor.personId, file.name), file, {
      access: "private",
      addRandomSuffix: true,
      contentType: resolvePersonPhotoContentType(file),
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    if (error instanceof ManageForbiddenError) {
      return forbiddenResponse(error.message)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengunggah foto." },
      { status: 400 },
    )
  }
}
