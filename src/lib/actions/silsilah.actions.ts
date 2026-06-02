"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"

import { ManageForbiddenError } from "@/lib/auth/person-scope"
import {
  assertCanCreatePersonWithRelation,
  parseCreatePersonRelation,
} from "@/lib/auth/person-scope"
import { requireActor } from "@/lib/auth/session-actor"
import {
  assertPersonPhotoSignature,
  buildPersonPhotoPath,
  resolvePersonPhotoContentType,
  validatePersonPhotoFile,
} from "@/lib/blob/person-photo"
import {
  createPersonFromForm,
  deletePersonById,
  updatePersonFromForm,
} from "@/lib/silsilah/person-mutations"
import { prismaErrorMessage } from "@/lib/silsilah/person-mutations"
import { toPersonDetailPayload, type PersonDetailPayload } from "@/lib/silsilah/types"
import { SilsilahService } from "@/lib/services/silsilah.service"

export type ActionResult<T = void> = {
  success: boolean
  message: string
  data?: T
}

function revalidateSilsilah() {
  revalidatePath("/silsilah")
}

function formatActionError(error: unknown) {
  const mapped = prismaErrorMessage(error)
  if (mapped) return mapped

  if (error instanceof ManageForbiddenError) {
    return error.message
  }

  return error instanceof Error ? error.message : "Terjadi kesalahan."
}

export type PersonSheetState = {
  ok: boolean
  personId: string | null
  error: string | null
  submittedAt: number | null
}

export async function createPersonSheetAction(
  _prevState: PersonSheetState,
  formData: FormData,
): Promise<PersonSheetState> {
  try {
    const actor = await requireActor()
    const relation = parseCreatePersonRelation(formData)
    await assertCanCreatePersonWithRelation(actor.personId, relation)

    const person = await createPersonFromForm(actor, formData, relation)

    revalidateSilsilah()

    return {
      ok: true,
      personId: person.id,
      error: null,
      submittedAt: Date.now(),
    }
  } catch (error) {
    return {
      ok: false,
      personId: null,
      error: formatActionError(error),
      submittedAt: null,
    }
  }
}

export async function updatePersonSheetAction(
  _prevState: PersonSheetState,
  formData: FormData,
): Promise<PersonSheetState> {
  try {
    const actor = await requireActor()
    const id = String(formData.get("personId") ?? "")

    if (!id) {
      throw new Error("Anggota tidak ditemukan.")
    }

    const after = await updatePersonFromForm(actor, id, formData, {
      includeMarriageDate: true,
    })

    revalidateSilsilah()

    return {
      ok: true,
      personId: after.id,
      error: null,
      submittedAt: Date.now(),
    }
  } catch (error) {
    return {
      ok: false,
      personId: null,
      error: formatActionError(error),
      submittedAt: null,
    }
  }
}

export async function deletePerson(
  personId: string,
): Promise<ActionResult> {
  try {
    const actor = await requireActor()
    await deletePersonById(actor, personId)
    revalidateSilsilah()
    return { success: true, message: "Anggota berhasil dihapus." }
  } catch (error) {
    return { success: false, message: formatActionError(error) }
  }
}

export async function uploadPersonPhoto(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const actor = await requireActor()
    const file = formData.get("file")

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "File foto wajib dipilih." }
    }

    validatePersonPhotoFile(file)
    await assertPersonPhotoSignature(file)

    const blob = await put(buildPersonPhotoPath(actor.personId, file.name), file, {
      access: "private",
      addRandomSuffix: true,
      contentType: resolvePersonPhotoContentType(file),
    })

    return {
      success: true,
      message: "Foto berhasil diunggah.",
      data: { url: blob.url },
    }
  } catch (error) {
    return { success: false, message: formatActionError(error) }
  }
}

export async function fetchPersonDetailAction(
  personId: string,
): Promise<{ detail: PersonDetailPayload | null; error: string | null }> {
  try {
    const actor = await requireActor()
    const result = await SilsilahService.getPersonDetailForViewer(
      actor.personId,
      personId,
    )

    if (!result) {
      return { detail: null, error: "Anggota tidak ditemukan." }
    }

    return { detail: toPersonDetailPayload(result), error: null }
  } catch (error) {
    return { detail: null, error: formatActionError(error) }
  }
}

export async function fetchPersonAuditLogsAction(
  personId: string,
): Promise<{ logs: Awaited<ReturnType<typeof SilsilahService.getPersonAuditLogs>> | null; error: string | null }> {
  try {
    const actor = await requireActor()
    const logs = await SilsilahService.getPersonAuditLogsForActor(
      actor.personId,
      personId,
    )

    return { logs, error: null }
  } catch (error) {
    return { logs: null, error: formatActionError(error) }
  }
}
