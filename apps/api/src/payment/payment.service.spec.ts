import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, ObjectLiteral } from "typeorm";
import { Payment } from "@zipath/db";
import { PaymentService } from "./payment.service";

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

describe("PaymentService", () => {
  let service: PaymentService;
  let paymentRepo: MockRepository<Payment>;
  let configValues: Record<string, string | undefined>;

  beforeEach(async () => {
    configValues = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: createMockRepository(),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepo = module.get(getRepositoryToken(Payment));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProducts", () => {
    it("should return the product catalog with id/name/price", () => {
      const products = service.getProducts();

      expect(products.length).toBeGreaterThan(0);
      for (const p of products) {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("name");
        expect(typeof p.price).toBe("number");
      }
      expect(products.map((p) => p.id)).toContain("contract-analysis");
    });
  });

  describe("createPayment", () => {
    it("should create a pending payment and return order info for a valid product", async () => {
      paymentRepo.create!.mockImplementation((v: unknown) => v);
      paymentRepo.save!.mockResolvedValue({});
      configValues.TOSS_CLIENT_KEY = "ck_live";

      const result = await service.createPayment({
        userId: 1,
        productType: "contract-analysis",
      });

      expect(result.amount).toBe(990);
      expect(result.productName).toBe("계약서 분석");
      expect(result.orderId).toMatch(/^order_/);
      expect(result.clientKey).toBe("ck_live");
      expect(paymentRepo.save).toHaveBeenCalledTimes(1);
      const created = paymentRepo.create!.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(created.status).toBe("pending");
      expect(created.userId).toBe(1);
    });

    it("should fall back to demo client key when config is unset", async () => {
      paymentRepo.create!.mockImplementation((v: unknown) => v);
      paymentRepo.save!.mockResolvedValue({});

      const result = await service.createPayment({
        userId: 2,
        productType: "premium-monthly",
      });

      expect(result.clientKey).toBe("test_ck_demo");
    });

    it("should throw for a non-existent product", async () => {
      await expect(
        service.createPayment({ userId: 1, productType: "unknown" }),
      ).rejects.toThrow("존재하지 않는 상품입니다.");
      expect(paymentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("confirmPayment", () => {
    it("should confirm a matching payment without TOSS key", async () => {
      const payment = {
        id: 10,
        amount: 990,
        status: "pending",
      } as Payment;
      paymentRepo.findOne!.mockResolvedValue(payment);
      paymentRepo.save!.mockResolvedValue(payment);

      const result = await service.confirmPayment({
        paymentKey: "pk_1",
        orderId: "order_x",
        amount: 990,
      });

      expect(result).toEqual({ success: true, paymentId: 10 });
      expect(payment.status).toBe("confirmed");
      expect(payment.paymentKey).toBe("pk_1");
    });

    it("should throw when payment is not found", async () => {
      paymentRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.confirmPayment({
          paymentKey: "pk",
          orderId: "missing",
          amount: 990,
        }),
      ).rejects.toThrow("결제 정보를 찾을 수 없습니다.");
    });

    it("should mark as failed and throw on amount mismatch", async () => {
      const payment = { id: 11, amount: 990, status: "pending" } as Payment;
      paymentRepo.findOne!.mockResolvedValue(payment);
      paymentRepo.save!.mockResolvedValue(payment);

      await expect(
        service.confirmPayment({
          paymentKey: "pk",
          orderId: "order_y",
          amount: 100,
        }),
      ).rejects.toThrow("결제 금액이 일치하지 않습니다.");
      expect(payment.status).toBe("failed");
    });

    it("should call TOSS API and mark failed when verification fails", async () => {
      const payment = { id: 12, amount: 990, status: "pending" } as Payment;
      paymentRepo.findOne!.mockResolvedValue(payment);
      paymentRepo.save!.mockResolvedValue(payment);
      configValues.TOSS_SECRET_KEY = "sk_live";
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: false } as unknown as Response);

      await expect(
        service.confirmPayment({
          paymentKey: "pk",
          orderId: "order_z",
          amount: 990,
        }),
      ).rejects.toThrow("토스페이먼츠 결제 확인 실패");
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(payment.status).toBe("failed");
    });

    it("should confirm when TOSS API verification succeeds", async () => {
      const payment = { id: 13, amount: 990, status: "pending" } as Payment;
      paymentRepo.findOne!.mockResolvedValue(payment);
      paymentRepo.save!.mockResolvedValue(payment);
      configValues.TOSS_SECRET_KEY = "sk_live";
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue({ ok: true } as unknown as Response);

      const result = await service.confirmPayment({
        paymentKey: "pk_ok",
        orderId: "order_ok",
        amount: 990,
      });

      expect(result).toEqual({ success: true, paymentId: 13 });
      expect(payment.status).toBe("confirmed");
    });
  });

  describe("getUserPayments", () => {
    it("should query confirmed payments for the user", async () => {
      paymentRepo.find!.mockResolvedValue([{ id: 1 }]);

      const result = await service.getUserPayments(7);

      expect(result).toHaveLength(1);
      const arg = paymentRepo.find!.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(arg.where).toMatchObject({ userId: 7, status: "confirmed" });
    });
  });

  describe("hasActiveProduct", () => {
    it("should return false when no confirmed payment exists", async () => {
      paymentRepo.findOne!.mockResolvedValue(null);

      expect(await service.hasActiveProduct(1, "contract-analysis")).toBe(false);
    });

    it("should return true for one-time products", async () => {
      paymentRepo.findOne!.mockResolvedValue({ id: 1 });

      expect(await service.hasActiveProduct(1, "contract-analysis")).toBe(true);
    });

    it("should return true for monthly subscription within 30 days", async () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 5);
      paymentRepo.findOne!.mockResolvedValue({ paidAt: recent });

      expect(await service.hasActiveProduct(1, "premium-monthly")).toBe(true);
    });

    it("should return false for monthly subscription past 30 days", async () => {
      const old = new Date();
      old.setDate(old.getDate() - 40);
      paymentRepo.findOne!.mockResolvedValue({ paidAt: old });

      expect(await service.hasActiveProduct(1, "premium-monthly")).toBe(false);
    });
  });
});
