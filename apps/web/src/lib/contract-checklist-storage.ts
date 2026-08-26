const CHECKED_ITEMS_STORAGE_PREFIX = "contract-checklist-checked";

type ContractType = "월세" | "전세" | "매매";

function storageKey(type: ContractType): string {
  return `${CHECKED_ITEMS_STORAGE_PREFIX}:${type}`;
}

export function readCheckedItems(type: ContractType): Set<string> {
  try {
    const saved = window.localStorage.getItem(storageKey(type));
    if (!saved) return new Set();
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? new Set(parsed)
      : new Set();
  } catch {
    return new Set();
  }
}

export function saveCheckedItems(type: ContractType, checked: Set<string>): void {
  try {
    window.localStorage.setItem(storageKey(type), JSON.stringify([...checked]));
  } catch {
    // 저장소를 사용할 수 없어도 체크리스트 확인은 계속할 수 있다.
  }
}
