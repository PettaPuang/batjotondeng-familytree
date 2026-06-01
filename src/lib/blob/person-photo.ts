import { del } from "@vercel/blob"

export const PERSON_PHOTO_MAX_BYTES = 5 * 1024 * 1024

export const PERSON_PHOTO_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export function isVercelBlobUrl(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname.endsWith(".blob.vercel-storage.com")
  } catch {
    return false
  }
}

function inferImageContentType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
    default:
      return null
  }
}

export function resolvePersonPhotoContentType(file: File) {
  if (PERSON_PHOTO_ALLOWED_TYPES.has(file.type)) {
    return file.type
  }

  const inferred = inferImageContentType(file.name)

  if (inferred && PERSON_PHOTO_ALLOWED_TYPES.has(inferred)) {
    return inferred
  }

  return file.type
}

export function validatePersonPhotoFile(file: File) {
  const contentType = resolvePersonPhotoContentType(file)

  if (!PERSON_PHOTO_ALLOWED_TYPES.has(contentType)) {
    throw new Error("Format foto harus JPG, PNG, atau WebP.")
  }

  if (file.size > PERSON_PHOTO_MAX_BYTES) {
    throw new Error("Ukuran foto maksimal 5 MB.")
  }
}

/** Verifikasi isi file lewat magic bytes, bukan hanya MIME/ekstensi yang bisa dipalsukan. */
export async function assertPersonPhotoSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())

  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
  const isPng =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  const isWebp =
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error("Isi file bukan gambar JPG, PNG, atau WebP yang valid.")
  }
}

export function buildPersonPhotoPath(actorPersonId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.-]+/g, "-").slice(0, 80)

  return `person-photos/${actorPersonId}/${Date.now()}-${safeName || "photo"}`
}

export function getPersonPhotoSrc(photoUrl: string | null | undefined) {
  if (!photoUrl) {
    return null
  }

  if (isVercelBlobUrl(photoUrl)) {
    return `/api/photo?url=${encodeURIComponent(photoUrl)}`
  }

  return photoUrl
}

export async function deleteStoredPersonPhoto(url: string | null | undefined) {
  if (!url || !isVercelBlobUrl(url)) {
    return
  }

  try {
    await del(url)
  } catch {
    // Foto lama mungkin sudah dihapus; abaikan.
  }
}
