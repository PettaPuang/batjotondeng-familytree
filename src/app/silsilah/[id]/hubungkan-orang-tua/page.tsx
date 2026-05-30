import Link from "next/link"
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import { LinkParentForm } from "@/components/silsilah/link-parent-form"
import { canManagePerson } from "@/lib/auth/person-scope"
import { getParentLinkMarriageOptions } from "@/lib/auth/link-parent-options"
import { getPersonById } from "@/lib/silsilah/queries"
import { Button } from "@/components/ui/button"

type LinkParentPageProps = {
  params: Promise<{ id: string }>
}

export default async function LinkParentPage({ params }: LinkParentPageProps) {
  const { id } = await params
  const session = await auth()
  const actorPersonId = session?.user?.personId

  if (!actorPersonId) {
    notFound()
  }

  const person = await getPersonById(id)

  if (!person) {
    notFound()
  }

  const allowed = await canManagePerson(actorPersonId, id)

  if (!allowed) {
    notFound()
  }

  const marriages = await getParentLinkMarriageOptions(actorPersonId, id)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Hubungkan Orang Tua</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Pilih pernikahan orang tua untuk {person.fullName}.
        </p>
      </div>

      <LinkParentForm
        childId={person.id}
        marriages={marriages.map((marriage) => ({
          id: marriage.id,
          label: `${marriage.husband.fullName} & ${marriage.wife.fullName}`,
        }))}
      />

      <Button asChild className="w-fit" variant="outline">
        <Link href="/silsilah">Batal</Link>
      </Button>
    </section>
  )
}
