import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { LoanModule } from "@/loan/loan.module";

describe("LoanController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [LoanModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/loan/calculate", () => {
    it("대출 한도를 계산한다", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/loan/calculate")
        .send({
          annualIncome: 50000000,
          existingDebt: 0,
          housePrice: 500000000,
        })
        .expect(201);

      expect(res.body.input).toBeDefined();
      expect(res.body.result).toBeDefined();
      expect(res.body.result.maxLoanAmount).toBeGreaterThan(0);
      expect(res.body.result.monthlyPayment).toBeGreaterThan(0);
      expect(res.body.result.maxByLtv).toBe(350000000);
    });

    it("기존 대출이 있으면 한도가 줄어든다", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/loan/calculate")
        .send({
          annualIncome: 50000000,
          existingDebt: 100000000,
          housePrice: 500000000,
        })
        .expect(201);

      expect(res.body.result.maxByDsr).toBeLessThan(350000000);
    });

    it("필수 필드가 없으면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .post("/api/loan/calculate")
        .send({ annualIncome: 50000000 })
        .expect(400);
    });

    it("housePrice가 0이면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .post("/api/loan/calculate")
        .send({ annualIncome: 50000000, existingDebt: 0, housePrice: 0 })
        .expect(400);
    });

    it("음수 값이면 400을 반환한다", async () => {
      await request(app.getHttpServer())
        .post("/api/loan/calculate")
        .send({ annualIncome: -1, existingDebt: 0, housePrice: 500000000 })
        .expect(400);
    });
  });
});
