import type { Marriage } from "@prisma/client"

import { formatDate } from "@/lib/silsilah/format"
import type { PersonWithRelations } from "@/lib/silsilah/types"

export type PersonViewerContext = {
  relationToViewer: string
  parentMarriageLabel: string | null
  parentMarriageDate: string | null
  marriageWithViewerLabel: string | null
  marriageWithViewerDate: string | null
}

function marriageLabelForOwner(
  marriage: Marriage,
  owner: PersonWithRelations,
): string | null {
  const asHusband = owner.marriages.find((item) => item.id === marriage.id)

  if (asHusband) {
    return `${owner.fullName} & ${asHusband.wife.fullName}`
  }

  const asWife = owner.marriages2.find((item) => item.id === marriage.id)

  if (asWife) {
    return `${asWife.husband.fullName} & ${owner.fullName}`
  }

  return null
}

function marriageLabelFromParentLink(
  marriage: PersonWithRelations["parents"][number]["marriage"],
) {
  return `${marriage.husband.fullName} & ${marriage.wife.fullName}`
}

function parentMarriageIds(person: PersonWithRelations) {
  return new Set(person.parents.map((link) => link.marriageId))
}

function findMarriageBetween(
  viewer: PersonWithRelations,
  target: PersonWithRelations,
) {
  const marriages = [...viewer.marriages, ...viewer.marriages2]

  for (const marriage of marriages) {
    if (marriage.husbandId === target.id || marriage.wifeId === target.id) {
      return marriage
    }
  }

  for (const marriage of [...target.marriages, ...target.marriages2]) {
    if (marriage.husbandId === viewer.id || marriage.wifeId === viewer.id) {
      return marriage
    }
  }

  return null
}

function isChildOf(viewer: PersonWithRelations, targetId: string) {
  for (const marriage of [...viewer.marriages, ...viewer.marriages2]) {
    for (const link of marriage.children) {
      if (link.childId === targetId) {
        return true
      }
    }
  }

  return false
}

function isParentOf(viewer: PersonWithRelations, targetId: string) {
  for (const link of viewer.parents) {
    const { husbandId, wifeId } = link.marriage

    if (husbandId === targetId || wifeId === targetId) {
      return true
    }
  }

  return false
}

function isSiblingOf(viewer: PersonWithRelations, target: PersonWithRelations) {
  const viewerMarriages = parentMarriageIds(viewer)
  const targetMarriages = parentMarriageIds(target)

  for (const marriageId of viewerMarriages) {
    if (targetMarriages.has(marriageId)) {
      return true
    }
  }

  return false
}

export function resolveRelationToViewer(
  viewer: PersonWithRelations,
  target: PersonWithRelations,
): string {
  if (viewer.id === target.id) {
    return "Diri sendiri"
  }

  if (findMarriageBetween(viewer, target)) {
    return "Pasangan"
  }

  if (isParentOf(viewer, target.id)) {
    return "Orang tua"
  }

  if (isChildOf(viewer, target.id)) {
    return "Anak"
  }

  if (isSiblingOf(viewer, target)) {
    return "Saudara kandung"
  }

  return "Keluarga"
}

export function buildPersonViewerContext(
  viewer: PersonWithRelations,
  target: PersonWithRelations,
): PersonViewerContext {
  const parentLink = target.parents[0]
  const sharedMarriage = findMarriageBetween(viewer, target)

  const marriageWithViewerLabel = sharedMarriage
    ? marriageLabelForOwner(sharedMarriage, viewer) ??
      marriageLabelForOwner(sharedMarriage, target)
    : null

  return {
    relationToViewer: resolveRelationToViewer(viewer, target),
    parentMarriageLabel: parentLink
      ? marriageLabelFromParentLink(parentLink.marriage)
      : null,
    parentMarriageDate: parentLink?.marriage.marriageDate
      ? formatDate(parentLink.marriage.marriageDate)
      : null,
    marriageWithViewerLabel,
    marriageWithViewerDate: sharedMarriage?.marriageDate
      ? formatDate(sharedMarriage.marriageDate)
      : null,
  }
}
