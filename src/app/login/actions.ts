"use server"

import { redirect } from "next/navigation"

import { signIn } from "@/auth"
import { toastMessages } from "@/lib/toast-messages"
import { checkNameExists, checkParentExists } from "@/lib/verify-person"

export async function checkNameStepAction(name: string): Promise<boolean> {
  return checkNameExists(name)
}

export async function checkParentStepAction(
  name: string,
  parentName: string,
): Promise<boolean> {
  return checkParentExists(name, parentName)
}

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
    throw new Error(toastMessages.loginFailed)
  }

  const target =
    typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/silsilah"

  redirect(target)
}
