"use client"

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent as ReactWheelEvent,
} from "react"

import type { GenealogyLayoutCard } from "@/lib/silsilah/genealogy-layout"
import {
  clampTreePan,
  clampUserZoom,
  panForZoomAtPoint,
  panToTopCard,
  treeContentSize,
  TREE_ZOOM_STEP,
} from "@/lib/silsilah/genealogy-tree-viewport"
import { useTreeFitScale } from "@/components/silsilah/use-tree-fit-scale"

type UseGenealogyTreeViewportOptions = {
  bounds: { width: number; height: number } | null
  cards: GenealogyLayoutCard[] | undefined
  focusPersonId: string | null | undefined
  zoomEnabled?: boolean
}

function getViewportSize(ref: RefObject<HTMLElement | null>) {
  const element = ref.current

  if (!element) {
    return null
  }

  return { width: element.clientWidth, height: element.clientHeight }
}

export function useGenealogyTreeViewport({
  bounds,
  cards,
  focusPersonId,
  zoomEnabled = false,
}: UseGenealogyTreeViewportOptions) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const fitScale = useTreeFitScale(viewportRef, bounds)
  const [userZoom, setUserZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    panX: number
    panY: number
  } | null>(null)
  const lastFocusRef = useRef<string | null>(null)
  const userAdjustedRef = useRef(false)

  const scale = fitScale * userZoom

  const markUserAdjusted = useCallback(() => {
    userAdjustedRef.current = true
  }, [])

  const applyPan = useCallback(
    (next: { x: number; y: number }, animate = false) => {
      const viewport = getViewportSize(viewportRef)

      if (!viewport || !bounds || scale <= 0) {
        setPan(next)
        return
      }

      const content = treeContentSize(bounds, scale)
      setPan(clampTreePan(next, viewport, content))
      setIsAnimating(animate)
    },
    [bounds, scale],
  )

  const focusCard = useCallback(
    (personId: string | null | undefined, animate = true) => {
      const viewport = getViewportSize(viewportRef)

      if (!viewport || !bounds || !cards || !personId || scale <= 0) {
        return
      }

      const card = cards.find((item) => item.personId === personId)

      if (!card) {
        return
      }

      const content = treeContentSize(bounds, scale)
      applyPan(panToTopCard(card, scale, viewport, content), animate)
    },
    [applyPan, bounds, cards, scale],
  )

  useLayoutEffect(() => {
    if (!focusPersonId) {
      return
    }

    const personChanged = lastFocusRef.current !== focusPersonId

    if (personChanged) {
      lastFocusRef.current = focusPersonId
      userAdjustedRef.current = false
    }

    if (!personChanged && userAdjustedRef.current) {
      return
    }

    focusCard(focusPersonId, personChanged)
  }, [focusCard, fitScale, focusPersonId])

  useLayoutEffect(() => {
    const viewport = getViewportSize(viewportRef)

    if (!viewport || !bounds || scale <= 0) {
      return
    }

    const content = treeContentSize(bounds, scale)
    setPan((current) => clampTreePan(current, viewport, content))
  }, [bounds, fitScale, scale, userZoom])

  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      if (!zoomEnabled) {
        return
      }

      const viewport = viewportRef.current

      if (!viewport || !bounds) {
        return
      }

      const oldScale = scale
      const nextUserZoom = clampUserZoom(userZoom * factor)

      if (nextUserZoom === userZoom) {
        return
      }

      const newScale = fitScale * nextUserZoom
      const anchorPoint = anchor ?? {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      }

      const viewportSize = {
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      }
      const content = treeContentSize(bounds, newScale)
      const nextPan = panForZoomAtPoint(pan, oldScale, newScale, anchorPoint)

      setUserZoom(nextUserZoom)
      setPan(clampTreePan(nextPan, viewportSize, content))
      setIsAnimating(false)
      markUserAdjusted()
    },
    [bounds, fitScale, markUserAdjusted, pan, scale, userZoom, zoomEnabled],
  )

  const zoomIn = useCallback(() => zoomBy(TREE_ZOOM_STEP), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(1 / TREE_ZOOM_STEP), [zoomBy])

  const resetView = useCallback(() => {
    setUserZoom(1)
    setIsAnimating(true)
    userAdjustedRef.current = false
    lastFocusRef.current = null

    if (focusPersonId) {
      lastFocusRef.current = focusPersonId
      const viewport = getViewportSize(viewportRef)

      if (!viewport || !bounds || !cards || fitScale <= 0) {
        setPan({ x: 0, y: 0 })
        return
      }

      const card = cards.find((item) => item.personId === focusPersonId)

      if (!card) {
        setPan({ x: 0, y: 0 })
        return
      }

      const content = treeContentSize(bounds, fitScale)
      setPan(panToTopCard(card, fitScale, viewport, content))
      return
    }

    setPan({ x: 0, y: 0 })
  }, [bounds, cards, fitScale, focusPersonId])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return
      }

      if ((event.target as HTMLElement).closest(".genealogy-tree-card")) {
        return
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        panX: pan.x,
        panY: pan.y,
      }

      setIsDragging(true)
      setIsAnimating(false)
      markUserAdjusted()
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [markUserAdjusted, pan.x, pan.y],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current

      if (!drag || drag.pointerId !== event.pointerId) {
        return
      }

      applyPan(
        {
          x: drag.panX + event.clientX - drag.startX,
          y: drag.panY + event.clientY - drag.startY,
        },
        false,
      )
    },
    [applyPan],
  )

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!zoomEnabled) {
        return
      }

      event.preventDefault()

      const rect = event.currentTarget.getBoundingClientRect()
      const factor = event.deltaY < 0 ? TREE_ZOOM_STEP : 1 / TREE_ZOOM_STEP

      zoomBy(factor, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    },
    [zoomBy, zoomEnabled],
  )

  const scaledWidth = bounds ? Math.round(bounds.width * scale) : 0
  const scaledHeight = bounds ? Math.round(bounds.height * scale) : 0

  return {
    viewportRef,
    pan,
    scale,
    fitScale,
    userZoom,
    scaledWidth,
    scaledHeight,
    isDragging,
    isAnimating,
    zoomIn,
    zoomOut,
    resetView,
    viewportHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onWheel: handleWheel,
    },
  }
}
