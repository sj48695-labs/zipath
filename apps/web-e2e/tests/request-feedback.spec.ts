import {
  expect,
  test,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";

const COLD_START_WAIT_MS = 10_250;

interface CapturedRequest {
  body: string | null;
  url: string;
}

async function delayThenFail(route: Route): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, COLD_START_WAIT_MS);
  });
  await route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "테스트용 서버 오류" }),
  });
}

async function expectRequestFeedback(
  page: Page,
  submitButton: ReturnType<Page["getByRole"]>,
  progressNotice: Locator,
): Promise<void> {
  await expect(submitButton).toBeDisabled();
  await expect(progressNotice).toContainText("서버가 준비 중입니다", {
    timeout: 15_000,
  });
  await expect(progressNotice).toContainText(/경과\s+1\d초/);
  await expect(page.getByRole("alert")).toContainText("테스트용 서버 오류");
  await expect(page.getByRole("alert").getByRole("button", { name: "다시 시도" })).toBeVisible();
}

test("/subscription 장기 대기·실패 후 같은 입력으로 재시도한다", async ({ page }) => {
  const requests: CapturedRequest[] = [];
  await page.route("**/subscription/simulate", async (route) => {
    requests.push({
      url: route.request().url(),
      body: route.request().postData(),
    });
    await delayThenFail(route);
  });

  const response = await page.goto("/subscription");
  expect(response?.status()).toBeLessThan(400);
  await expect(
    page.getByText("참고용이며 법적 효력 없음", { exact: false }).first(),
  ).toBeVisible();

  await page.getByPlaceholder("만 나이").fill("31");
  await page.getByPlaceholder("연소득").fill("4500");
  await page.getByPlaceholder("개월 수").fill("24");
  await page.getByPlaceholder("본인 제외").fill("2");
  await page.getByRole("checkbox", { name: "혼인 상태" }).check();
  await page.getByRole("button", { name: "자격 확인하기" }).click();

  const submitButton = page.getByRole("button", { name: /확인 중|서버 준비 중/ });
  await expectRequestFeedback(
    page,
    submitButton,
    page.getByText("서버가 잠시 준비 중입니다", { exact: false }),
  );
  expect(requests).toHaveLength(1);

  await page.getByRole("alert").getByRole("button", { name: "다시 시도" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toEqual(requests[0]);
});

test("/real-price 장기 대기·실패 후 같은 조회 조건으로 재시도한다", async ({ page }) => {
  const requests: CapturedRequest[] = [];
  await page.route(
    (url) => url.pathname === "/api/real-price",
    async (route) => {
      requests.push({
        url: route.request().url(),
        body: route.request().postData(),
      });
      await delayThenFail(route);
    },
  );

  const response = await page.goto("/real-price");
  expect(response?.status()).toBeLessThan(400);
  await expect(
    page.getByText("참고용이며 법적 효력 없음", { exact: false }).first(),
  ).toBeVisible();

  const monthSelect = page
    .locator("label", { hasText: "계약월" })
    .locator("xpath=following-sibling::select");
  await expect(monthSelect).toHaveValue(/^\d{6}$/);
  await page.getByRole("button", { name: "조회", exact: true }).click();

  const submitButton = page.getByRole("button", { name: "조회 중..." });
  await expectRequestFeedback(page, submitButton, page.getByRole("status"));
  expect(requests).toHaveLength(1);

  await page.getByRole("alert").getByRole("button", { name: "다시 시도" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toEqual(requests[0]);
});
