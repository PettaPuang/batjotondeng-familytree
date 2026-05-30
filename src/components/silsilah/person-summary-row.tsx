import type { Gender } from "@prisma/client"

import { PersonAvatar } from "@/components/silsilah/person-avatar"
import { formatBirthWithAge } from "@/lib/silsilah/format"
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
  const birthLine = formatBirthWithAge(birthDate, { deathDate, isAlive })
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
        className={isSidebar ? "size-7 text-2.75 lg:size-10 lg:text-sm" : undefined}
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
        <p
          className={cn(
            "text-muted-foreground truncate leading-snug",
            isSidebar ? "text-2.75 lg:text-xs" : "text-xs",
          )}
          title={birthLine}
        >
          {birthLine}
        </p>
      </div>
    </div>
  )
}
