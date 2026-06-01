import type { Gender } from "@prisma/client"
import Image from "next/image"

import { getPersonPhotoSrc } from "@/lib/blob/person-photo"
import { genderAvatarClass, getPersonInitials } from "@/lib/silsilah/format"
import { cn } from "@/lib/utils"

type PersonAvatarProps = {
  name: string
  gender: Gender
  photoUrl?: string | null
  size?: "sm" | "md" | "lg"
  shape?: "circle" | "square"
  className?: string
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const

export function PersonAvatar({
  name,
  gender,
  photoUrl,
  size = "md",
  shape = "circle",
  className,
}: PersonAvatarProps) {
  const shapeClassName = shape === "square" ? "rounded-lg" : "rounded-full"
  const photoSrc = getPersonPhotoSrc(photoUrl)

  if (photoSrc) {
    return (
      <span
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden",
          shapeClassName,
          sizeClasses[size],
          className,
        )}
      >
        <Image
          alt={`Foto ${name}`}
          className="object-cover"
          fill
          sizes={size === "lg" ? "56px" : size === "sm" ? "32px" : "40px"}
          src={photoSrc}
          unoptimized
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tracking-wide",
        shapeClassName,
        sizeClasses[size],
        genderAvatarClass(gender),
        className,
      )}
    >
      {getPersonInitials(name)}
    </span>
  )
}
