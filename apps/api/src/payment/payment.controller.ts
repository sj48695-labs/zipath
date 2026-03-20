import { Controller, Get, Post, Body, Query, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { PaymentService } from "./payment.service";

const createPaymentSchema = z.object({
  userId: z.number().int().min(1),
  productType: z.string(),
});

const confirmPaymentSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number().int().min(1),
});

@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get("products")
  getProducts() {
    return this.paymentService.getProducts();
  }

  @Post("create")
  async createPayment(@Body() body: unknown) {
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(", "));
    }
    return this.paymentService.createPayment(parsed.data);
  }

  @Post("confirm")
  async confirmPayment(@Body() body: unknown) {
    const parsed = confirmPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(", "));
    }
    return this.paymentService.confirmPayment(parsed.data);
  }

  @Get("history")
  async getHistory(@Query("userId") userId: string) {
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) throw new BadRequestException("유효하지 않은 사용자 ID");
    return this.paymentService.getUserPayments(uid);
  }

  @Get("check")
  async checkAccess(
    @Query("userId") userId: string,
    @Query("productType") productType: string,
  ) {
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) throw new BadRequestException("유효하지 않은 사용자 ID");
    const hasAccess = await this.paymentService.hasActiveProduct(uid, productType);
    return { hasAccess };
  }
}
