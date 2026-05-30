import { Prisma } from "@prisma/client"

export function prismaErrorMessage(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null
  }

  switch (error.code) {
    case "P2002":
      return "Data ini sudah ada (duplikat)."
    case "P2003":
      return "Data tidak dapat diubah/dihapus karena masih terhubung dengan data lain."
    default:
      return null
  }
}
