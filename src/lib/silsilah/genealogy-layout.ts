import { sortBySiblingBirthOrder } from "@/lib/silsilah/sibling-order"
import type { TreeNodePerson, TreePerson } from "@/lib/silsilah/types"

export const GENEALOGY_CARD = {
  width: 236,
  height: 76,
} as const

const ROW_GAP = 100
const UNIT_GAP = 36
const COUPLE_GAP = 20
const PAD = 48

export type GenealogyLayoutCard = {
  person: TreeNodePerson
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
  person: TreeNodePerson
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

function singlePersonUnit(person: TreePerson): LayoutUnit {
  return {
    members: [{ person }],
    width: GENEALOGY_CARD.width,
  }
}

function coupleUnit(husband: TreeNodePerson, wife: TreeNodePerson): LayoutUnit {
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

function computePersonDepths(
  personsById: Map<string, TreePerson>,
): Map<string, number> {
  const depths = new Map<string, number>()
  const visiting = new Set<string>()

  function depthFor(personId: string): number {
    const cached = depths.get(personId)
    if (cached !== undefined) {
      return cached
    }

    if (visiting.has(personId)) {
      return 0
    }

    visiting.add(personId)

    const person = personsById.get(personId)
    if (!person || person.parents.length === 0) {
      depths.set(personId, 0)
      visiting.delete(personId)
      return 0
    }

    let maxParentDepth = 0

    for (const link of person.parents) {
      maxParentDepth = Math.max(
        maxParentDepth,
        depthFor(link.marriage.husbandId),
        depthFor(link.marriage.wifeId),
      )
    }

    const depth = maxParentDepth + 1
    depths.set(personId, depth)
    visiting.delete(personId)
    return depth
  }

  for (const personId of personsById.keys()) {
    depthFor(personId)
  }

  return depths
}

function alignSpouseDepths(
  personsById: Map<string, TreePerson>,
  depths: Map<string, number>,
) {
  let changed = true

  while (changed) {
    changed = false

    for (const person of personsById.values()) {
      for (const marriage of [...person.marriages, ...person.marriages2]) {
        const husbandDepth = depths.get(marriage.husbandId) ?? 0
        const wifeDepth = depths.get(marriage.wifeId) ?? 0
        const alignedDepth = Math.max(husbandDepth, wifeDepth)

        if (depths.get(marriage.husbandId) !== alignedDepth) {
          depths.set(marriage.husbandId, alignedDepth)
          changed = true
        }

        if (depths.get(marriage.wifeId) !== alignedDepth) {
          depths.set(marriage.wifeId, alignedDepth)
          changed = true
        }
      }
    }
  }
}

function getActiveSpouseInSet(
  person: TreePerson,
  candidates: TreePerson[],
  placed: Set<string>,
): TreePerson | null {
  for (const marriage of [...person.marriages, ...person.marriages2]) {
    if (!marriage.isActive) {
      continue
    }

    const spouseId =
      marriage.husbandId === person.id ? marriage.wifeId : marriage.husbandId

    if (placed.has(spouseId)) {
      continue
    }

    const spouse = candidates.find((candidate) => candidate.id === spouseId)

    if (spouse) {
      return spouse
    }
  }

  return null
}

function buildDepthRowUnits(people: TreePerson[]): LayoutUnit[] {
  const sorted = sortBySiblingBirthOrder(people)
  const placed = new Set<string>()
  const units: LayoutUnit[] = []

  for (const person of sorted) {
    if (placed.has(person.id)) {
      continue
    }

    const activeSpouse = getActiveSpouseInSet(person, sorted, placed)

    if (activeSpouse) {
      const husband = person.gender === "MALE" ? person : activeSpouse
      const wife = person.gender === "FEMALE" ? person : activeSpouse
      units.push(coupleUnit(husband, wife))
      placed.add(person.id)
      placed.add(activeSpouse.id)
      continue
    }

    units.push(singlePersonUnit(person))
    placed.add(person.id)
  }

  return units
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
): GenealogyLayout | null {
  if (persons.length === 0) {
    return null
  }

  const personsById = new Map(persons.map((person) => [person.id, person]))
  const depths = computePersonDepths(personsById)
  alignSpouseDepths(personsById, depths)

  const depthLevels = [...new Set(depths.values())].sort((a, b) => a - b)

  type DepthRow = {
    depth: number
    y: number
    units: LayoutUnit[]
  }

  const layoutRows: DepthRow[] = []
  let y = PAD

  for (const depth of depthLevels) {
    const peopleAtDepth = persons.filter((person) => depths.get(person.id) === depth)

    layoutRows.push({
      depth,
      y,
      units: buildDepthRowUnits(peopleAtDepth),
    })
    y += GENEALOGY_CARD.height + ROW_GAP
  }

  const cards: GenealogyLayoutCard[] = []
  const edges: GenealogyLayoutEdge[] = []

  const canvasWidth =
    Math.max(
      ...layoutRows.map((row) => rowContentWidth(row.units)),
      320,
    ) +
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

  const cardById = new Map(cards.map((card) => [card.personId, card]))

  for (const row of layoutRows) {
    for (const unit of row.units) {
      const unitCards = unit.members
        .map((member) => cardById.get(member.person.id))
        .filter((card): card is GenealogyLayoutCard => card !== undefined)

      connectCouple(
        unitCards,
        edges,
        `row-${row.depth}-marriage-${unitCards[0]?.personId ?? "unit"}`,
      )
    }
  }

  const processedMarriages = new Set<string>()

  for (const person of persons) {
    for (const marriage of [...person.marriages, ...person.marriages2]) {
      if (processedMarriages.has(marriage.id) || marriage.children.length === 0) {
        continue
      }

      processedMarriages.add(marriage.id)

      const parentCards = [marriage.husbandId, marriage.wifeId]
        .map((id) => cardById.get(id))
        .filter((card): card is GenealogyLayoutCard => card !== undefined)

      const childCards = marriage.children
        .map((link) => cardById.get(link.childId))
        .filter((card): card is GenealogyLayoutCard => card !== undefined)

      if (parentCards.length === 0 || childCards.length === 0) {
        continue
      }

      const parentCenters = parentCards.map(cx)
      const fromX =
        (Math.min(...parentCenters) + Math.max(...parentCenters)) / 2
      const fromY = Math.max(...parentCards.map(bottom))

      connectDescendants(
        fromX,
        fromY,
        childCards,
        edges,
        `marriage-${marriage.id}`,
      )
    }
  }

  return {
    cards,
    edges,
    bounds: { width: canvasWidth, height: canvasHeight },
  }
}
