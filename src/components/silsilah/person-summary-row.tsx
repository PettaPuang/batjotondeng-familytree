import type { Gender } from "@prisma/client"

import { PersonAvatar } from "@/components/silsilah/person-avatar"
import {
  formatPersonCardSubtitle,
  formatPersonTreeName,
} from "@/lib/silsilah/format"
import { cn } from "@/lib/utils"

type PersonSummaryRowProps = {
  name: string
  gender: Gender
  isAlive: boolean
  nickname?: string | null
  age?: number | null
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
  nickname,
  age,
  photoUrl,
  avatarSize = "md",
  variant = "default",
  className,
}: PersonSummaryRowProps) {
  const displayName = formatPersonTreeName(name, gender, isAlive)
  const isSidebar = variant === "sidebar"
  const resolvedAvatarSize =
    avatarSize !== "md" ? avatarSize : isSidebar ? "sm" : "md"
  const subtitle = formatPersonCardSubtitle(nickname, age)

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
        {subtitle ? (
          <p
            className={cn(
              "text-muted-foreground truncate leading-tight tabular-nums",
              "text-xs",
            )}
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}
