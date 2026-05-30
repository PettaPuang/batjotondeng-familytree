import type { Person } from "@prisma/client"

import { sortBySiblingBirthOrder } from "@/lib/silsilah/sibling-order"
import type { TreePerson } from "@/lib/silsilah/types"

export const GENEALOGY_CARD = {
  width: 236,
  height: 76,
} as const

const ROW_GAP = 100
const UNIT_GAP = 36
const COUPLE_GAP = 20
const PAD = 48

export type GenealogyLayoutCard = {
  person: Person
  personId: string
  x: number
  y: number
  width: number
  height: number
}

export type GenealogyLayoutEdge = {
  id: string
  d: string
  kind: "marriage" | "parent-child" | "trunk"
}

export type GenealogyLayout = {
  bounds: { width: number; height: number }
  cards: GenealogyLayoutCard[]
  edges: GenealogyLayoutEdge[]
}

type UnitMember = {
  person: Person
}

type LayoutUnit = {
  members: UnitMember[]
  width: number
}

function cx(card: { x: number; width: number }) {
  return card.x + card.width / 2
}

function bottom(card: { y: number; height: number }) {
  return card.y + card.height
}

function top(card: { y: number }) {
  return card.y
}

/** Titik sambung di tepi atas kartu (sedikit masuk agar tidak tertutup DOM kartu). */
function connectTop(card: { y: number }) {
  return card.y + 6
}

function findMarriageRecord(persons: TreePerson[], marriageId: string) {
  for (const person of persons) {
    for (const marriage of person.marriages) {
      if (marriage.id === marriageId) {
        return marriage
      }
    }
    for (const marriage of person.marriages2) {
      if (marriage.id === marriageId) {
        return marriage
      }
    }
  }

  return null
}

function getActiveSpouses(person: TreePerson): Person[] {
  const spouses = new Map<string, Person>()

  for (const marriage of person.marriages) {
    if (marriage.isActive) {
      spouses.set(marriage.wife.id, marriage.wife)
    }
  }

  for (const marriage of person.marriages2) {
    if (marriage.isActive) {
      spouses.set(marriage.husband.id, marriage.husband)
    }
  }

  return Array.from(spouses.values())
}

function buildPersonUnit(person: TreePerson, includeSpouses: boolean): LayoutUnit {
  const members: UnitMember[] = [{ person }]

  if (includeSpouses) {
    for (const spouse of getActiveSpouses(person)) {
      members.push({ person: spouse })
    }
  }

  const width =
    GENEALOGY_CARD.width * members.length +
    COUPLE_GAP * Math.max(0, members.length - 1)

  return { members, width }
}

function coupleUnit(husband: Person, wife: Person): LayoutUnit {
  const ordered =
    husband.gender === "MALE" ? [husband, wife] : [wife, husband]

  return {
    members: ordered.map((person) => ({ person })),
    width: GENEALOGY_CARD.width * 2 + COUPLE_GAP,
  }
}

function placeUnit(
  unit: LayoutUnit,
  x: number,
  y: number,
  cards: GenealogyLayoutCard[],
) {
  let cursor = x

  for (const member of unit.members) {
    cards.push({
      person: member.person,
      personId: member.person.id,
      x: cursor,
      y,
      width: GENEALOGY_CARD.width,
      height: GENEALOGY_CARD.height,
    })
    cursor += GENEALOGY_CARD.width + COUPLE_GAP
  }
}

function rowContentWidth(units: LayoutUnit[]) {
  return units.reduce(
    (sum, unit, index) => sum + unit.width + (index > 0 ? UNIT_GAP : 0),
    0,
  )
}

function marriageEdge(
  left: GenealogyLayoutCard,
  right: GenealogyLayoutCard,
  id: string,
): GenealogyLayoutEdge {
  const y = bottom(left) - left.height * 0.38
  return {
    id,
    kind: "marriage",
    d: `M ${left.x + left.width} ${y} L ${right.x} ${y}`,
  }
}

function cardsForUnit(
  cards: GenealogyLayoutCard[],
  unit: LayoutUnit,
): GenealogyLayoutCard[] {
  const ids = new Set(unit.members.map((member) => member.person.id))
  return cards.filter((card) => ids.has(card.personId))
}

/** Kartu anggota utama unit (bukan pasangan) — target garis orang tua→anak. */
function primaryCardForUnit(
  cards: GenealogyLayoutCard[],
  unit: LayoutUnit,
): GenealogyLayoutCard | undefined {
  const primaryId = unit.members[0]?.person.id
  return cards.find((card) => card.personId === primaryId)
}

function connectCouple(
  unitCards: GenealogyLayoutCard[],
  edges: GenealogyLayoutEdge[],
  id: string,
) {
  if (unitCards.length < 2) {
    return
  }

  const sorted = [...unitCards].sort((a, b) => a.x - b.x)
  edges.push(marriageEdge(sorted[0], sorted[1], id))
}

function connectDescendants(
  fromX: number,
  fromY: number,
  targets: GenealogyLayoutCard[],
  edges: GenealogyLayoutEdge[],
  prefix: string,
) {
  if (targets.length === 0) {
    return
  }

  const targetTop = Math.min(...targets.map(top))
  const busY = Math.max(fromY + 12, targetTop - 14)

  if (targets.length === 1) {
    const target = targets[0]
    edges.push({
      id: `${prefix}-single`,
      kind: "parent-child",
      d: `M ${fromX} ${fromY} L ${fromX} ${busY} L ${cx(target)} ${busY} L ${cx(target)} ${connectTop(target)}`,
    })
    return
  }

  const left = Math.min(...targets.map(cx))
  const right = Math.max(...targets.map(cx))

  edges.push({
    id: `${prefix}-trunk`,
    kind: "trunk",
    d: `M ${fromX} ${fromY} L ${fromX} ${busY} L ${left} ${busY} L ${right} ${busY}`,
  })

  for (const target of targets) {
    edges.push({
      id: `${prefix}-${target.personId}`,
      kind: "parent-child",
      d: `M ${cx(target)} ${busY} L ${cx(target)} ${connectTop(target)}`,
    })
  }
}

export function buildGenealogyLayout(
  persons: TreePerson[],
  subjectPersonId: string,
): GenealogyLayout | null {
  if (persons.length === 0) {
    return null
  }

  const personsById = new Map(persons.map((person) => [person.id, person]))
  const subject = personsById.get(subjectPersonId) ?? persons[0]

  if (!subject) {
    return null
  }

  const cards: GenealogyLayoutCard[] = []
  const edges: GenealogyLayoutEdge[] = []

  type Row = { y: number; units: LayoutUnit[] }
  const layoutRows: Row[] = []

  let y = PAD
  const parentLink = subject.parents[0]

  if (parentLink) {
    layoutRows.push({
      y,
      units: [coupleUnit(parentLink.marriage.husband, parentLink.marriage.wife)],
    })

    const parentMarriageRecord = findMarriageRecord(
      persons,
      parentLink.marriageId,
    )
    const siblings = parentMarriageRecord
      ? sortBySiblingBirthOrder(
          parentMarriageRecord.children.map((link) => link.child),
        )
      : []

    if (siblings.length > 0) {
      y += GENEALOGY_CARD.height + ROW_GAP
      layoutRows.push({
        y,
        units: siblings.map((sibling) => {
          const full = personsById.get(sibling.id) ?? sibling
          return buildPersonUnit(
            full as TreePerson,
            true,
          )
        }),
      })
    }
  } else {
    layoutRows.push({
      y,
      units: [buildPersonUnit(subject, true)],
    })
  }

  const subjectChildren = sortBySiblingBirthOrder(
    [...subject.marriages, ...subject.marriages2].flatMap((marriage) =>
      marriage.children.map((link) => link.child),
    ),
  )
  const uniqueChildren = Array.from(
    new Map(subjectChildren.map((child) => [child.id, child])).values(),
  )

  if (uniqueChildren.length > 0) {
    y += GENEALOGY_CARD.height + ROW_GAP
    layoutRows.push({
      y,
      units: uniqueChildren.map((child) =>
        buildPersonUnit(
          (personsById.get(child.id) ?? child) as TreePerson,
          false,
        ),
      ),
    })
  }

  const canvasWidth =
    Math.max(...layoutRows.map((row) => rowContentWidth(row.units)), 320) +
    PAD * 2
  const canvasHeight =
    (layoutRows.at(-1)?.y ?? PAD) + GENEALOGY_CARD.height + PAD

  for (const row of layoutRows) {
    const rowWidth = rowContentWidth(row.units)
    let cursor = PAD + (canvasWidth - PAD * 2 - rowWidth) / 2

    for (const unit of row.units) {
      placeUnit(unit, cursor, row.y, cards)
      cursor += unit.width + UNIT_GAP
    }
  }

  const parentRow = layoutRows[0]
  const siblingRow = layoutRows[1]
  const childRow = layoutRows[2]

  if (parentLink && siblingRow) {
    const parentUnit = parentRow.units[0]
    const parentCards = cardsForUnit(cards, parentUnit)
    connectCouple(parentCards, edges, "parents-marriage")

    const sortedParents = [...parentCards].sort((a, b) => a.x - b.x)
    const parentCenterX =
      (cx(sortedParents[0]) + cx(sortedParents[sortedParents.length - 1])) / 2
    const parentStemY = Math.max(...parentCards.map(bottom))

    const siblingTargets = siblingRow.units
      .map((unit) => primaryCardForUnit(cards, unit))
      .filter((card): card is GenealogyLayoutCard => Boolean(card))

    connectDescendants(
      parentCenterX,
      parentStemY,
      siblingTargets,
      edges,
      "parents-to-children",
    )

    for (const unit of siblingRow.units) {
      const unitCards = cardsForUnit(cards, unit)
      connectCouple(
        unitCards,
        edges,
        `sibling-marriage-${unitCards[0]?.personId ?? "unit"}`,
      )
    }

    if (childRow) {
      const subjectUnit = siblingRow.units.find((unit) =>
        unit.members.some((member) => member.person.id === subject.id),
      )

      if (subjectUnit) {
        const subjectCard = primaryCardForUnit(cards, subjectUnit)
        const spouseCards = cardsForUnit(cards, subjectUnit).filter(
          (card) => card.personId !== subject.id,
        )

        if (subjectCard) {
          const coupleCards = subjectCard
            ? [subjectCard, ...spouseCards].sort((a, b) => a.x - b.x)
            : []
          const anchorX =
            coupleCards.length >= 2
              ? (cx(coupleCards[0]) + cx(coupleCards[coupleCards.length - 1])) / 2
              : cx(subjectCard)
          const anchorY = Math.max(...coupleCards.map(bottom))

          const childTargets = childRow.units
            .map((unit) => primaryCardForUnit(cards, unit))
            .filter((card): card is GenealogyLayoutCard => Boolean(card))

          connectDescendants(
            anchorX,
            anchorY,
            childTargets,
            edges,
            "subject-to-children",
          )
        }
      }
    }
  } else if (parentLink && !siblingRow) {
    const parentUnit = parentRow.units[0]
    const parentCards = cardsForUnit(cards, parentUnit)
    connectCouple(parentCards, edges, "parents-marriage")

    const subjectCard = cards.find((card) => card.personId === subject.id)

    if (subjectCard && subjectCard.y > parentRow.y) {
      const sortedParents = [...parentCards].sort((a, b) => a.x - b.x)
      const parentCenterX =
        (cx(sortedParents[0]) + cx(sortedParents[sortedParents.length - 1])) / 2

      connectDescendants(
        parentCenterX,
        Math.max(...parentCards.map(bottom)),
        [subjectCard],
        edges,
        "parents-to-subject",
      )
    }
  } else if (childRow && layoutRows[0]) {
    const rootUnit = layoutRows[0].units[0]
    const rootCard = primaryCardForUnit(cards, rootUnit)

    if (rootCard) {
      const childTargets = childRow.units
        .map((unit) => primaryCardForUnit(cards, unit))
        .filter((card): card is GenealogyLayoutCard => Boolean(card))

      connectDescendants(
        cx(rootCard),
        bottom(rootCard),
        childTargets,
        edges,
        "root-to-children",
      )
    }
  }

  return {
    cards,
    edges,
    bounds: { width: canvasWidth, height: canvasHeight },
  }
}
