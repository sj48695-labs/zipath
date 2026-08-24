import { GlossaryController } from "@/glossary/glossary.controller";
import { GlossaryService } from "@/glossary/glossary.service";

describe("GlossaryController (e2e)", () => {
  const service = new GlossaryService();
  const controller = new GlossaryController(service);

  describe("GET /api/glossary", () => {
    it("전체 용어 목록을 반환한다", () => {
      const res = controller.getAll();

      expect(res.terms).toBeDefined();
      expect(Array.isArray(res.terms)).toBe(true);
      expect(res.terms.length).toBeGreaterThan(0);

      const term = res.terms[0];
      expect(term).toHaveProperty("term");
      expect(term).toHaveProperty("definition");
      expect(term).toHaveProperty("category");
    });

    it("카테고리 필터로 조회할 수 있다", () => {
      const res = controller.getAll("등기");

      expect(res.terms.length).toBeGreaterThan(0);
      for (const term of res.terms) {
        expect(term.category).toBe("등기");
      }
    });

    it("검색 쿼리로 용어를 찾을 수 있다", () => {
      const res = controller.getAll(undefined, "근저당");

      expect(res.terms.length).toBeGreaterThan(0);
      const found = res.terms.some((term) => term.term === "근저당");
      expect(found).toBe(true);
    });

    it("검색 결과가 없으면 빈 배열을 반환한다", () => {
      const res = controller.getAll(undefined, "존재하지않는용어xyz");

      expect(res.terms).toEqual([]);
    });
  });

  describe("GET /api/glossary/categories", () => {
    it("카테고리 목록을 반환한다", () => {
      const res = controller.getCategories();

      expect(res.categories).toBeDefined();
      expect(Array.isArray(res.categories)).toBe(true);
      expect(res.categories).toContain("등기");
      expect(res.categories).toContain("계약");
      expect(res.categories).toContain("대출");
    });
  });
});
