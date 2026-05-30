"use client"

import { usePathname } from "next/navigation"

import { SilsilahNav } from "@/components/silsilah/silsilah-nav"

export function SilsilahNavClient() {
  const pathname = usePathname()

  return <SilsilahNav currentPath={pathname} />
}
