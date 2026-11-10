import { expect, test, type Page, type TestInfo } from "@playwright/test";

const success = {
  results: [{ type: "일반공급", eligible: true, reason: "테스트용 자격 결과" }],
  points: [{ category: "무주택 기간", score: 4, maxScore: 32, description: "테스트용 가점" }],
  totalPoints: 4,
  maxPoints: 84,
  message: "청약 자격 확인 결과",
};

interface CapturedRequest {
  url: string;
  method: string;
  body: string | null;
}

async function capture(page: Page, info: TestInfo, state: string) {
  await info.attach(state, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectSuccess(page: Page, info: TestInfo) {
  await expect(page.getByRole("heading", { name: success.message, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "예상 가점: 4점 / 84점" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "자격 확인하기" })).toBeEnabled();
  await capture(page, info, "success");
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px 청약 복구`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }, info) => {
      page.on("console", (message) => {
        if (message.type() === "error") console.log("browser console:", message.text());
      });
      page.on("pageerror", (error) => console.log("page error:", error.message));
      const response = await page.goto("/subscription");
      expect(response?.status()).toBeLessThan(400);
      await expect(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
      await expect(page.getByPlaceholder("만 나이")).toBeEmpty();
      await capture(page, info, "initial");
      await page.getByPlaceholder("만 나이").fill("31");
      await page.getByPlaceholder("연소득").fill("4500");
      await page.getByPlaceholder("개월 수").fill("24");
      await page.getByPlaceholder("본인 제외").fill("2");
      await page.getByPlaceholder("미입력 시 나이로 추정").fill("36");
      await page.getByRole("checkbox", { name: "혼인 상태" }).check();
      await page.getByRole("checkbox", { name: "생애최초 주택 구입" }).check();
    });

    test("10초 안내 후 정상 응답으로 전환한다", async ({ page }, info) => {
      let release = () => {};
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await page.route("**/subscription/simulate", async (route) => {
        await gate;
        await route.fulfill({ json: success });
      });
      try {
        await page.getByRole("button", { name: "자격 확인하기" }).click();
        await expect(page.getByRole("status")).toContainText("청약 자격을 확인하고 있어요");
        await expect(page.getByRole("button", { name: "확인 중...", exact: true })).toBeDisabled();
        await capture(page, info, "loading");
        await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다", { timeout: 15_000 });
        await expect(page.getByRole("status")).toContainText(/경과\s+1\d초/);
        await expect(page.getByRole("button", { name: "서버 준비 중...", exact: true })).toBeDisabled();
        await capture(page, info, "loading-after-10s");
        release();
        await expectSuccess(page, info);
      } finally {
        release();
        await page.unrouteAll({ behavior: "ignoreErrors" });
      }
    });

    for (const failure of ["network", "timeout"] as const) {
      test(`${failure} 후 같은 입력으로 재시도하여 성공한다`, async ({ page }, info) => {
        if (failure === "timeout") test.setTimeout(75_000);
        const requests: CapturedRequest[] = [];
        const failedRequests: string[] = [];
        page.on("requestfailed", (request) => {
          if (request.url().endsWith("/subscription/simulate")) failedRequests.push(request.failure()?.errorText ?? "unknown");
        });
        let startedAt = 0;
        await page.route("**/subscription/simulate", async (route) => {
          requests.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData() });
          if (requests.length > 1) {
            await route.fulfill({ json: success });
          } else {
            startedAt = performance.now();
            if (failure === "network") await route.abort("failed");
            // timeout 요청은 처리하지 않고 기존 AbortController가 취소하게 둔다.
          }
        });
        await page.getByRole("button", { name: "자격 확인하기" }).click();
        if (failure === "timeout") {
          await expect(page.getByRole("status")).toContainText("청약 자격을 확인하고 있어요");
          await capture(page, info, "loading");
          await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다", { timeout: 15_000 });
          await capture(page, info, "loading-after-10s");
          await expect.poll(() => performance.now() - startedAt, { timeout: 45_000, intervals: [250] }).toBeGreaterThanOrEqual(40_000);
          await expect(page.getByRole("alert")).toHaveCount(0);
          await expect(page.getByRole("button", { name: "서버 준비 중...", exact: true })).toBeDisabled();
        }
        const alert = page.getByRole("alert");
        await expect(alert).toContainText(failure === "timeout" ? "서버 준비 중이에요" : "네트워크 연결이 불안정해요", { timeout: failure === "timeout" ? 20_000 : 5000 });
        if (failure === "timeout") {
          const elapsed = performance.now() - startedAt;
          expect(elapsed).toBeGreaterThanOrEqual(45_000);
          expect(elapsed).toBeLessThan(60_000);
          await info.attach("timeout-elapsed-ms", { body: String(elapsed), contentType: "text/plain" });
          await expect.poll(() => failedRequests.join(" ")).toMatch(/ERR_ABORTED/);
        }
        await expect(page.getByRole("status")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "자격 확인하기" })).toBeEnabled();
        const retry = alert.getByRole("button", { name: "다시 시도" });
        await expect(retry).toBeEnabled();
        await retry.scrollIntoViewIfNeeded();
        await expect(retry).toBeInViewport();
        await capture(page, info, failure);
        for (const [placeholder, value] of [["만 나이", "31"], ["연소득", "4500"], ["개월 수", "24"], ["본인 제외", "2"], ["미입력 시 나이로 추정", "36"]]) {
          await expect(page.getByPlaceholder(placeholder)).toHaveValue(value);
        }
        await expect(page.getByRole("checkbox", { name: "혼인 상태" })).toBeChecked();
        await expect(page.getByRole("checkbox", { name: "생애최초 주택 구입" })).toBeChecked();
        expect(requests).toHaveLength(1);
        expect(JSON.parse(requests[0].body ?? "null")).toEqual({ age: 31, income: 4500, homelessMonths: 24, dependents: 2, savingsMonths: 36, isMarried: true, isFirstHome: true });
        await retry.click();
        await expectSuccess(page, info);
        expect(requests).toHaveLength(2);
        expect(requests[0].method).toBe("POST");
        expect(requests[1]).toEqual(requests[0]);
      });
    }
  });
}
