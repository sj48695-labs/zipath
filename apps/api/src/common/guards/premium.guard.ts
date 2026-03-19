import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PaymentService } from "../../payment/payment.service";

export const PREMIUM_PRODUCT_KEY = "premium_product";
export const Premium = (productType: string) =>
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PREMIUM_PRODUCT_KEY, productType, descriptor.value as object);
    return descriptor;
  };

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly paymentService: PaymentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const productType = this.reflector.get<string>(
      PREMIUM_PRODUCT_KEY,
      context.getHandler(),
    );

    if (!productType) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.query?.userId;

    if (!userId) {
      throw new ForbiddenException("로그인이 필요한 프리미엄 기능입니다.");
    }

    const hasAccess = await this.paymentService.hasActiveProduct(
      Number(userId),
      productType,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `프리미엄 기능입니다. '${productType}' 결제 후 이용 가능합니다.`,
      );
    }

    return true;
  }
}
