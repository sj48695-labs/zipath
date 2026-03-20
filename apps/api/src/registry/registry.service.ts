import { Injectable } from "@nestjs/common";

export interface RegistryOwnership {
  order: number;
  type: string;
  holder: string;
  date: string;
  cause: string;
}

export interface RegistryRightItem {
  order: number;
  type: string;
  holder: string;
  amount: string | null;
  date: string;
  riskLevel: "safe" | "caution" | "danger";
  explanation: string;
}

@Injectable()
export class RegistryService {
  analyze(address: string) {
    // 시뮬레이션용 분석 데이터 생성
    const gap = this.generateGapSection(address);
    const eul = this.generateEulSection(address);

    const hasHighRisk = eul.items.some((item) => item.riskLevel === "danger");
    const hasMediumRisk = eul.items.some(
      (item) => item.riskLevel === "caution",
    );

    let overallRisk: "safe" | "caution" | "danger" = "safe";
    if (hasHighRisk) overallRisk = "danger";
    else if (hasMediumRisk) overallRisk = "caution";

    const warnings: string[] = [];
    const tips: string[] = [];

    // 위험 요소 분석
    for (const item of eul.items) {
      if (item.type === "근저당권") {
        warnings.push(
          `근저당권 설정: ${item.holder}에게 ${item.amount} 설정됨 - 경매 시 우선 변제됨`,
        );
        tips.push(
          "근저당 금액이 시세의 60% 이상이면 전세사기 위험이 높습니다",
        );
      }
      if (item.type === "가압류") {
        warnings.push(
          `가압류 설정: 소유자에게 채무 분쟁이 있을 수 있습니다`,
        );
        tips.push(
          "가압류가 있는 물건은 계약을 피하는 것이 안전합니다",
        );
      }
      if (item.type === "가처분") {
        warnings.push(
          `가처분 등기: 소유권에 대한 법적 다툼이 진행 중일 수 있습니다`,
        );
        tips.push(
          "가처분이 있으면 소유권 이전이 제한될 수 있습니다",
        );
      }
      if (item.type === "전세권") {
        warnings.push(`전세권 설정: 기존 전세 세입자가 있습니다`);
      }
    }

    if (warnings.length === 0) {
      tips.push(
        "특별한 위험 요소가 발견되지 않았습니다. 그래도 계약 전 최신 등기부등본을 반드시 확인하세요.",
      );
    }

    tips.push(
      "등기부등본은 계약 당일 발급본을 기준으로 확인해야 합니다",
    );
    tips.push(
      "전세 계약 시 보증금이 시세의 70% 이하인지 확인하세요",
    );

    const riskSummary =
      overallRisk === "safe"
        ? "현재 등기부상 특별한 위험 요소가 없습니다."
        : overallRisk === "caution"
          ? "주의가 필요한 항목이 있습니다. 전문가 상담을 권장합니다."
          : "위험 요소가 발견되었습니다. 계약 전 반드시 전문가와 상담하세요.";

    return {
      address,
      analysisDate: new Date().toISOString().split("T")[0],
      overallRisk,
      riskSummary,
      gap: {
        items: gap,
        summary: `소유자 변동 이력 ${gap.length}건`,
      },
      eul: {
        items: eul.items,
        summary: `권리 설정 ${eul.items.length}건 (위험: ${eul.items.filter((i) => i.riskLevel === "danger").length}건)`,
      },
      warnings,
      tips,
      disclaimer:
        "본 분석은 참고용이며 법적 효력이 없습니다. 실제 거래 시 반드시 공인중개사 또는 법률 전문가의 확인을 받으세요.",
    };
  }

  getTermExplanations() {
    return [
      {
        term: "갑구",
        description: "소유권에 관한 사항을 기록하는 곳",
        detail:
          "부동산의 주인이 누구인지, 언제 바뀌었는지를 보여줍니다. 소유권이전, 가압류, 가처분 등이 여기에 기록됩니다.",
      },
      {
        term: "을구",
        description: "소유권 이외의 권리에 관한 사항",
        detail:
          "근저당권(은행 대출), 전세권, 지상권 등이 여기에 기록됩니다. 빚이 얼마나 있는지 확인할 수 있는 중요한 부분입니다.",
      },
      {
        term: "근저당권",
        description:
          "은행 등에서 돈을 빌릴 때 부동산을 담보로 설정한 것",
        detail:
          "집주인이 은행에서 대출을 받으면 설정됩니다. 경매 시 근저당권자가 먼저 돈을 가져갑니다. 전세 계약 시 근저당 금액을 반드시 확인하세요.",
      },
      {
        term: "가압류",
        description:
          "채권자가 채무자의 재산을 보전하기 위해 법원에 신청한 것",
        detail:
          "집주인이 다른 곳에 빚이 있어서 법원이 재산 처분을 막아둔 것입니다. 가압류가 있는 집은 매우 위험할 수 있습니다.",
      },
      {
        term: "가처분",
        description:
          "소유권 등에 대한 법적 다툼이 있을 때 권리를 보전하는 것",
        detail:
          "이 집의 소유권에 대해 법적 분쟁이 진행 중일 수 있습니다. 가처분이 있으면 소유권 이전이 어려울 수 있습니다.",
      },
      {
        term: "전세권",
        description:
          "전세 보증금을 법적으로 보호받기 위해 등기한 것",
        detail:
          "전세 계약을 등기부에 기록한 것입니다. 전세권이 설정되어 있다면 기존 세입자가 있다는 뜻입니다.",
      },
      {
        term: "소유권이전",
        description: "부동산 소유자가 바뀐 기록",
        detail:
          "매매, 상속, 증여 등으로 주인이 바뀔 때 기록됩니다. 소유자가 자주 바뀌었다면 투기 목적일 수 있습니다.",
      },
    ];
  }

  private generateGapSection(address: string): RegistryOwnership[] {
    // 시뮬레이션 데이터 (주소 해시 기반으로 다양한 결과 생성)
    const seed = this.hashCode(address);
    const ownerCount = (seed % 3) + 1;

    const causes = ["매매", "상속", "증여", "매매", "매매"];
    const items: RegistryOwnership[] = [];

    for (let i = 0; i < ownerCount; i++) {
      const year = 2020 + i;
      items.push({
        order: i + 1,
        type: i === 0 ? "소유권보존" : "소유권이전",
        holder: `소유자${i + 1} (개인정보 보호)`,
        date: `${year}-${String((seed % 12) + 1).padStart(2, "0")}-15`,
        cause: causes[(seed + i) % causes.length],
      });
    }

    return items;
  }

  private generateEulSection(address: string): {
    items: RegistryRightItem[];
  } {
    const seed = this.hashCode(address);
    const items: RegistryRightItem[] = [];
    let order = 1;

    // 근저당 (대부분의 물건에 있음)
    if (seed % 3 !== 0) {
      const amount = ((seed % 5) + 1) * 10000;
      items.push({
        order: order++,
        type: "근저당권",
        holder: "OO은행",
        amount: `${amount.toLocaleString()}만원`,
        date: "2023-03-15",
        riskLevel: amount > 30000 ? "danger" : "caution",
        explanation: `은행 대출 담보로 ${amount.toLocaleString()}만원이 설정되어 있습니다. 경매 시 이 금액이 먼저 변제됩니다.`,
      });
    }

    // 가압류 (일부 물건에만)
    if (seed % 7 === 0) {
      items.push({
        order: order++,
        type: "가압류",
        holder: "OO (채권자)",
        amount: `${((seed % 3) + 1) * 5000}만원`,
        date: "2024-06-20",
        riskLevel: "danger",
        explanation:
          "집주인에게 채무 분쟁이 있어 법원이 재산 처분을 제한한 상태입니다. 매우 주의가 필요합니다.",
      });
    }

    // 전세권 (일부 물건)
    if (seed % 4 === 1) {
      items.push({
        order: order++,
        type: "전세권",
        holder: "OO (세입자)",
        amount: `${((seed % 4) + 1) * 10000}만원`,
        date: "2024-01-10",
        riskLevel: "caution",
        explanation:
          "기존 전세 세입자가 있습니다. 전세권이 말소되었는지 확인이 필요합니다.",
      });
    }

    if (items.length === 0) {
      // 깨끗한 등기부
      items.push({
        order: 1,
        type: "설정 없음",
        holder: "-",
        amount: null,
        date: "-",
        riskLevel: "safe",
        explanation:
          "을구에 등록된 권리 설정이 없습니다. 비교적 안전한 물건입니다.",
      });
    }

    return { items };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
