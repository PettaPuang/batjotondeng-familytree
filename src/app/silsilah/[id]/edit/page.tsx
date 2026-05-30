import Link from "next/link"
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import { updatePersonAction, deletePersonAction } from "@/app/silsilah/actions"
import { DeletePersonForm } from "@/components/silsilah/delete-person-form"
import { PersonForm } from "@/components/silsilah/person-form"
import { canManagePerson } from "@/lib/auth/person-scope"
import { getPersonById } from "@/lib/silsilah/queries"
import { Button } from "@/components/ui/button"

type EditPersonPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
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

  const boundUpdateAction = updatePersonAction.bind(null, id)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Edit Anggota</h1>
        <p className="text-muted-foreground mt-2 text-sm">{person.fullName}</p>
      </div>

      <PersonForm
        action={boundUpdateAction}
        person={person}
        submitLabel="Simpan Perubahan"
      />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/silsilah">Batal</Link>
        </Button>

        <DeletePersonForm
          action={deletePersonAction.bind(null, person.id)}
          personId={person.id}
          personName={person.fullName}
        />
      </div>
    </section>
  )
}
