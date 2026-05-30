"use server"

import { redirect } from "next/navigation"

import { signIn } from "@/auth"

export async function verifyAndEnter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const parentName = String(formData.get("parentName") ?? "").trim()
  const birthDate = String(formData.get("birthDate") ?? "").trim()
  const callbackUrl = formData.get("callbackUrl")

  const result = await signIn("credentials", {
    name,
    parentName,
    birthDate,
    redirect: false,
  })

  if (result?.error) {
    redirect(
      `/login?error=${encodeURIComponent("Data tidak cocok. Periksa nama (atau nama panggilan), nama orang tua, dan tanggal lahir.")}`,
    )
  }

  redirect(typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/silsilah")
}
