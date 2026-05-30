import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function SilsilahNotFound() {
  return (
    <section className="flex flex-col gap-4 py-12 text-center">
      <h1 className="font-heading text-2xl font-semibold">Data tidak ditemukan</h1>
      <p className="text-muted-foreground text-sm">
        Anggota atau halaman yang Anda cari tidak ada.
      </p>
      <Button asChild className="mx-auto w-fit">
        <Link href="/silsilah">Kembali ke Daftar</Link>
      </Button>
    </section>
  )
}
