import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "@zipath/db";

interface CreatePaymentInput {
  userId: number;
  productType: string;
}

interface ConfirmPaymentInput {
  paymentKey: string;
  orderId: string;
  amount: number;
}

const PRODUCT_PRICES: Record<string, { name: string; price: number }> = {
  "contract-analysis": { name: "계약서 분석", price: 990 },
  "real-price-report": { name: "실거래가 상세 리포트", price: 500 },
  "premium-monthly": { name: "프리미엄 월 구독", price: 2900 },
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {}

  getProducts() {
    return Object.entries(PRODUCT_PRICES).map(([key, val]) => ({
      id: key,
      name: val.name,
      price: val.price,
    }));
  }

  async createPayment(input: CreatePaymentInput) {
    const product = PRODUCT_PRICES[input.productType];
    if (!product) {
      throw new Error("존재하지 않는 상품입니다.");
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payment = this.paymentRepo.create({
      userId: input.userId,
      productType: input.productType,
      amount: product.price,
      status: "pending",
      orderId,
    });

    await this.paymentRepo.save(payment);

    return {
      orderId,
      amount: product.price,
      productName: product.name,
      clientKey: this.config.get<string>("TOSS_CLIENT_KEY") || "test_ck_demo",
    };
  }

  async confirmPayment(input: ConfirmPaymentInput) {
    const payment = await this.paymentRepo.findOne({
      where: { orderId: input.orderId },
    });

    if (!payment) {
      throw new Error("결제 정보를 찾을 수 없습니다.");
    }

    if (payment.amount !== input.amount) {
      payment.status = "failed";
      await this.paymentRepo.save(payment);
      throw new Error("결제 금액이 일치하지 않습니다.");
    }

    // 토스페이먼츠 API 검증 (실제 환경에서는 서버사이드 검증 필요)
    const secretKey = this.config.get<string>("TOSS_SECRET_KEY");
    if (secretKey) {
      try {
        const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey: input.paymentKey,
            orderId: input.orderId,
            amount: input.amount,
          }),
        });

        if (!res.ok) {
          payment.status = "failed";
          await this.paymentRepo.save(payment);
          throw new Error("토스페이먼츠 결제 확인 실패");
        }
      } catch (err) {
        this.logger.error(`결제 확인 오류: ${err instanceof Error ? err.message : String(err)}`);
        if (payment.status !== "failed") {
          payment.status = "failed";
          await this.paymentRepo.save(payment);
        }
        throw err;
      }
    }

    payment.paymentKey = input.paymentKey;
    payment.status = "confirmed";
    await this.paymentRepo.save(payment);

    return { success: true, paymentId: payment.id };
  }

  async getUserPayments(userId: number) {
    return this.paymentRepo.find({
      where: { userId, status: "confirmed" },
      order: { paidAt: "DESC" },
    });
  }

  async hasActiveProduct(userId: number, productType: string): Promise<boolean> {
    const payment = await this.paymentRepo.findOne({
      where: { userId, productType, status: "confirmed" },
      order: { paidAt: "DESC" },
    });

    if (!payment) return false;

    // 월 구독은 30일 유효
    if (productType === "premium-monthly") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return payment.paidAt > thirtyDaysAgo;
    }

    return true; // 건당 결제는 항상 유효
  }
}
