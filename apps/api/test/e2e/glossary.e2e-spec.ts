import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { GlossaryModule } from "@/glossary/glossary.module";

describe("GlossaryController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [GlossaryModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/glossary", () => {
    it("전체 용어 목록을 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/glossary")
        .expect(200);

      expect(res.body.terms).toBeDefined();
      expect(Array.isArray(res.body.terms)).toBe(true);
      expect(res.body.terms.length).toBeGreaterThan(0);

      const term = res.body.terms[0];
      expect(term).toHaveProperty("term");
      expect(term).toHaveProperty("definition");
      expect(term).toHaveProperty("category");
    });

    it("카테고리 필터로 조회할 수 있다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/glossary?category=등기")
        .expect(200);

      expect(res.body.terms.length).toBeGreaterThan(0);
      for (const term of res.body.terms) {
        expect(term.category).toBe("등기");
      }
    });

    it("검색 쿼리로 용어를 찾을 수 있다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/glossary?q=근저당")
        .expect(200);

      expect(res.body.terms.length).toBeGreaterThan(0);
      const found = res.body.terms.some(
        (t: { term: string }) => t.term === "근저당",
      );
      expect(found).toBe(true);
    });

    it("검색 결과가 없으면 빈 배열을 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/glossary?q=존재하지않는용어xyz")
        .expect(200);

      expect(res.body.terms).toEqual([]);
    });
  });

  describe("GET /api/glossary/categories", () => {
    it("카테고리 목록을 반환한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/glossary/categories")
        .expect(200);

      expect(res.body.categories).toBeDefined();
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories).toContain("등기");
      expect(res.body.categories).toContain("계약");
      expect(res.body.categories).toContain("대출");
    });
  });
});
