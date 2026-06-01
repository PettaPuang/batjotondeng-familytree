import { auth } from "@/auth"
import { SignOutButton } from "@/components/sign-out-button"

export default async function SilsilahLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userName = session?.user?.name

  return (
    <div className="mx-auto flex h-svh max-w-7xl flex-col gap-4 overflow-hidden p-4 sm:gap-6 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[clamp(1.25rem,4vw,2.25rem)] font-semibold">
            Silsilah Keluarga Puang Batjo Tondeng
          </h1>
          {userName ? (
            <p className="text-muted-foreground text-sm">Selamat datang {userName}</p>
          ) : null}
        </div>

        <SignOutButton />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  )
}
