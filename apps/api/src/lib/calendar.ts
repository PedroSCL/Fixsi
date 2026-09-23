export const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  if (!DATE_ONLY.test(value)) {
    throw new Error("Data inválida");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || formatDateOnly(date) !== value) {
    throw new Error("Data inválida");
  }
  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayUtc(now = new Date()): Date {
  // A agenda é brasileira. Render e outros provedores executam em UTC, que já
  // está no dia seguinte a partir das 21h em parte do ano no Brasil.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return parseDateOnly(`${value.year}-${value.month}-${value.day}`);
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function isDateAvailable(
  date: Date,
  weekdays: number[],
  exceptions: Map<string, boolean>,
): boolean {
  const override = exceptions.get(formatDateOnly(date));
  return override ?? weekdays.includes(date.getUTCDay());
}
