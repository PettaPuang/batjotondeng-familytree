"use client"

import Link from "next/link"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import {
  checkNameStepAction,
  checkParentStepAction,
  verifyAndEnter,
} from "@/lib/actions/login.actions"
import { normalizeName } from "@/lib/silsilah/format"
import { cn, isNextRedirectError } from "@/lib/utils"
import { toastMessages } from "@/lib/toast-messages"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const steps = [
  { number: 1, label: "Nama" },
  { number: 2, label: "Orang tua" },
  { number: 3, label: "Tanggal lahir" },
]

type LoginWizardProps = {
  callbackUrl?: string
}

export function LoginWizard({ callbackUrl }: LoginWizardProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [parentName, setParentName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [stepError, setStepError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function validateStep(currentStep: number) {
    if (currentStep === 1) {
      const parts = normalizeName(name).split(" ").filter(Boolean)

      if (parts.length < 1) {
        setStepError("Masukkan nama atau nama panggilan Anda.")
        return false
      }
    }

    if (currentStep === 2 && !parentName.trim()) {
      setStepError("Masukkan nama ayah atau ibu.")
      return false
    }

    if (currentStep === 3 && !birthDate) {
      setStepError("Pilih tanggal lahir.")
      return false
    }

    setStepError(null)
    return true
  }

  function goNext() {
    if (!validateStep(step)) {
      return
    }

    startTransition(async () => {
      if (step === 1) {
        const exists = await checkNameStepAction(name)

        if (!exists) {
          setStepError("Nama tidak ditemukan.")
          return
        }

        setStepError(null)
        setStep(2)
        return
      }

      if (step === 2) {
        const exists = await checkParentStepAction(name, parentName)

        if (!exists) {
          setStepError("Nama orang tua tidak cocok.")
          return
        }

        setStepError(null)
        setStep(3)
      }
    })
  }

  function goBack() {
    setStepError(null)
    setStep((current) => Math.max(current - 1, 1))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateStep(3)) {
      return
    }

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        await verifyAndEnter(formData)
        toast.success(toastMessages.loginSuccess)
      } catch (error) {
        if (isNextRedirectError(error)) {
          toast.success(toastMessages.loginSuccess)
          throw error
        }

        setStepError("Tanggal lahir tidak cocok dengan data.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((item, index) => {
          const active = step === item.number
          const done = step > item.number

          return (
            <li key={item.number} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      done || active ? "bg-primary" : "bg-border",
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}

                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    done || active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {item.number}
                </div>

                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      done ? "bg-primary" : "bg-border",
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>

              <span
                className={cn(
                  "text-center text-xs",
                  active ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </li>
          )
        })}
      </ol>

      {stepError ? (
        <p className="bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm">
          {stepError}
        </p>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {callbackUrl ? (
          <input name="callbackUrl" type="hidden" value={callbackUrl} />
        ) : null}

        <input name="name" type="hidden" value={normalizeName(name)} />
        <input name="parentName" type="hidden" value={normalizeName(parentName)} />

        {step === 1 ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Masukkan nama atau nama panggilan</FieldLabel>
              <Input
                autoComplete="name"
                autoFocus
                id="name"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </Field>

            <Button
              className="w-full"
              disabled={pending}
              onClick={goNext}
              size="sm"
              type="button"
            >
              {pending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Lanjut"
              )}
            </Button>
          </FieldGroup>
        ) : null}

        {step === 2 ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="parentName">Masukkan nama ayah atau ibu</FieldLabel>
              <Input
                autoFocus
                id="parentName"
                onChange={(event) => setParentName(event.target.value)}
                value={parentName}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <Button
                className="w-full"
                disabled={pending}
                onClick={goNext}
                size="sm"
                type="button"
              >
                {pending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Lanjut"
                )}
              </Button>
              <Button className="w-full" onClick={goBack} size="sm" type="button" variant="outline">
                Kembali
              </Button>
            </div>
          </FieldGroup>
        ) : null}

        {step === 3 ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="birthDate">Masukkan tanggal lahir</FieldLabel>
              <DatePicker
                id="birthDate"
                name="birthDate"
                onChange={setBirthDate}
                placeholder=""
                required
                value={birthDate}
              />
            </Field>

            <div className="rounded-md border p-4 text-sm">
              <p className="text-muted-foreground mb-2">Ringkasan:</p>
              <p>Nama: {name.trim()}</p>
              <p>Orang tua: {parentName.trim()}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Button className="w-full" disabled={pending} size="sm" type="submit">
                {pending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk ke Silsilah"
                )}
              </Button>
              <Button
                className="w-full"
                disabled={pending}
                onClick={goBack}
                size="sm"
                type="button"
                variant="outline"
              >
                Kembali
              </Button>
            </div>
          </FieldGroup>
        ) : null}
      </form>

      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  )
}
