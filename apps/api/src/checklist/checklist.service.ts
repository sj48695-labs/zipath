import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChecklistTemplate, ChecklistItem } from "@zipath/db";

interface ChecklistSeedItem {
  category: string;
  content: string;
  isRequired: boolean;
}

interface ChecklistSeed {
  title: string;
  items: ChecklistSeedItem[];
}

const SEED_DATA: Record<string, ChecklistSeed> = {
  rent: {
    title: "월세 계약 체크리스트",
    items: [
      { category: "서류 확인", content: "등기부등본 확인 (소유자, 근저당 설정)", isRequired: true },
      { category: "서류 확인", content: "건축물대장 확인 (불법건축물 여부)", isRequired: true },
      { category: "서류 확인", content: "임대인 신분증 확인", isRequired: true },
      { category: "현장 확인", content: "수도/전기/가스 정상 작동 확인", isRequired: true },
      { category: "현장 확인", content: "곰팡이, 누수 흔적 확인", isRequired: true },
      { category: "현장 확인", content: "방음 상태 확인", isRequired: false },
      { category: "계약 조건", content: "보증금 및 월세 금액 확인", isRequired: true },
      { category: "계약 조건", content: "관리비 포함 항목 확인", isRequired: true },
      { category: "계약 조건", content: "계약 기간 및 갱신 조건 확인", isRequired: true },
      { category: "계약 조건", content: "특약사항 기재 (원상복구 범위 등)", isRequired: false },
    ],
  },
  jeonse: {
    title: "전세 계약 체크리스트",
    items: [
      { category: "서류 확인", content: "등기부등본 확인 (근저당, 가압류 등)", isRequired: true },
      { category: "서류 확인", content: "건축물대장 확인", isRequired: true },
      { category: "서류 확인", content: "임대인 신분증 및 인감증명서 확인", isRequired: true },
      { category: "서류 확인", content: "국세/지방세 완납증명서 확인", isRequired: true },
      { category: "안전장치", content: "전세보증보험 가입 가능 여부 확인", isRequired: true },
      { category: "안전장치", content: "전입신고 및 확정일자 즉시 진행", isRequired: true },
      { category: "현장 확인", content: "주택 상태 점검 (누수, 결로 등)", isRequired: true },
      { category: "계약 조건", content: "보증금 반환 조건 확인", isRequired: true },
      { category: "계약 조건", content: "계약 갱신청구권 안내 확인", isRequired: true },
    ],
  },
  buy: {
    title: "매매 계약 체크리스트",
    items: [
      { category: "서류 확인", content: "등기부등본 확인 (소유권, 근저당, 가압류)", isRequired: true },
      { category: "서류 확인", content: "건축물대장 확인 (용도, 면적, 위반건축물)", isRequired: true },
      { category: "서류 확인", content: "토지이용계획확인서 확인", isRequired: true },
      { category: "서류 확인", content: "매도인 신분증 및 인감증명서 확인", isRequired: true },
      { category: "자금 계획", content: "대출 사전승인 확인", isRequired: true },
      { category: "자금 계획", content: "취득세 및 부대비용 계산", isRequired: true },
      { category: "현장 확인", content: "주택 내부 상태 점검", isRequired: true },
      { category: "현장 확인", content: "주변 환경 및 소음 확인", isRequired: false },
      { category: "계약 조건", content: "계약금/중도금/잔금 일정 확인", isRequired: true },
      { category: "계약 조건", content: "소유권 이전 등기 일정 확인", isRequired: true },
      { category: "계약 조건", content: "하자 보수 책임 범위 확인", isRequired: false },
    ],
  },
};

@Injectable()
export class ChecklistService implements OnModuleInit {
  private readonly logger = new Logger(ChecklistService.name);

  constructor(
    @InjectRepository(ChecklistTemplate)
    private readonly templateRepo: Repository<ChecklistTemplate>,
    @InjectRepository(ChecklistItem)
    private readonly itemRepo: Repository<ChecklistItem>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.templateRepo.count();
      if (count > 0) return;

      this.logger.log("체크리스트 시드 데이터 삽입 시작...");

      for (const [type, seed] of Object.entries(SEED_DATA)) {
        const template = this.templateRepo.create({ type, title: seed.title });
        const saved = await this.templateRepo.save(template);

        const items = seed.items.map((item, index) =>
          this.itemRepo.create({
            templateId: saved.id,
            order: index + 1,
            content: item.content,
            category: item.category,
            isRequired: item.isRequired,
          }),
        );
        await this.itemRepo.save(items);
      }

      this.logger.log("체크리스트 시드 데이터 삽입 완료");
    } catch (err) {
      this.logger.warn("체크리스트 시드 삽입 실패 — fallback 데이터 사용", err);
    }
  }

  async getByType(type: string) {
    try {
      const template = await this.templateRepo.findOne({
        where: { type },
        relations: ["items"],
      });

      if (template) {
        const sortedItems = template.items
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            category: item.category ?? "",
            content: item.content,
            isRequired: item.isRequired,
          }));
        return { title: template.title, items: sortedItems };
      }
    } catch {
      this.logger.warn("DB 조회 실패 — fallback 데이터 사용");
    }

    const fallback = SEED_DATA[type];
    if (!fallback) {
      throw new NotFoundException(
        `체크리스트 유형 '${type}'을 찾을 수 없습니다. (rent, jeonse, buy 중 선택)`,
      );
    }
    return fallback;
  }
}
