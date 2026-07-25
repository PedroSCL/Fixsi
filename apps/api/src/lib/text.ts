export function textVariants(value: string) {
  const trimmed = value.trim();
  const withoutAccents = trimmed
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return [...new Set([trimmed, withoutAccents])];
}
