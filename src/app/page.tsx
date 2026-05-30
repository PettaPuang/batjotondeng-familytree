import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <div className="space-y-1">
          <h1 className="font-heading text-[clamp(0.875rem,3.2vw,1.875rem)] font-semibold whitespace-nowrap">
            Silsilah Keluarga Puang Batjo Tondeng
          </h1>
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-sm leading-snug">
              Asse&apos;re Sikamaseang
            </p>
            <p className="text-muted-foreground text-sm leading-snug">
              Tena Hatang Punna Asse&apos;re Towa
            </p>
          </div>
        </div>

        <Button asChild className="mx-auto w-full max-w-xs" size="sm">
          <Link href="/login">Masuk ke Silsilah</Link>
        </Button>
      </div>
    </div>
  )
}
