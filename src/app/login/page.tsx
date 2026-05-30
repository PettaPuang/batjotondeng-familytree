import { LoginWizard } from "@/components/silsilah/login-wizard"
import { LoginErrorToast } from "@/components/login-error-toast"

type LoginPageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callbackUrl } = await searchParams

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm">Silsilah Puang Batjo Tondeng</p>
        <h1 className="font-heading text-2xl font-semibold">Masuk ke Silsilah</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Ikuti 3 langkah mudah untuk mengakses silsilah keluarga.
        </p>
      </div>

      <LoginErrorToast error={error} />
      <LoginWizard callbackUrl={callbackUrl} />
    </div>
  )
}
