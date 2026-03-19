import { Injectable, NotFoundException } from "@nestjs/common";
import { CHECKLIST_DATA, CONTRACT_TYPES } from "./data/checklist-data";

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  why: string;
  isRequired: boolean;
  tip?: string;
}

export interface ContractChecklist {
  contractType: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

@Injectable()
export class ContractAnalysisService {
  getChecklist(type: string): ContractChecklist {
    const checklist = CHECKLIST_DATA[type];
    if (!checklist) {
      throw new NotFoundException(
        `계약 유형 '${type}'을 찾을 수 없습니다. (${CONTRACT_TYPES.join(", ")} 중 선택)`,
      );
    }
    return checklist;
  }

  getContractTypes(): string[] {
    return CONTRACT_TYPES;
  }

  getSummary(type: string): { total: number; required: number; categories: string[] } {
    const checklist = this.getChecklist(type);
    const required = checklist.items.filter((item) => item.isRequired).length;
    const categories = [...new Set(checklist.items.map((item) => item.category))];
    return {
      total: checklist.items.length,
      required,
      categories,
    };
  }
}
