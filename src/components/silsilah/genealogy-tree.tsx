"use client"

import { useCallback, useMemo, useState } from "react"

import { GenealogyTreeControls } from "@/components/silsilah/genealogy-tree-controls"
import { useGenealogyTreeViewport } from "@/components/silsilah/use-genealogy-tree-viewport"
import { PersonSummaryRow } from "@/components/silsilah/person-summary-row"
import { buildGenealogyLayout } from "@/lib/silsilah/genealogy-layout"
import { genderCardClass } from "@/lib/silsilah/format"
import type { TreePerson } from "@/lib/silsilah/types"
import { cn } from "@/lib/utils"

import "./genealogy-tree.css"

type GenealogyTreeProps = {
  onPersonSelect: (personId: string) => void
  persons: TreePerson[]
  /** User login — highlight kartu sendiri */
  selfPersonId?: string
  /** Kartu yang difokuskan (tengah atas) saat dipilih dari daftar */
  focusPersonId?: string | null
}

export function GenealogyTree({
  onPersonSelect,
  persons,
  selfPersonId,
  focusPersonId,
}: GenealogyTreeProps) {
  const layout = useMemo(() => buildGenealogyLayout(persons), [persons])

  const [zoomEnabled, setZoomEnabled] = useState(false)

  const {
    viewportRef,
    pan,
    scale,
    userZoom,
    scaledWidth,
    scaledHeight,
    isDragging,
    isAnimating,
    isViewReady,
    zoomIn,
    zoomOut,
    resetView,
    viewportHandlers,
  } = useGenealogyTreeViewport({
    bounds: layout?.bounds ?? null,
    cards: layout?.cards,
    focusPersonId: focusPersonId ?? null,
    zoomEnabled,
  })

  const handleZoomEnabledChange = useCallback(
    (enabled: boolean) => {
      setZoomEnabled(enabled)

      if (!enabled) {
        resetView()
      }
    },
    [resetView],
  )

  if (!layout || persons.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Belum ada data silsilah. Tambahkan anggota terlebih dahulu.
      </p>
    )
  }

  const zoomPercent = Math.round(userZoom * 100)

  return (
    <div className="genealogy-tree-shell relative h-full min-h-0">
      <div
        ref={viewportRef}
        className={cn(
          "genealogy-tree-viewport h-full min-h-68 w-full overflow-hidden touch-none select-none",
          "sm:min-h-80",
          "lg:min-h-105",
          isDragging ? "genealogy-tree-viewport--dragging" : "genealogy-tree-viewport--idle",
        )}
        {...viewportHandlers}
      >
        <div
          className={cn(
            "relative shrink-0",
            isViewReady && isAnimating && "transition-transform duration-300 ease-out",
          )}
          style={{
            height: scaledHeight,
            opacity: isViewReady ? 1 : 0,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            width: scaledWidth,
          }}
        >
          <div
            className="genealogy-tree-canvas relative"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: layout.bounds.width,
              height: layout.bounds.height,
            }}
          >
            <svg
              aria-hidden
              className="genealogy-tree-edges pointer-events-none absolute inset-0"
              height={layout.bounds.height}
              width={layout.bounds.width}
            >
              {layout.edges.map((edge) => (
                <path
                  key={edge.id}
                  className={cn(
                    "genealogy-tree-edge",
                    edge.kind === "marriage" && "genealogy-tree-edge--marriage",
                    edge.kind === "trunk" && "genealogy-tree-edge--trunk",
                    edge.kind === "parent-child" &&
                      "genealogy-tree-edge--parent-child",
                  )}
                  d={edge.d}
                  fill="none"
                />
              ))}
            </svg>

            {layout.cards.map((card) => {
              const isSelf = selfPersonId
                ? card.personId === selfPersonId
                : false

              return (
                <button
                  key={card.personId}
                  className={cn(
                    "genealogy-tree-card absolute z-10 text-left",
                    genderCardClass(card.person.gender),
                    isSelf && "genealogy-tree-card--self",
                  )}
                  onClick={() => onPersonSelect(card.personId)}
                  style={{
                    height: card.height,
                    left: card.x,
                    top: card.y,
                    width: card.width,
                  }}
                  type="button"
                >
                  <PersonSummaryRow
                    age={card.person.age}
                    avatarSize="lg"
                    gender={card.person.gender}
                    isAlive={card.person.isAlive}
                    name={card.person.fullName}
                    nickname={card.person.nickname}
                    photoUrl={card.person.photoUrl}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <GenealogyTreeControls
        onReset={resetView}
        onZoomEnabledChange={handleZoomEnabledChange}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        zoomEnabled={zoomEnabled}
        zoomPercent={zoomPercent}
      />
    </div>
  )
}
