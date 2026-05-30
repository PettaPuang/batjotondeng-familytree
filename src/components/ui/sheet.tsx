"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  size = "full",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  size?: "full" | "auto"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        data-size={size}
        className={cn(
          "group/sheet-content fixed z-50 flex flex-col gap-0 overflow-hidden rounded-xl border bg-card p-0 text-sm text-foreground shadow-2xl transition duration-200 ease-in-out",
          "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          "data-[side=right]:inset-x-3 data-[side=right]:top-3 data-[side=right]:bottom-3 data-[side=right]:w-auto data-[side=right]:max-w-none data-[side=right]:data-open:slide-in-from-bottom-10 data-[side=right]:data-closed:slide-out-to-bottom-10",
          "lg:data-[side=right]:inset-x-auto lg:data-[side=right]:top-4 lg:data-[side=right]:right-4 lg:data-[side=right]:bottom-4 lg:data-[side=right]:left-auto lg:data-[side=right]:w-1/2 lg:data-[side=right]:max-w-1/2 lg:data-[side=right]:data-open:slide-in-from-right-10 lg:data-[side=right]:data-closed:slide-out-to-right-10",
          "data-[side=left]:inset-x-3 data-[side=left]:top-3 data-[side=left]:bottom-3 data-[side=left]:w-auto data-[side=left]:max-w-none data-[side=left]:data-open:slide-in-from-bottom-10 data-[side=left]:data-closed:slide-out-to-bottom-10",
          "lg:data-[side=left]:inset-x-auto lg:data-[side=left]:top-4 lg:data-[side=left]:left-4 lg:data-[side=left]:bottom-4 lg:data-[side=left]:right-auto lg:data-[side=left]:w-1/2 lg:data-[side=left]:max-w-1/2 lg:data-[side=left]:data-open:slide-in-from-left-10 lg:data-[side=left]:data-closed:slide-out-to-left-10",
          "data-[side=top]:top-4 data-[side=top]:right-4 data-[side=top]:left-4 data-[side=top]:bottom-auto data-[side=top]:max-h-50vh data-[side=top]:w-auto data-[side=top]:data-open:slide-in-from-top-10 data-[side=top]:data-closed:slide-out-to-top-10",
          "data-[side=bottom]:bottom-4 data-[side=bottom]:right-4 data-[side=bottom]:left-4 data-[side=bottom]:top-auto data-[side=bottom]:max-h-50vh data-[side=bottom]:w-auto data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=bottom]:data-closed:slide-out-to-bottom-10",
          "data-[size=full]:data-[side=right]:bottom-4 data-[size=full]:data-[side=left]:bottom-4",
          "data-[size=auto]:h-auto data-[size=auto]:max-h-[calc(100vh-(--spacing(8)))] data-[size=auto]:data-[side=right]:bottom-auto data-[size=auto]:data-[side=left]:bottom-auto",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              className="absolute top-4 right-4 bg-secondary"
              size="icon-sm"
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("shrink-0 border-b px-6 py-5", className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        "px-6 py-5",
        "group-data-[size=full]/sheet-content:min-h-0 group-data-[size=full]/sheet-content:flex-1 group-data-[size=full]/sheet-content:overflow-y-auto",
        "group-data-[size=auto]/sheet-content:max-h-[calc(100vh-(--spacing(48)))] group-data-[size=auto]/sheet-content:overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-row justify-end gap-2 border-t px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
