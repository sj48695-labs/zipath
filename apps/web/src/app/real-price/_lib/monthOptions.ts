export interface MonthOption {
  value: string;
  label: string;
}

export function buildRecentMonthOptions(
  referenceDate: Date,
  count = 12,
): MonthOption[] {
  const options: MonthOption[] = [];

  for (let index = 0; index < count; index += 1) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - index,
      1,
    );
    const month = String(date.getMonth() + 1).padStart(2, "0");

    options.push({
      value: `${date.getFullYear()}${month}`,
      label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
    });
  }

  return options;
}
