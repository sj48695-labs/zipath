import { BadRequestException } from "@nestjs/common";
import { ContractAnalysisService } from "./contract-analysis.service";

describe("ContractAnalysisService - analyzeText", () => {
  let service: ContractAnalysisService;

  beforeEach(() => {
    service = new ContractAnalysisService();
  });

  it("월세 텍스트에서 보증금/월세/계약기간 조항을 검출한다", () => {
    const text =
      "임대인과 임차인은 다음과 같이 임대차계약을 체결한다. 보증금 1,000만원, 월세 50만원, 계약기간 2년으로 한다. 소재지: 서울시 강남구.";
    const result = service.analyzeText("월세", text);

    const deposit = result.clauses.find((c) => c.id === "deposit");
    const rent = result.clauses.find((c) => c.id === "monthly-rent");
    const period = result.clauses.find((c) => c.id === "contract-period");

    expect(deposit?.detected).toBe(true);
    expect(rent?.detected).toBe(true);
    expect(period?.detected).toBe(true);
    expect(deposit?.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("필수 조항이 누락되면 missingRequired 와 riskLevel 에 반영한다", () => {
    // 보증금만 있고 당사자/소재지/월세/계약기간 등 누락
    const text = "보증금 일천만원으로 한다.";
    const result = service.analyzeText("월세", text);

    expect(result.missingRequired.length).toBeGreaterThan(0);
    expect(result.riskLevel).toBe("danger");
  });

  it("모든 필수 조항이 검출되면 riskLevel 이 safe 다", () => {
    const text =
      "임대인 홍길동, 임차인 김철수. 소재지 서울시 강남구. 보증금 1억원, 월세 60만원, 관리비 5만원, 계약기간 2024년부터 2년. 특약사항: 원상복구 범위 명시.";
    const result = service.analyzeText("월세", text);

    expect(result.missingRequired).toHaveLength(0);
    expect(result.riskLevel).toBe("safe");
  });

  it("전세 텍스트에서 전세금/보증금 반환 조항을 검출한다", () => {
    const text =
      "임대인과 임차인은 전세금 3억원으로 임대차계약을 체결한다. 소재지 서울. 계약기간 2년. 보증금 반환은 계약 만료 시 즉시 한다.";
    const result = service.analyzeText("전세", text);

    expect(result.clauses.find((c) => c.id === "deposit")?.detected).toBe(true);
    expect(result.clauses.find((c) => c.id === "deposit-return")?.detected).toBe(
      true,
    );
  });

  it("매매 텍스트에서 매매대금/잔금/소유권이전 조항을 검출한다", () => {
    const text =
      "매도인과 매수인은 매매대금 5억원에 매매계약을 체결한다. 소재지 서울. 계약금 5천만원, 중도금, 잔금 일정에 따라 지급. 소유권이전 등기는 잔금일에 진행한다.";
    const result = service.analyzeText("매매", text);

    expect(result.clauses.find((c) => c.id === "sale-price")?.detected).toBe(
      true,
    );
    expect(
      result.clauses.find((c) => c.id === "payment-schedule")?.detected,
    ).toBe(true);
    expect(
      result.clauses.find((c) => c.id === "ownership-transfer")?.detected,
    ).toBe(true);
  });

  it("결과에 법적 고지(disclaimer)를 포함한다", () => {
    const result = service.analyzeText("월세", "보증금 100만원");
    expect(result.disclaimer).toContain("참고용");
    expect(result.disclaimer).toContain("법적 효력");
  });

  it("detectedCount 는 검출된 조항 수와 일치한다", () => {
    const text = "보증금 1000만원, 월세 50만원";
    const result = service.analyzeText("월세", text);
    const detected = result.clauses.filter((c) => c.detected).length;
    expect(result.detectedCount).toBe(detected);
  });

  it("알 수 없는 계약 유형은 BadRequestException 을 던진다", () => {
    expect(() => service.analyzeText("리스", "텍스트")).toThrow(
      BadRequestException,
    );
  });

  it("빈 텍스트는 BadRequestException 을 던진다", () => {
    expect(() => service.analyzeText("월세", "   ")).toThrow(
      BadRequestException,
    );
  });
});
