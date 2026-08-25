import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ContractAnalysisService } from "../src/contract-analysis/contract-analysis.service";

describe("ContractAnalysisService", () => {
  let service: ContractAnalysisService;

  beforeEach(() => {
    service = new ContractAnalysisService();
  });

  // ----- getContractTypes -----
  describe("getContractTypes", () => {
    it("should return all contract types", () => {
      const types = service.getContractTypes();

      expect(types).toContain("월세");
      expect(types).toContain("전세");
      expect(types).toContain("매매");
      expect(types).toHaveLength(3);
    });
  });

  // ----- getChecklist -----
  describe("getChecklist", () => {
    it("should return 월세 checklist", () => {
      const result = service.getChecklist("월세");

      expect(result.contractType).toBe("월세");
      expect(result.title).toContain("월세");
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should return 전세 checklist", () => {
      const result = service.getChecklist("전세");

      expect(result.contractType).toBe("전세");
      expect(result.title).toContain("전세");
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should return 매매 checklist", () => {
      const result = service.getChecklist("매매");

      expect(result.contractType).toBe("매매");
      expect(result.title).toContain("매매");
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should throw NotFoundException for unknown type", () => {
      expect(() => service.getChecklist("없는유형")).toThrow(NotFoundException);
    });

    it("should include error message with available types", () => {
      try {
        service.getChecklist("없는유형");
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        const message = (err as NotFoundException).message;
        expect(message).toContain("월세");
        expect(message).toContain("전세");
        expect(message).toContain("매매");
      }
    });

    it("should have required fields in each checklist item", () => {
      const types = service.getContractTypes();
      for (const type of types) {
        const checklist = service.getChecklist(type);
        for (const item of checklist.items) {
          expect(item.id).toBeDefined();
          expect(item.category).toBeDefined();
          expect(item.title).toBeDefined();
          expect(item.description).toBeDefined();
          expect(item.why).toBeDefined();
          expect(typeof item.isRequired).toBe("boolean");
        }
      }
    });

    it("should have unique ids within each checklist", () => {
      const types = service.getContractTypes();
      for (const type of types) {
        const checklist = service.getChecklist(type);
        const ids = checklist.items.map((item) => item.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });
  });

  // ----- getSummary -----
  describe("getSummary", () => {
    it("should return correct total count for 월세", () => {
      const summary = service.getSummary("월세");
      const checklist = service.getChecklist("월세");

      expect(summary.total).toBe(checklist.items.length);
    });

    it("should return correct required count", () => {
      const summary = service.getSummary("전세");
      const checklist = service.getChecklist("전세");
      const expectedRequired = checklist.items.filter(
        (item) => item.isRequired,
      ).length;

      expect(summary.required).toBe(expectedRequired);
    });

    it("should return unique categories", () => {
      const summary = service.getSummary("매매");

      // categories should have no duplicates
      const unique = new Set(summary.categories);
      expect(unique.size).toBe(summary.categories.length);
    });

    it("should have categories that match items", () => {
      const types = service.getContractTypes();
      for (const type of types) {
        const summary = service.getSummary(type);
        const checklist = service.getChecklist(type);
        const itemCategories = [
          ...new Set(checklist.items.map((item) => item.category)),
        ];
        expect(summary.categories.sort()).toEqual(itemCategories.sort());
      }
    });

    it("should throw NotFoundException for unknown type", () => {
      expect(() => service.getSummary("없는유형")).toThrow(NotFoundException);
    });

    it("should have required count less than or equal to total", () => {
      const types = service.getContractTypes();
      for (const type of types) {
        const summary = service.getSummary(type);
        expect(summary.required).toBeLessThanOrEqual(summary.total);
      }
    });
  });

  describe("analyzeText", () => {
    it("detects clauses in OCR text and includes the legal disclaimer", () => {
      const result = service.analyzeText(
        "월세",
        "임대인과 임차인. 소재지 서울시. 보증금 1000만원, 월세 50만원. 계약기간 2년. 특약사항 원상복구.",
      );

      expect(result.detectedCount).toBeGreaterThan(0);
      expect(result.missingRequired).toEqual([]);
      expect(result.disclaimer).toContain("참고용이며 법적 효력 없음");
    });

    it("reports danger when OCR text detects no clauses", () => {
      const result = service.analyzeText("전세", "인식된 문장 없음");

      expect(result.detectedCount).toBe(0);
      expect(result.riskLevel).toBe("danger");
      expect(result.missingRequired.length).toBeGreaterThan(0);
    });

    it("rejects empty or unsupported OCR text requests", () => {
      expect(() => service.analyzeText("월세", "   ")).toThrow(BadRequestException);
      expect(() => service.analyzeText("임대차", "보증금")).toThrow(BadRequestException);
    });
  });

});
