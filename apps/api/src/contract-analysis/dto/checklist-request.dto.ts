import { CONTRACT_TYPES } from "../data/checklist-data";

/**
 * 계약서 체크리스트 요청 DTO
 * 유효한 계약 유형: 월세, 전세, 매매
 */
export interface ChecklistRequestQuery {
  type: string;
}

export function isValidContractType(type: string): boolean {
  return CONTRACT_TYPES.includes(type);
}

export const VALID_TYPES_MESSAGE = `계약 유형은 ${CONTRACT_TYPES.join(", ")} 중 하나여야 합니다.`;
