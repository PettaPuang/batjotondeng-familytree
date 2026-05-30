import Link from "next/link"

import { MarriageCreateForm } from "@/components/silsilah/marriage-create-form"
import { getPersonSelectOptions } from "@/lib/silsilah/queries"
import { Button } from "@/components/ui/button"

export default async function TambahPernikahanPage() {
  const persons = await getPersonSelectOptions()
  const males = persons.filter((person) => person.gender === "MALE")
  const females = persons.filter((person) => person.gender === "FEMALE")

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Tambah Pernikahan</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Hubungkan suami dan istri yang sudah tercatat sebagai anggota.
        </p>
      </div>

      <MarriageCreateForm husbands={males} wives={females} />

      <Button asChild className="w-fit" variant="outline">
        <Link href="/silsilah/pernikahan">Batal</Link>
      </Button>
    </section>
  )
}
