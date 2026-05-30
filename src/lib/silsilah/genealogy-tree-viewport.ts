import type { GenealogyLayoutCard } from "@/lib/silsilah/genealogy-layout"

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

/** Jarak kartu fokus dari tepi atas viewport — ruang untuk generasi di atas (kepala keluarga). */
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
