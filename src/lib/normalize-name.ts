const UNICODE_SPACES = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g

function cleanToken(token: string) {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
}

/** Normalisasi nama: spasi berlebih, huruf kapital, tanda baca di ujung kata. */
export function normalizeName(name: string) {
  return name
    .normalize("NFKC")
    .replace(UNICODE_SPACES, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(cleanToken)
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("id")
}

export function namesMatch(a: string, b: string) {
  return normalizeName(a) === normalizeName(b)
}
