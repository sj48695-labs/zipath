import {
  expect,
  test,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";

const COLD_START_WAIT_MS = 12_000;

// 최초 Next.js 페이지 컴파일과 가상 시간 기반 45초 timeout 검증을 함께 허용한다.
test.setTimeout(60_000);

interface CapturedRequest {
  body: string | null;
  url: string;
}

interface PendingRoute {
  handler: (route: Route) => Promise<void>;
  release: () => void;
}

function createPendingRoute(): PendingRoute {
  let releaseRequest: () => void = () => undefined;
  const requestIsReleased = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  return {
    handler: async (route) => {
      await requestIsReleased;
      try {
        await route.abort("timedout");
      } catch {
        // 클라이언트 timeout으로 이미 취소된 route는 별도 정리가 필요 없다.
      }
    },
    release: releaseRequest,
  };
}

function getErrorAlert(page: Page): Locator {
  return page.locator('[role="alert"]').filter({ hasText: "테스트용 서버 오류" });
}

function getTimeoutAlert(page: Page): Locator {
  return page.locator('[role="alert"]').filter({ hasText: "서버 준비 중이에요" });
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
  await expect(progressNotice).toContainText(/서버가 .*준비 중입니다/, {
    timeout: 15_000,
  });
  await expect(progressNotice).toContainText(/경과\s+1\d초/);
  await expect(getErrorAlert(page)).toBeVisible();
  await expect(getErrorAlert(page).getByRole("button", { name: "다시 시도" })).toBeVisible();
}

async function expectInitialProgressNotice(
  progressNotice: Locator,
  message: string,
): Promise<void> {
  await expect(progressNotice).toBeVisible();
  await expect(progressNotice).toContainText(message);
}

test("청약·실거래가 요청은 10초 안내 후 45초 timeout을 준비 안내로 분류한다", async ({
  page,
}) => {
  await page.clock.install();

  const subscriptionRoute = createPendingRoute();
  await page.route("**/subscription/simulate", subscriptionRoute.handler);
  await page.goto("/subscription");
  await page.getByPlaceholder("만 나이").fill("31");
  await page.getByPlaceholder("연소득").fill("4500");
  await page.getByPlaceholder("개월 수").fill("24");
  await page.getByRole("button", { name: "자격 확인하기" }).click();

  await expectInitialProgressNotice(
    page.getByRole("status"),
    "청약 자격을 확인하고 있어요.",
  );
  await page.clock.fastForward(10_000);
  await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다");
  await page.clock.fastForward(35_000);
  await expect(getTimeoutAlert(page)).toBeVisible();
  subscriptionRoute.release();

  const realPriceRoute = createPendingRoute();
  await page.route(
    (url) => url.pathname === "/api/real-price",
    realPriceRoute.handler,
  );
  await page.goto("/real-price");
  await page.getByRole("button", { name: "조회", exact: true }).click();

  await expectInitialProgressNotice(
    page.getByRole("status"),
    "실거래가를 조회하고 있어요.",
  );
  await page.clock.fastForward(10_000);
  await expect(page.getByRole("status")).toContainText("서버가 준비 중입니다");
  await page.clock.fastForward(35_000);
  await expect(getTimeoutAlert(page)).toBeVisible();
  realPriceRoute.release();
});

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

  await expectInitialProgressNotice(
    page.getByRole("status"),
    "청약 자격을 확인하고 있어요.",
  );
  const submitButton = page.getByRole("button", { name: /확인 중|서버 준비 중/ });
  await expectRequestFeedback(
    page,
    submitButton,
    page.getByText("서버가 잠시 준비 중입니다", { exact: false }),
  );
  expect(requests).toHaveLength(1);

  await getErrorAlert(page).getByRole("button", { name: "다시 시도" }).click();
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

  await expectInitialProgressNotice(
    page.getByRole("status"),
    "실거래가를 조회하고 있어요.",
  );
  const submitButton = page.getByRole("button", { name: "조회 중..." });
  await expectRequestFeedback(page, submitButton, page.getByRole("status"));
  expect(requests).toHaveLength(1);

  await getErrorAlert(page).getByRole("button", { name: "다시 시도" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toEqual(requests[0]);
});
