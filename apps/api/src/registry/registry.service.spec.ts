import { Test, TestingModule } from "@nestjs/testing";
import { RegistryService } from "./registry.service";

// 주소 해시(hashCode)에 따라 결정적 결과가 나오므로, 분석 분기별로
// 미리 검증된 주소 케이스를 사용한다.
const DANGER_ADDRESS = "서울특별시 강남구 테헤란로 152"; // 근저당 5만만원 → danger
const SAFE_ADDRESS = "서울 마포구 월드컵로 100"; // 권리 설정 없음 → safe

describe("RegistryService", () => {
  let service: RegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistryService],
    }).compile();

    service = module.get<RegistryService>(RegistryService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("analyze", () => {
    it("should return the full analysis structure with required fields", () => {
      const result = service.analyze(SAFE_ADDRESS);

      expect(result.address).toBe(SAFE_ADDRESS);
      expect(["safe", "caution", "danger"]).toContain(result.overallRisk);
      expect(result.gap).toHaveProperty("items");
      expect(result.eul).toHaveProperty("items");
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.tips)).toBe(true);
      expect(result.analysisDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should include the legal disclaimer", () => {
      const result = service.analyze(SAFE_ADDRESS);

      expect(result.disclaimer).toContain("참고용");
      expect(result.disclaimer).toContain("법적 효력");
    });

    it("should mark overallRisk as danger when a danger-level right exists", () => {
      const result = service.analyze(DANGER_ADDRESS);

      const hasDanger = result.eul.items.some(
        (item) => item.riskLevel === "danger",
      );
      expect(hasDanger).toBe(true);
      expect(result.overallRisk).toBe("danger");
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should return safe with no right settings for a clean property", () => {
      const result = service.analyze(SAFE_ADDRESS);

      expect(result.overallRisk).toBe("safe");
      expect(result.eul.items[0].type).toBe("설정 없음");
      expect(result.warnings).toHaveLength(0);
    });

    it("should be deterministic for the same address", () => {
      const a = service.analyze(DANGER_ADDRESS);
      const b = service.analyze(DANGER_ADDRESS);

      expect(a.overallRisk).toBe(b.overallRisk);
      expect(a.eul.items.length).toBe(b.eul.items.length);
    });
  });

  describe("getTermExplanations", () => {
    it("should return core registry term explanations", () => {
      const terms = service.getTermExplanations();
      const termNames = terms.map((t) => t.term);

      expect(termNames).toEqual(
        expect.arrayContaining(["갑구", "을구", "근저당권"]),
      );
      for (const t of terms) {
        expect(t).toHaveProperty("description");
        expect(t).toHaveProperty("detail");
      }
    });
  });
});
