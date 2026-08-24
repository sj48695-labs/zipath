import { BadRequestException } from "@nestjs/common";
import { SubscriptionController } from "@/subscription/subscription.controller";
import { SubscriptionService } from "@/subscription/subscription.service";

describe("SubscriptionController (e2e)", () => {
  const service = new SubscriptionService();
  const controller = new SubscriptionController(service);
  const baseInput = {
    age: 30,
    income: 5000,
    homelessMonths: 36,
  };

  describe("POST /api/subscription/simulate", () => {
    it("입력한 청약통장 가입기간으로 가점을 계산한다", () => {
      const response = controller.simulate({ ...baseInput, savingsMonths: 180 });
      const savingsPoint = response.points.find(
        (point) => point.category === "청약통장 가입기간",
      );

      expect(savingsPoint).toMatchObject({
        score: 17,
        description: "가입 15년 (180개월)",
      });
    });

    it("청약통장 가입기간을 생략하면 나이를 기준으로 추정한다", () => {
      const response = controller.simulate(baseInput);
      const savingsPoint = response.points.find(
        (point) => point.category === "청약통장 가입기간",
      );

      expect(savingsPoint).toMatchObject({
        score: 11,
        description: "추정 가입기간 약 11년 (만 19세부터 계산)",
      });
    });

    it.each([-1, 1.5])("유효하지 않은 가입기간 %s개월은 400으로 거부한다", (savingsMonths) => {
      expect(() =>
        controller.simulate({ ...baseInput, savingsMonths }),
      ).toThrow(BadRequestException);
    });
  });
});
