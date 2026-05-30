import type { Metadata } from "next"
import Link from "next/link"

import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/silsilah/format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Pernikahan",
}

export default async function PernikahanPage() {
  const marriages = await prisma.marriage.findMany({
    include: {
      husband: true,
      wife: true,
      children: {
        include: {
          child: true,
        },
      },
    },
    orderBy: { marriageDate: "desc" },
  })

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Daftar Pernikahan</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {marriages.length} pernikahan tercatat.
          </p>
        </div>

        <Button asChild>
          <Link href="/silsilah/pernikahan/tambah">Tambah Pernikahan</Link>
        </Button>
      </div>

      {marriages.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada pernikahan</CardTitle>
            <CardDescription>
              Catat pernikahan suami-istri sebelum menghubungkan anak ke orang tua.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {marriages.map((marriage) => (
            <Card key={marriage.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {marriage.husband.fullName} & {marriage.wife.fullName}
                </CardTitle>
                <CardDescription>
                  Tanggal nikah: {formatDate(marriage.marriageDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{marriage.children.length} anak terhubung</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
