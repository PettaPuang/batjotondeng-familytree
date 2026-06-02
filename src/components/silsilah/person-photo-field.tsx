"use client"

import { useRef, useState } from "react"
import type { Gender } from "@prisma/client"
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react"

import { uploadPersonPhoto } from "@/lib/actions/silsilah.actions"
import { PersonAvatar } from "@/components/silsilah/person-avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { toastMessages } from "@/lib/toast-messages"
import { cn } from "@/lib/utils"

type PersonPhotoFieldProps = {
  defaultPhotoUrl?: string | null
  gender: Gender | ""
  name: string
  idPrefix?: string
  layout?: "default" | "detail"
}

export function PersonPhotoField({
  defaultPhotoUrl,
  gender,
  name,
  idPrefix = "",
  layout = "default",
}: PersonPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState(defaultPhotoUrl ?? "")
  const [uploading, setUploading] = useState(false)

  const displayGender = gender === "MALE" || gender === "FEMALE" ? gender : "MALE"
  const displayName = name.trim() || "Anggota"

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setUploading(true)

    try {
      const body = new FormData()
      body.set("file", file)

      const result = await uploadPersonPhoto(body)

      if (!result.success || !result.data?.url) {
        throw new Error(result.message)
      }

      setPhotoUrl(result.data.url)
      toast.success(toastMessages.photoUploaded)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : toastMessages.photoUploadFailed)
    } finally {
      setUploading(false)
    }
  }

  const controls = (
    <div className="flex flex-col gap-3">
      <input name="photoUrl" type="hidden" value={photoUrl} />

      <div className="flex flex-wrap items-center gap-3">
        <PersonAvatar
          gender={displayGender}
          name={displayName}
          photoUrl={photoUrl || null}
          shape="square"
          size="lg"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            {uploading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <ImagePlusIcon />
                {photoUrl ? "Ganti foto" : "Unggah foto"}
              </>
            )}
          </Button>

          {photoUrl ? (
            <Button
              disabled={uploading}
              onClick={() => setPhotoUrl("")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <XIcon />
              Hapus
            </Button>
          ) : null}
        </div>
      </div>

      <input
        accept="image/jpeg,image/png,image/webp"
        aria-label="Unggah foto"
        className="sr-only"
        id={`${idPrefix}photoFile`}
        onChange={(event) => void handleFileChange(event)}
        ref={inputRef}
        type="file"
      />
    </div>
  )

  if (layout === "detail") {
    return (
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
        <span className="text-muted-foreground col-span-1 pt-2 text-sm">Foto</span>
        <div className={cn("col-span-2", uploading && "opacity-70")}>{controls}</div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", uploading && "opacity-70")}>
      <span className="text-sm font-medium">Foto</span>
      {controls}
    </div>
  )
}
