const DATE_ONLY_RE = /^(\d{4})-?(\d{2})-?(\d{2})/;
const SEOUL_TIME_ZONE = "Asia/Seoul";

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}

function parseDateOnly(value: string): DateParts | null {
  const match = DATE_ONLY_RE.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };

  if (!isValidDateParts(parts)) return null;

  return parts;
}

function isValidDateParts({ year, month, day }: DateParts): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseZonedDateTime(value: string): DateParts | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return parseDateOnly(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));
  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));

  if ([year, month, day, hour, minute].some(Number.isNaN)) return null;

  return { year, month, day, hour, minute };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDotDate(value: string | null | undefined): string {
  if (!value) return "-";
  const parts = parseDateOnly(value);
  if (!parts) return "-";
  return `${parts.year}.${pad2(parts.month)}.${pad2(parts.day)}`;
}

export function formatKoreanDate(value: string | null | undefined): string {
  if (!value) return "-";
  const parts = parseDateOnly(value);
  if (!parts) return "-";
  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
}

export function formatKoreanDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const parts = parseZonedDateTime(value);
  if (!parts || parts.hour === undefined || parts.minute === undefined) {
    return formatKoreanDate(value);
  }
  return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${pad2(
    parts.hour,
  )}:${pad2(parts.minute)}`;
}

export function getTodayKey(date = new Date()): string {
  const parts = parseZonedDateTime(date.toISOString());
  if (!parts) return "";
  return `${parts.year}${pad2(parts.month)}${pad2(parts.day)}`;
}

export function getDateKey(value: string | null | undefined): string {
  if (!value) return "";
  const parts = parseDateOnly(value);
  if (!parts) return "";
  return `${parts.year}${pad2(parts.month)}${pad2(parts.day)}`;
}

export function isDateOnOrAfterToday(
  value: string | null | undefined,
  todayKey: string,
): boolean {
  const dateKey = getDateKey(value);
  return Boolean(dateKey && todayKey && dateKey >= todayKey);
}
