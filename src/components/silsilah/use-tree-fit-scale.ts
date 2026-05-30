"use client"

import { useLayoutEffect, useState, type RefObject } from "react"

const FIT_PADDING = 32

function measureFitScale(
  element: HTMLElement,
  bounds: { width: number; height: number },
) {
  const availableWidth = element.clientWidth - FIT_PADDING
  const availableHeight = element.clientHeight - FIT_PADDING

  if (availableWidth <= 0 || availableHeight <= 0) {
    return 1
  }

  const nextScale = Math.min(
    1,
    availableWidth / bounds.width,
    availableHeight / bounds.height,
  )

  return Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1
}

export function useTreeFitScale(
  containerRef: RefObject<HTMLElement | null>,
  bounds: { width: number; height: number } | null,
) {
  const [fitScale, setFitScale] = useState(1)
  const [isReady, setIsReady] = useState(false)

  useLayoutEffect(() => {
    const element = containerRef.current

    if (!element || !bounds || bounds.width <= 0 || bounds.height <= 0) {
      setFitScale(1)
      setIsReady(false)
      return
    }

    const updateScale = () => {
      setFitScale(measureFitScale(element, bounds))
      setIsReady(true)
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(element)

    return () => observer.disconnect()
  }, [bounds, containerRef])

  return { fitScale, isReady }
}
