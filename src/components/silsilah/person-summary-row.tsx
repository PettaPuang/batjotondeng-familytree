import type { Gender } from "@prisma/client"

import { PersonAvatar } from "@/components/silsilah/person-avatar"
import {
  formatBirthWithAge,
  formatDateCompact,
  getDisplayAge,
} from "@/lib/silsilah/format"
import { formatPersonTreeName } from "@/lib/silsilah/person-display"
import { cn } from "@/lib/utils"

type PersonSummaryRowProps = {
  name: string
  gender: Gender
  isAlive: boolean
  birthDate?: Date | string | null
  deathDate?: Date | string | null
  photoUrl?: string | null
  avatarSize?: "sm" | "md" | "lg"
  /** Kartu daftar samping: lebih padat di mobile, ukuran normal dari `lg` */
  variant?: "default" | "sidebar"
  className?: string
}

function BirthMeta({
  age,
  birthDate,
  className,
  compactDate,
  deathDate,
  isAlive,
  splitAge,
}: {
  birthDate?: Date | string | null
  deathDate?: Date | string | null
  isAlive: boolean
  compactDate?: boolean
  splitAge?: boolean
  age: number | null
  className?: string
}) {
  const ageOptions = { deathDate, isAlive }
  const fullLine = formatBirthWithAge(birthDate, ageOptions)
  const compactLine = formatBirthWithAge(birthDate, {
    ...ageOptions,
    compact: true,
  })
  const dateLabel = compactDate ? formatDateCompact(birthDate) : fullLine

  if (splitAge && age !== null) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex min-w-0 items-center gap-1 leading-tight",
          className,
        )}
        title={fullLine}
      >
        <span className="min-w-0 truncate">{dateLabel}</span>
        <span className="shrink-0 opacity-60">·</span>
        <span className="shrink-0 tabular-nums">{age} thn</span>
      </div>
    )
  }

  return (
    <p className={cn("text-muted-foreground truncate leading-snug", className)} title={fullLine}>
      {compactDate ? compactLine : fullLine}
    </p>
  )
}

export function PersonSummaryRow({
  name,
  gender,
  isAlive,
  birthDate,
  deathDate,
  photoUrl,
  avatarSize = "md",
  variant = "default",
  className,
}: PersonSummaryRowProps) {
  const displayName = formatPersonTreeName(name, gender, isAlive)
  const age = getDisplayAge(birthDate, { deathDate, isAlive })
  const isSidebar = variant === "sidebar"
  const resolvedAvatarSize =
    avatarSize !== "md" ? avatarSize : isSidebar ? "sm" : "md"

  return (
    <div
      className={cn(
        "flex min-w-0 items-center",
        isSidebar ? "gap-2 lg:gap-3" : "gap-3",
        className,
      )}
    >
      <PersonAvatar
        className={isSidebar ? "size-7 text-[11px] lg:size-10 lg:text-sm" : undefined}
        gender={gender}
        name={name}
        photoUrl={photoUrl}
        shape="square"
        size={resolvedAvatarSize}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate leading-snug font-semibold whitespace-nowrap",
            isSidebar ? "text-xs lg:text-sm" : "text-sm",
          )}
          title={displayName}
        >
          {displayName}
        </p>

        {isSidebar ? (
          <>
            <BirthMeta
              age={age}
              birthDate={birthDate}
              className="text-[11px] lg:hidden"
              compactDate
              deathDate={deathDate}
              isAlive={isAlive}
              splitAge
            />
            <BirthMeta
              age={age}
              birthDate={birthDate}
              className="hidden text-xs lg:block"
              deathDate={deathDate}
              isAlive={isAlive}
            />
          </>
        ) : (
          <BirthMeta
            age={age}
            birthDate={birthDate}
            className="text-[11px] leading-tight lg:text-xs"
            compactDate
            deathDate={deathDate}
            isAlive={isAlive}
          />
        )}
      </div>
    </div>
  )
}
