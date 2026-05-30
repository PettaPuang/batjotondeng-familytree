import Link from "next/link"

import { Button } from "@/components/ui/button"

const links = [
  { href: "/silsilah", label: "Silsilah" },
  { href: "/silsilah/pernikahan", label: "Pernikahan" },
]

export function SilsilahNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          link.href === "/silsilah"
            ? currentPath === "/silsilah"
            : currentPath.startsWith(link.href)

        return (
          <Button
            key={link.href}
            asChild
            size="sm"
            variant={active ? "default" : "outline"}
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        )
      })}
    </nav>
  )
}
