export const MANAGE_FORBIDDEN_MESSAGE =
  "Anda tidak memiliki izin untuk mengubah data anggota ini. Izin hanya untuk diri sendiri, orang tua, anak, saudara kandung, atau pasangan."

export class ManageForbiddenError extends Error {
  constructor(message = MANAGE_FORBIDDEN_MESSAGE) {
    super(message)
    this.name = "ManageForbiddenError"
  }
}
