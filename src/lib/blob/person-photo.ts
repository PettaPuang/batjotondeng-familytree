import { del } from "@vercel/blob"

export const PERSON_PHOTO_MAX_BYTES = 5 * 1024 * 1024

export const PERSON_PHOTO_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export function isVercelBlobUrl(url: string) {
  return url.includes(".blob.vercel-storage.com")
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

export function buildPersonPhotoPath(actorPersonId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.-]+/g, "-").slice(0, 80)

  return `person-photos/${actorPersonId}/${Date.now()}-${safeName || "photo"}`
}

export function getPersonPhotoSrc(photoUrl: string | null | undefined) {
  if (!photoUrl) {
    return null
  }

  if (isVercelBlobUrl(photoUrl)) {
    return `/api/silsilah/person/photo/view?url=${encodeURIComponent(photoUrl)}`
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
