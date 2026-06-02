import type { ReactNode } from "react"
import type { Person } from "@prisma/client"

import {
  formatAge,
  formatBirthWithAge,
  formatDate,
  formatOptionalText,
  genderLabel,
} from "@/lib/silsilah/format"
import { formatPersonTreeName } from "@/lib/silsilah/format"
import type { PersonDetailLimited } from "@/lib/silsilah/types"
import { cn } from "@/lib/utils"

type PersonProfileDetailProps = {
  person: Person
}

const fieldBoxClassName =
  "bg-input/50 min-h-8 w-full rounded-2xl border border-transparent px-2.5 py-1.5 text-sm break-words text-foreground md:text-sm"

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
      <dt className="text-muted-foreground col-span-1 pt-2 text-sm">{label}</dt>
      <dd className="col-span-2">
        <div className={cn(fieldBoxClassName)}>{value}</div>
      </dd>
    </div>
  )
}

export function PersonProfileDetail({ person }: PersonProfileDetailProps) {
  return (
    <dl className="flex flex-col gap-4">
      <DetailRow
        label="Nama lengkap"
        value={formatPersonTreeName(person.fullName, person.gender, person.isAlive)}
      />
      <DetailRow label="Nama panggilan" value={formatOptionalText(person.nickname)} />
      <DetailRow label="Jenis kelamin" value={genderLabel(person.gender)} />
      <DetailRow
        label="Tanggal lahir"
        value={formatBirthWithAge(person.birthDate, {
          deathDate: person.deathDate,
          isAlive: person.isAlive,
        })}
      />
      <DetailRow label="Tempat lahir" value={formatOptionalText(person.birthPlace)} />
      <DetailRow label="Status" value={person.isAlive ? "Hidup" : "Meninggal"} />
      {!person.isAlive ? (
        <DetailRow label="Tanggal meninggal" value={formatDate(person.deathDate)} />
      ) : null}
      <DetailRow label="Telepon" value={formatOptionalText(person.phone)} />
      <DetailRow label="Alamat" value={formatOptionalText(person.address)} />
      <DetailRow label="Catatan" value={formatOptionalText(person.notes)} />
    </dl>
  )
}

export function PersonLimitedDetail({ person }: { person: PersonDetailLimited }) {
  return (
    <dl className="flex flex-col gap-4">
      <DetailRow
        label="Nama lengkap"
        value={formatPersonTreeName(person.fullName, person.gender, person.isAlive)}
      />
      <DetailRow label="Nama panggilan" value={formatOptionalText(person.nickname)} />
      <DetailRow
        label="Umur"
        value={formatAge(person.age) ?? "—"}
      />
      <DetailRow label="Telepon" value={formatOptionalText(person.phone)} />
      <DetailRow label="Alamat" value={formatOptionalText(person.address)} />
    </dl>
  )
}
