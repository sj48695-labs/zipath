import { BadRequestException } from "@nestjs/common";
import { SubscriptionController } from "../src/subscription/subscription.controller";
import { SubscriptionService } from "../src/subscription/subscription.service";

describe("SubscriptionController", () => {
  const simulate = jest.fn();
  const subscriptionService = {
    simulate,
  } satisfies Pick<SubscriptionService, "simulate">;

  const controller = new SubscriptionController(
    subscriptionService as unknown as SubscriptionService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes a full savings duration payload to the service", () => {
    const body = {
      age: 30,
      income: 5000,
      homelessMonths: 36,
      dependents: 2,
      savingsYears: 3,
      savingsMonths: 6,
      isMarried: true,
      isFirstHome: false,
    };
    const expected = { ok: true } as unknown;
    simulate.mockReturnValue(expected as ReturnType<SubscriptionService["simulate"]>);

    const result = controller.simulate(body);

    expect(subscriptionService.simulate).toHaveBeenCalledWith(body);
    expect(result).toBe(expected);
  });

  it("rejects requests without savingsYears", () => {
    expect(() =>
      controller.simulate({
        age: 30,
        income: 5000,
        homelessMonths: 36,
        savingsMonths: 6,
      }),
    ).toThrow(BadRequestException);
  });

  it("rejects requests with invalid savingsMonths", () => {
    expect(() =>
      controller.simulate({
        age: 30,
        income: 5000,
        homelessMonths: 36,
        savingsYears: 3,
        savingsMonths: 12,
      }),
    ).toThrow(BadRequestException);
  });
});
