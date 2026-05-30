export const toastMessages = {
  personCreated: "Anggota berhasil ditambahkan.",
  personUpdated: "Data anggota berhasil disimpan.",
  personDeleted: "Anggota berhasil dihapus.",
  marriageCreated: "Pernikahan berhasil disimpan.",
  parentLinked: "Relasi orang tua berhasil disimpan.",
  signedOut: "Anda telah keluar.",
  loginSuccess: "Berhasil masuk. Mengalihkan ke silsilah…",
  loginFailed:
    "Data tidak cocok. Periksa nama (atau nama panggilan), nama orang tua, dan tanggal lahir.",
  photoUploaded: "Foto berhasil diunggah.",
  photoUploadFailed: "Gagal mengunggah foto.",
  defaultError: "Terjadi kesalahan. Coba lagi.",
} as const

/** Pesan toast gagal login — satu teks untuk wizard, server action, dan query ?error=. */
export function resolveLoginErrorMessage() {
  return toastMessages.loginFailed
}
