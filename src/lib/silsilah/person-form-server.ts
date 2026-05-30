import type { Gender } from "@prisma/client"

import { parseDateInput } from "@/lib/silsilah/format"

export function readPersonFormData(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim()
  const nickname = String(formData.get("nickname") ?? "").trim()
  const gender = String(formData.get("gender") ?? "") as Gender
  const birthPlace = String(formData.get("birthPlace") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const isDeceased = formData.get("isDeceased") === "on"
  const isAlive = !isDeceased
  const birthDate = parseDateInput(String(formData.get("birthDate") ?? ""))
  const deathDate = parseDateInput(String(formData.get("deathDate") ?? ""))
  const photoUrl = String(formData.get("photoUrl") ?? "").trim()

  if (!fullName || (gender !== "MALE" && gender !== "FEMALE")) {
    throw new Error("Nama lengkap dan jenis kelamin wajib diisi.")
  }

  return {
    fullName,
    nickname: nickname || null,
    gender,
    birthDate,
    birthPlace: birthPlace || null,
    phone: phone || null,
    address: address || null,
    notes: notes || null,
    photoUrl: photoUrl || null,
    isAlive,
    deathDate: isAlive ? null : deathDate,
  }
}
