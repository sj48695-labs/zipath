import { GlossaryService } from "../src/glossary/glossary.service";

describe("GlossaryService", () => {
  let service: GlossaryService;

  beforeEach(() => {
    service = new GlossaryService();
  });

  it("should return all terms", () => {
    const terms = service.getAll();
    expect(terms.length).toBeGreaterThan(0);
  });

  it("should filter by category", () => {
    const terms = service.getByCategory("등기");
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.category === "등기")).toBe(true);
  });

  it("should return empty for unknown category", () => {
    const terms = service.getByCategory("존재하지않는카테고리");
    expect(terms).toEqual([]);
  });

  it("should search by term name", () => {
    const terms = service.search("전세");
    expect(terms.length).toBeGreaterThan(0);
    expect(
      terms.some(
        (t) =>
          t.term.includes("전세") || t.definition.includes("전세"),
      ),
    ).toBe(true);
  });

  it("should search by definition content", () => {
    const terms = service.search("보증금");
    expect(terms.length).toBeGreaterThan(0);
  });

  it("should return all categories", () => {
    const categories = service.getCategories();
    expect(categories).toContain("등기");
    expect(categories).toContain("계약");
    expect(categories).toContain("대출");
    expect(categories).toContain("청약");
    expect(categories).toContain("세금");
    expect(categories).toContain("기타");
  });

  it("should have example for most terms", () => {
    const terms = service.getAll();
    const withExamples = terms.filter((t) => t.example);
    expect(withExamples.length).toBeGreaterThan(terms.length * 0.5);
  });
});
