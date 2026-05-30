import type { PersonViewerContext } from "@/lib/silsilah/person-relation-context"

type PersonRelationDetailProps = {
  context: PersonViewerContext
}

function RelationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <p className="text-muted-foreground text-sm">{value}</p>
    </div>
  )
}

export function PersonRelationDetail({ context }: PersonRelationDetailProps) {
  const showParentMarriage = Boolean(context.parentMarriageLabel)
  const showViewerMarriage = Boolean(context.marriageWithViewerLabel)

  if (!showParentMarriage && !showViewerMarriage) {
    return (
      <section className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
        <RelationRow
          label="Hubungan dengan Anda"
          value={context.relationToViewer}
        />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-dashed p-4">
      <RelationRow
        label="Hubungan dengan Anda"
        value={context.relationToViewer}
      />

      {showParentMarriage ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Pernikahan orang tua</span>
          <p className="text-muted-foreground text-sm">
            {context.parentMarriageLabel}
          </p>
          {context.parentMarriageDate ? (
            <p className="text-muted-foreground text-xs">
              Tanggal: {context.parentMarriageDate}
            </p>
          ) : null}
        </div>
      ) : null}

      {showViewerMarriage ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Pernikahan dengan Anda</span>
          <p className="text-muted-foreground text-sm">
            {context.marriageWithViewerLabel}
          </p>
          {context.marriageWithViewerDate ? (
            <p className="text-muted-foreground text-xs">
              Tanggal: {context.marriageWithViewerDate}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
