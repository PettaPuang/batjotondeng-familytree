"use client"

import { useLayoutEffect, useState, type RefObject } from "react"

const FIT_PADDING = 32

export function useTreeFitScale(
  containerRef: RefObject<HTMLElement | null>,
  bounds: { width: number; height: number } | null,
) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = containerRef.current

    if (!element || !bounds || bounds.width <= 0 || bounds.height <= 0) {
      setScale(1)
      return
    }

    const updateScale = () => {
      const availableWidth = element.clientWidth - FIT_PADDING
      const availableHeight = element.clientHeight - FIT_PADDING

      if (availableWidth <= 0 || availableHeight <= 0) {
        setScale(1)
        return
      }

      const nextScale = Math.min(
        1,
        availableWidth / bounds.width,
        availableHeight / bounds.height,
      )

      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1)
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(element)

    return () => observer.disconnect()
  }, [bounds, containerRef])

  return scale
}
