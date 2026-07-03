import { expect, test } from "@playwright/test";

const SIMULATION_RESPONSE = {
  results: [
    {
      type: "1순위 일반공급",
      eligible: true,
      reason: "만 19세 이상, 무주택 2년 이상, 소득 기준 충족",
    },
  ],
  points: [
    {
      category: "무주택 기간",
      score: 12,
      maxScore: 32,
      description: "무주택 6년 (72개월)",
    },
  ],
  totalPoints: 12,
  maxPoints: 84,
  message: "청약 가능한 유형이 있습니다! (가점 12/84점)",
};

test("/subscription loading state disables duplicate submits", async ({ page }) => {
  let requestCount = 0;
  let releaseResponse: (() => void) | undefined;

  await page.route("**/subscription/simulate", async (route) => {
    requestCount += 1;
    await new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SIMULATION_RESPONSE),
    });
  });

  await page.goto("/subscription");

  await page.getByLabel("나이").fill("30");
  await page.getByLabel("연소득 (만원)").fill("5000");
  await page.getByLabel("무주택 기간 (개월)").fill("36");
  await page.getByLabel("부양가족 수").fill("1");
  await page.getByLabel("청약통장 가입기간 (개월)").fill("24");

  const submitButton = page.locator('form button[type="submit"]');
  await submitButton.click();

  await expect(submitButton).toBeDisabled();
  await expect(page.getByLabel("나이")).toBeDisabled();
  await expect(page.getByLabel("연소득 (만원)")).toBeDisabled();
  await expect(page.getByLabel("무주택 기간 (개월)")).toBeDisabled();
  await expect(page.getByLabel("부양가족 수")).toBeDisabled();
  await expect(page.getByLabel("청약통장 가입기간 (개월)")).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "청약 자격 시뮬레이션을 확인 중입니다",
  );

  await page.waitForTimeout(10_500);
  await expect(page.getByRole("status")).toContainText(
    "서버 웜업 중... 최대 30초 소요될 수 있습니다",
  );

  await page.locator("form").dispatchEvent("submit");
  await page.locator("form").dispatchEvent("submit");

  await expect.poll(() => requestCount).toBe(1);

  releaseResponse?.();

  await expect(page.getByRole("heading", { name: /청약 가능한 유형이 있습니다/ })).toBeVisible();
  await expect(page.getByText("참고용이며 법적 효력 없음")).toBeVisible();
});

test("/subscription shows a recoverable error state after a failed submit", async ({ page }) => {
  let requestCount = 0;

  await page.route("**/subscription/simulate", async (route) => {
    requestCount += 1;

    if (requestCount === 1) {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          message: "서버가 잠시 준비되지 않았습니다. 잠시 후 다시 시도해주세요.",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SIMULATION_RESPONSE),
    });
  });

  await page.goto("/subscription");

  await page.getByLabel("나이").fill("30");
  await page.getByLabel("연소득 (만원)").fill("5000");
  await page.getByLabel("무주택 기간 (개월)").fill("36");
  await page.getByLabel("부양가족 수").fill("1");
  await page.getByLabel("청약통장 가입기간 (개월)").fill("24");

  await page.getByRole("button", { name: "자격 확인하기" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "서버가 잠시 준비되지 않았습니다. 잠시 후 다시 시도해주세요.",
  );
  await expect(page.getByRole("alert")).toContainText(
    "입력값은 그대로 유지됩니다. 내용을 수정한 뒤 다시 제출하거나, 같은 조건으로 다시 시도하세요.",
  );
  await expect(page.getByLabel("나이")).toHaveValue("30");

  await page.getByRole("button", { name: "다시 시도" }).click();

  await expect.poll(() => requestCount).toBe(2);
  await expect(page.getByRole("heading", { name: /청약 가능한 유형이 있습니다/ })).toBeVisible();
});
