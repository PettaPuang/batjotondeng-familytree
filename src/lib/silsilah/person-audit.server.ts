import "server-only"

import type { Person, PersonAuditAction, Prisma } from "@prisma/client"

import {
  computePersonAuditChanges,
  serializePersonAuditFields,
  type PersonAuditPayload,
} from "@/lib/silsilah/person-audit"
import { prisma } from "@/lib/prisma"

type DbClient = Prisma.TransactionClient | typeof prisma

type CreatePersonAuditLogInput = {
  action: PersonAuditAction
  actor: { personId: string; name?: string | null }
  changes: PersonAuditPayload
  db?: DbClient
  personId: string
  personName?: string | null
}

async function createPersonAuditLog({
  action,
  actor,
  changes,
  db = prisma,
  personId,
  personName,
}: CreatePersonAuditLogInput) {
  return db.personAuditLog.create({
    data: {
      personId,
      personName: personName ?? null,
      action,
      actorPersonId: actor.personId,
      actorName: actor.name ?? null,
      changes,
    },
  })
}

export async function logPersonCreated(
  person: Person,
  actor: { personId: string; name?: string | null },
  db: DbClient = prisma,
) {
  return createPersonAuditLog({
    personId: person.id,
    personName: person.fullName,
    action: "CREATE",
    actor,
    changes: {
      kind: "create",
      fields: serializePersonAuditFields(person),
    },
    db,
  })
}

export async function logPersonUpdated(
  before: Person,
  after: Person,
  actor: { personId: string; name?: string | null },
  db: DbClient = prisma,
) {
  const fields = computePersonAuditChanges(before, after)

  if (Object.keys(fields).length === 0) {
    return null
  }

  return createPersonAuditLog({
    personId: after.id,
    personName: after.fullName,
    action: "UPDATE",
    actor,
    changes: {
      kind: "update",
      fields,
    },
    db,
  })
}

export async function logPersonDeleted(
  person: Person,
  actor: { personId: string; name?: string | null },
  db: DbClient = prisma,
) {
  return createPersonAuditLog({
    personId: person.id,
    personName: person.fullName,
    action: "DELETE",
    actor,
    changes: {
      kind: "delete",
      fields: serializePersonAuditFields(person),
    },
    db,
  })
}
