import { buildSubscriptionSimulationInput } from "./utils";

describe("buildSubscriptionSimulationInput", () => {
  it("converts form fields into a numeric payload", () => {
    expect(
      buildSubscriptionSimulationInput({
        age: "30",
        income: "5000",
        homelessMonths: "36",
        dependents: "2",
        savingsYears: "3",
        savingsMonths: "6",
        isMarried: true,
        isFirstHome: false,
      }),
    ).toEqual({
      age: 30,
      income: 5000,
      homelessMonths: 36,
      dependents: 2,
      savingsYears: 3,
      savingsMonths: 6,
      isMarried: true,
      isFirstHome: false,
    });
  });

  it("defaults optional dependents to zero while keeping entered savings duration", () => {
    expect(
      buildSubscriptionSimulationInput({
        age: "25",
        income: "4200",
        homelessMonths: "12",
        dependents: "",
        savingsYears: "1",
        savingsMonths: "0",
        isMarried: false,
        isFirstHome: true,
      }),
    ).toEqual({
      age: 25,
      income: 4200,
      homelessMonths: 12,
      dependents: 0,
      savingsYears: 1,
      savingsMonths: 0,
      isMarried: false,
      isFirstHome: true,
    });
  });
});
