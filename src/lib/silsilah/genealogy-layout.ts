import { sortBySiblingBirthOrder } from "@/lib/silsilah/format"
import type { TreeNodePerson, TreePerson } from "@/lib/silsilah/types"

export const GENEALOGY_CARD = {
  width: 236,
  height: 76,
} as const

const ROW_GAP = 100
const UNIT_GAP = 36
const COUPLE_STACK_GAP = 30
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

type MarriageBranch = {
  marriageId: string
  spouse: TreePerson
  children: LayoutSubtree[]
  width: number
}

type LayoutSubtree = {
  unit: LayoutUnit
  anchorId: string
  /** Cabang per pernikahan bila ada 2+ pasangan (layout horizontal). */
  marriageBranches: MarriageBranch[] | null
  children: LayoutSubtree[]
  width: number
}

type MarriageWithSpouse = {
  marriage: TreePerson["marriages"][number]
  spouse: TreePerson
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

function spouseRowY(anchorY: number) {
  return anchorY + GENEALOGY_CARD.height + COUPLE_STACK_GAP
}

function unitStackHeight(memberCount: number) {
  if (memberCount <= 1) {
    return GENEALOGY_CARD.height
  }

  return (
    memberCount * GENEALOGY_CARD.height +
    (memberCount - 1) * COUPLE_STACK_GAP
  )
}

function placeCard(
  person: TreeNodePerson,
  x: number,
  y: number,
  cards: GenealogyLayoutCard[],
) {
  cards.push({
    person,
    personId: person.id,
    x,
    y,
    width: GENEALOGY_CARD.width,
    height: GENEALOGY_CARD.height,
  })
}

function placeUnit(
  unit: LayoutUnit,
  x: number,
  y: number,
  cards: GenealogyLayoutCard[],
) {
  let memberY = y

  for (let index = 0; index < unit.members.length; index++) {
    const member = unit.members[index]!

    if (index > 0) {
      memberY += COUPLE_STACK_GAP
    }

    placeCard(member.person, x, memberY, cards)
    memberY += GENEALOGY_CARD.height
  }
}

function childBlockWidth(children: { width: number }[]) {
  return children.reduce(
    (sum, child, index) => sum + child.width + (index > 0 ? UNIT_GAP : 0),
    0,
  )
}

function marriageEdgeVertical(
  topCard: GenealogyLayoutCard,
  bottomCard: GenealogyLayoutCard,
  id: string,
): GenealogyLayoutEdge {
  const x = cx(topCard)
  return {
    id,
    kind: "marriage",
    d: `M ${x} ${bottom(topCard)} L ${x} ${top(bottomCard)}`,
  }
}

function connectMarriagePair(
  cardA: GenealogyLayoutCard,
  cardB: GenealogyLayoutCard,
  edges: GenealogyLayoutEdge[],
  id: string,
) {
  const [topCard, bottomCard] =
    cardA.y <= cardB.y ? [cardA, cardB] : [cardB, cardA]
  edges.push(marriageEdgeVertical(topCard, bottomCard, id))
}

function connectAnchorToSpouses(
  anchorCard: GenealogyLayoutCard,
  spouseCards: GenealogyLayoutCard[],
  edges: GenealogyLayoutEdge[],
  idPrefix: string,
) {
  if (spouseCards.length === 0) {
    return
  }

  if (spouseCards.length === 1) {
    connectMarriagePair(anchorCard, spouseCards[0]!, edges, `${idPrefix}-0`)
    return
  }

  const sorted = [...spouseCards].sort((a, b) => a.x - b.x)
  const busY = Math.max(
    bottom(anchorCard) + 10,
    Math.min(...sorted.map(top)) - 12,
  )

  edges.push({
    id: `${idPrefix}-trunk`,
    kind: "trunk",
    d: `M ${cx(anchorCard)} ${bottom(anchorCard)} L ${cx(anchorCard)} ${busY} L ${cx(sorted[0]!)} ${busY} L ${cx(sorted[sorted.length - 1]!)} ${busY}`,
  })

  for (const spouseCard of sorted) {
    edges.push({
      id: `${idPrefix}-${spouseCard.personId}`,
      kind: "marriage",
      d: `M ${cx(spouseCard)} ${busY} L ${cx(spouseCard)} ${connectTop(spouseCard)}`,
    })
  }
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

function spouseCountForPerson(person: TreePerson) {
  const spouseIds = new Set<string>()

  for (const marriage of [...person.marriages, ...person.marriages2]) {
    spouseIds.add(
      marriage.husbandId === person.id ? marriage.wifeId : marriage.husbandId,
    )
  }

  return spouseIds.size
}

function computeMaxStackAtDepth(
  personsById: Map<string, TreePerson>,
  depths: Map<string, number>,
): Map<number, number> {
  const maxStack = new Map<number, number>()

  for (const person of personsById.values()) {
    const depth = depths.get(person.id) ?? 0
    const spouseCount = spouseCountForPerson(person)
    const stackSize = spouseCount === 1 ? 2 : 1
    maxStack.set(depth, Math.max(maxStack.get(depth) ?? 1, stackSize))
  }

  return maxStack
}

function rowExtent(depth: number, maxStackAtDepth: Map<number, number>) {
  return unitStackHeight(maxStackAtDepth.get(depth) ?? 1)
}

function buildDepthToGenY(
  maxDepth: number,
  maxStackAtDepth: Map<number, number>,
): Map<number, number> {
  const depthToGenY = new Map<number, number>()
  depthToGenY.set(0, PAD)

  for (let depth = 1; depth <= maxDepth; depth++) {
    const previousY = depthToGenY.get(depth - 1)!
    depthToGenY.set(
      depth,
      previousY + rowExtent(depth - 1, maxStackAtDepth) + ROW_GAP,
    )
  }

  return depthToGenY
}

function getMarriagesWithSpouseIds(
  person: TreePerson,
): { spouseId: string }[] {
  const seen = new Set<string>()
  const result: { spouseId: string }[] = []

  for (const marriage of [...person.marriages, ...person.marriages2]) {
    const spouseId =
      marriage.husbandId === person.id ? marriage.wifeId : marriage.husbandId

    if (seen.has(spouseId)) {
      continue
    }

    seen.add(spouseId)
    result.push({ spouseId })
  }

  return result
}

function getUnplacedMarriages(
  person: TreePerson,
  personsById: Map<string, TreePerson>,
  placed: Set<string>,
): MarriageWithSpouse[] {
  const active: MarriageWithSpouse[] = []
  const inactive: MarriageWithSpouse[] = []
  const seen = new Set<string>()

  for (const marriage of [...person.marriages, ...person.marriages2]) {
    const spouseId =
      marriage.husbandId === person.id ? marriage.wifeId : marriage.husbandId

    if (placed.has(spouseId) || seen.has(spouseId)) {
      continue
    }

    const spouse = personsById.get(spouseId)
    if (!spouse) {
      continue
    }

    seen.add(spouseId)

    const entry = { marriage, spouse }
    if (marriage.isActive) {
      active.push(entry)
    } else {
      inactive.push(entry)
    }
  }

  return [...active, ...inactive]
}

function buildChildrenForMarriage(
  marriage: TreePerson["marriages"][number],
  personsById: Map<string, TreePerson>,
  placed: Set<string>,
): LayoutSubtree[] {
  const childPersons = sortBySiblingBirthOrder(
    marriage.children
      .map((link) => personsById.get(link.childId))
      .filter((child): child is TreePerson => child !== undefined),
  )

  return childPersons.map((child) =>
    buildLayoutSubtree(child.id, personsById, placed),
  )
}

function buildLayoutSubtree(
  anchorId: string,
  personsById: Map<string, TreePerson>,
  placed: Set<string>,
): LayoutSubtree {
  const person = personsById.get(anchorId)

  if (!person) {
    throw new Error(`Person ${anchorId} not found for layout subtree.`)
  }

  const marriages = getUnplacedMarriages(person, personsById, placed)
  placed.add(person.id)

  for (const { spouse } of marriages) {
    placed.add(spouse.id)
  }

  if (marriages.length >= 1) {
    const marriageBranches = marriages.map(({ marriage, spouse }) => ({
      marriageId: marriage.id,
      spouse,
      children: buildChildrenForMarriage(marriage, personsById, placed),
      width: 0,
    }))

    return {
      unit: singlePersonUnit(person),
      anchorId,
      marriageBranches,
      children: [],
      width: 0,
    }
  }

  const orphanChildren = sortBySiblingBirthOrder(
    [...person.marriages, ...person.marriages2].flatMap((marriage) =>
      marriage.children
        .map((link) => personsById.get(link.childId))
        .filter((child): child is TreePerson => child !== undefined),
    ),
  )

  return {
    unit: singlePersonUnit(person),
    anchorId,
    marriageBranches: null,
    children: orphanChildren.map((child) =>
      buildLayoutSubtree(child.id, personsById, placed),
    ),
    width: 0,
  }
}

function computeBranchWidth(branch: MarriageBranch): number {
  for (const child of branch.children) {
    computeSubtreeWidth(child)
  }

  branch.width = Math.max(
    GENEALOGY_CARD.width,
    branch.children.length > 0
      ? childBlockWidth(branch.children)
      : GENEALOGY_CARD.width,
  )

  return branch.width
}

function computeSubtreeWidth(node: LayoutSubtree): number {
  if (node.marriageBranches && node.marriageBranches.length >= 1) {
    for (const branch of node.marriageBranches) {
      computeBranchWidth(branch)
    }

    node.width = Math.max(
      GENEALOGY_CARD.width,
      childBlockWidth(node.marriageBranches),
    )
    return node.width
  }

  if (node.children.length === 0) {
    node.width = node.unit.width
    return node.width
  }

  for (const child of node.children) {
    computeSubtreeWidth(child)
  }

  const childrenWidth = childBlockWidth(node.children)
  node.width = Math.max(node.unit.width, childrenWidth)
  return node.width
}

function placeMarriageHub(
  node: LayoutSubtree,
  leftX: number,
  depths: Map<string, number>,
  depthToGenY: Map<number, number>,
  cards: GenealogyLayoutCard[],
) {
  const branches = node.marriageBranches!
  const depth = depths.get(node.anchorId) ?? 0
  const anchorY = depthToGenY.get(depth) ?? PAD
  const spouseY = spouseRowY(anchorY)

  let cursor = leftX

  for (const branch of branches) {
    if (branch.children.length > 0) {
      const childrenWidth = childBlockWidth(branch.children)
      const childStartX = cursor + (branch.width - childrenWidth) / 2
      let childCursor = childStartX

      for (const child of branch.children) {
        placeLayoutSubtree(child, childCursor, depths, depthToGenY, cards)
        childCursor += child.width + UNIT_GAP
      }
    }

    const spouseX = cursor + (branch.width - GENEALOGY_CARD.width) / 2
    placeCard(branch.spouse, spouseX, spouseY, cards)
    cursor += branch.width + UNIT_GAP
  }

  const anchorX = leftX + (node.width - GENEALOGY_CARD.width) / 2
  placeCard(node.unit.members[0]!.person, anchorX, anchorY, cards)
}

function placeLayoutSubtree(
  node: LayoutSubtree,
  leftX: number,
  depths: Map<string, number>,
  depthToGenY: Map<number, number>,
  cards: GenealogyLayoutCard[],
) {
  if (node.marriageBranches && node.marriageBranches.length >= 1) {
    placeMarriageHub(node, leftX, depths, depthToGenY, cards)
    return
  }

  const depth = depths.get(node.anchorId) ?? 0
  const y = depthToGenY.get(depth) ?? PAD

  if (node.children.length === 0) {
    const unitX = leftX + (node.width - node.unit.width) / 2
    placeUnit(node.unit, unitX, y, cards)
    return
  }

  const childrenWidth = childBlockWidth(node.children)
  let childStartX = leftX

  if (node.unit.width >= childrenWidth) {
    childStartX = leftX + (node.width - childrenWidth) / 2
  }

  let cursor = childStartX

  for (const child of node.children) {
    placeLayoutSubtree(child, cursor, depths, depthToGenY, cards)
    cursor += child.width + UNIT_GAP
  }

  let unitX: number

  if (node.unit.width >= childrenWidth) {
    unitX = leftX + (node.width - node.unit.width) / 2
  } else {
    const childCards = node.children.flatMap((child) =>
      child.unit.members
        .map((member) => cards.find((card) => card.personId === member.person.id))
        .filter((card): card is GenealogyLayoutCard => card !== undefined),
    )

    const centers = childCards.map(cx)
    const childrenCenter = (Math.min(...centers) + Math.max(...centers)) / 2
    unitX = childrenCenter - node.unit.width / 2
  }

  placeUnit(node.unit, unitX, y, cards)
}

function buildForestRoots(
  persons: TreePerson[],
  depths: Map<string, number>,
  personsById: Map<string, TreePerson>,
): LayoutSubtree[] {
  const placed = new Set<string>()
  const roots: LayoutSubtree[] = []

  const rootPeople = sortBySiblingBirthOrder(
    persons.filter((person) => (depths.get(person.id) ?? 0) === 0),
  )

  for (const person of rootPeople) {
    if (placed.has(person.id)) {
      continue
    }

    roots.push(buildLayoutSubtree(person.id, personsById, placed))
  }

  return roots
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
    const target = targets[0]!
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

  const forestRoots = buildForestRoots(persons, depths, personsById)

  for (const root of forestRoots) {
    computeSubtreeWidth(root)
  }

  const cards: GenealogyLayoutCard[] = []
  const edges: GenealogyLayoutEdge[] = []

  const forestWidth = childBlockWidth(forestRoots)
  const maxDepth = Math.max(...depths.values())
  const maxStackAtDepth = computeMaxStackAtDepth(personsById, depths)
  const depthToGenY = buildDepthToGenY(maxDepth, maxStackAtDepth)
  const canvasWidth = Math.max(forestWidth + PAD * 2, 320)
  const canvasHeight =
    (depthToGenY.get(maxDepth) ?? PAD) +
    rowExtent(maxDepth, maxStackAtDepth) +
    PAD

  let cursor = PAD + (canvasWidth - PAD * 2 - forestWidth) / 2

  for (const root of forestRoots) {
    placeLayoutSubtree(root, cursor, depths, depthToGenY, cards)
    cursor += root.width + UNIT_GAP
  }

  const cardById = new Map(cards.map((card) => [card.personId, card]))
  const processedAnchors = new Set<string>()

  for (const person of persons) {
    const marriages = getMarriagesWithSpouseIds(person)
    if (marriages.length === 0) {
      continue
    }

    const anchorCard = cardById.get(person.id)
    if (!anchorCard || processedAnchors.has(person.id)) {
      continue
    }

    const spouseCards = marriages
      .map(({ spouseId }) => cardById.get(spouseId))
      .filter((card): card is GenealogyLayoutCard => card !== undefined)

    if (spouseCards.length === 0) {
      continue
    }

    processedAnchors.add(person.id)
    connectAnchorToSpouses(
      anchorCard,
      spouseCards,
      edges,
      `anchor-marriage-${person.id}`,
    )
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

      const childCards = sortBySiblingBirthOrder(
        marriage.children
          .map((link) => {
            const childPerson = personsById.get(link.childId)
            return childPerson ?? null
          })
          .filter((child): child is TreePerson => child !== null),
      )
        .map((child) => cardById.get(child.id))
        .filter((card): card is GenealogyLayoutCard => card !== undefined)

      if (parentCards.length === 0 || childCards.length === 0) {
        continue
      }

      const fromX =
        (Math.min(...parentCards.map(cx)) + Math.max(...parentCards.map(cx))) / 2
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

export const TREE_ZOOM_MIN = 0.5
export const TREE_ZOOM_MAX = 2.5
export const TREE_ZOOM_STEP = 1.2

export function treeContentSize(
  bounds: { width: number; height: number },
  scale: number,
) {
  return {
    width: bounds.width * scale,
    height: bounds.height * scale,
  }
}

export function clampTreePan(
  pan: { x: number; y: number },
  viewport: { width: number; height: number },
  content: { width: number; height: number },
) {
  let x = pan.x
  let y = pan.y

  if (content.width > viewport.width) {
    x = Math.min(0, Math.max(viewport.width - content.width, x))
  }

  if (content.height > viewport.height) {
    y = Math.min(0, Math.max(viewport.height - content.height, y))
  }

  return { x, y }
}

/** Jarak kartu fokus dari tepi atas viewport. */
export const TREE_FOCUS_TOP_PADDING = 56

export function panToTopCard(
  card: GenealogyLayoutCard,
  scale: number,
  viewport: { width: number; height: number },
  content: { width: number; height: number },
) {
  const centerX = (card.x + card.width / 2) * scale
  const topY = card.y * scale

  return clampTreePan(
    {
      x: viewport.width / 2 - centerX,
      y: TREE_FOCUS_TOP_PADDING - topY,
    },
    viewport,
    content,
  )
}

export function panForZoomAtPoint(
  pan: { x: number; y: number },
  oldScale: number,
  newScale: number,
  anchor: { x: number; y: number },
) {
  const worldX = (anchor.x - pan.x) / oldScale
  const worldY = (anchor.y - pan.y) / oldScale

  return {
    x: anchor.x - worldX * newScale,
    y: anchor.y - worldY * newScale,
  }
}

export function clampUserZoom(zoom: number) {
  return Math.min(TREE_ZOOM_MAX, Math.max(TREE_ZOOM_MIN, zoom))
}
