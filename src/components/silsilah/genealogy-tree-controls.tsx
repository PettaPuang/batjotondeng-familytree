"use client"

import { HandIcon, Maximize2Icon, MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type GenealogyTreeControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  zoomPercent: number
  zoomEnabled: boolean
  onZoomEnabledChange: (enabled: boolean) => void
}

export function GenealogyTreeControls({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomPercent,
  zoomEnabled,
  onZoomEnabledChange,
}: GenealogyTreeControlsProps) {
  return (
    <div className="genealogy-tree-controls pointer-events-none absolute top-2 right-2 left-2 z-20 sm:left-auto">
      <div className="bg-card/90 pointer-events-auto ml-auto flex max-w-full flex-wrap items-center justify-end gap-0.5 rounded-md border px-1 py-0.5 shadow-sm backdrop-blur-sm">
        <label className="text-muted-foreground flex cursor-pointer items-center gap-1 px-1 text-[10px] leading-none whitespace-nowrap select-none">
          <input
            checked={zoomEnabled}
            className="size-3 shrink-0 accent-primary"
            onChange={(event) => onZoomEnabledChange(event.target.checked)}
            type="checkbox"
          />
          Zoom
        </label>
        <span aria-hidden className="bg-border mx-0.5 h-3 w-px shrink-0" />
        <Button
          aria-label="Perkecil tampilan pohon"
          className="size-5"
          disabled={!zoomEnabled}
          onClick={onZoomOut}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MinusIcon className="size-2.5" />
        </Button>
        <span
          className={cn(
            "text-muted-foreground min-w-8 text-center text-[10px] tabular-nums leading-none",
            !zoomEnabled && "opacity-50",
          )}
        >
          {zoomPercent}%
        </span>
        <Button
          aria-label="Perbesar tampilan pohon"
          className="size-5"
          disabled={!zoomEnabled}
          onClick={onZoomIn}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <PlusIcon className="size-2.5" />
        </Button>
        <Button
          aria-label="Sesuaikan ulang tampilan pohon"
          className="size-5"
          onClick={onReset}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Maximize2Icon className="size-2.5" />
        </Button>
        <span aria-hidden className="bg-border mx-0.5 hidden h-3 w-px shrink-0 sm:inline" />
        <span className="text-muted-foreground hidden items-center gap-0.5 text-[10px] leading-none whitespace-nowrap sm:flex">
          <HandIcon className="size-2.5 shrink-0 opacity-60" />
          {zoomEnabled ? "Tarik untuk geser · scroll zoom" : "Tarik untuk geser"}
        </span>
      </div>
    </div>
  )
}
