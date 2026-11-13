# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subscription-recovery.spec.ts >> 390px 청약 복구 >> network 후 같은 입력으로 재시도하여 성공한다
- Location: apps/web-e2e/tests/subscription-recovery.spec.ts:79:11

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "네트워크 연결이 불안정해요"
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <div role="alert" class="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">…</div> aka getByText('네트워크 연결이 불안정해요인터넷 연결이 끊기거나 너무 불안정해서 요청을 완료하지 못했어요.Wi-Fi')
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('alert')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]: 법적 고지
        - paragraph [ref=e7]: 참고용이며 법적 효력 없음. 실제 계약, 청약, 대출 판단 전에는 반드시 공식 문서와 담당 기관 안내를 확인하세요.
      - banner [ref=e8]:
        - generic [ref=e9]:
          - link "Zipath" [ref=e10] [cursor=pointer]:
            - /url: /
          - navigation [ref=e11]:
            - button "메뉴 열기" [ref=e12] [cursor=pointer]:
              - img [ref=e13]
    - main [ref=e14]:
      - heading "청약 자격 시뮬레이션" [level=1] [ref=e15]
      - paragraph [ref=e16]: 기본 정보를 입력하면 청약 가능 여부와 예상 가점을 확인할 수 있어요.
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: 나이
            - spinbutton [ref=e21]: "31"
          - generic [ref=e22]:
            - generic [ref=e23]: 연소득 (만원)
            - spinbutton [ref=e24]: "4500"
          - generic [ref=e25]:
            - generic [ref=e26]: 무주택 기간 (개월)
            - spinbutton [ref=e27]: "24"
          - generic [ref=e28]:
            - generic [ref=e29]: 부양가족 수
            - spinbutton [ref=e30]: "2"
          - generic [ref=e31]:
            - generic [ref=e32]: 청약통장 가입기간 (개월)
            - spinbutton [ref=e33]: "36"
        - generic [ref=e34]:
          - generic [ref=e35]:
            - checkbox "혼인 상태" [checked] [ref=e36]
            - text: 혼인 상태
          - generic [ref=e37]:
            - checkbox "생애최초 주택 구입" [checked] [ref=e38]
            - text: 생애최초 주택 구입
        - button "자격 확인하기" [ref=e39] [cursor=pointer]
      - alert [ref=e41]:
        - paragraph [ref=e42]: 네트워크 연결이 불안정해요
        - paragraph [ref=e43]: 인터넷 연결이 끊기거나 너무 불안정해서 요청을 완료하지 못했어요.
        - paragraph [ref=e44]: Wi-Fi 또는 모바일 데이터를 확인한 뒤 다시 시도해주세요.
        - button "다시 시도" [ref=e45] [cursor=pointer]
      - paragraph [ref=e46]: "* 본 시뮬레이션 결과는 참고용이며 법적 효력이 없습니다."
  - alert [ref=e47]
  - generic [ref=e49]:
    - paragraph [ref=e50]:
      - text: 이 사이트는 서비스 개선과 광고를 위해 쿠키를 사용합니다.
      - link "개인정보처리방침" [ref=e51] [cursor=pointer]:
        - /url: /privacy
    - button "동의" [ref=e52] [cursor=pointer]
```

# Test source

```ts
  8   |   message: "청약 자격 확인 결과",
  9   | };
  10  | 
  11  | interface CapturedRequest {
  12  |   url: string;
  13  |   method: string;
  14  |   body: string | null;
  15  | }
  16  | 
  17  | async function capture(page: Page, info: TestInfo, state: string) {
  18  |   await info.attach(state, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  19  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  20  | }
  21  | 
  22  | async function expectSuccess(page: Page, info: TestInfo) {
  23  |   await expect(page.getByRole("heading", { name: success.message, exact: true })).toBeVisible();
  24  |   await expect(page.getByRole("heading", { name: "예상 가점: 4점 / 84점" })).toBeVisible();
  25  |   await expect(page.getByRole("status")).toHaveCount(0);
  26  |   await expect(page.getByRole("alert")).toHaveCount(0);
  27  |   await expect(page.getByRole("button", { name: "자격 확인하기" })).toBeEnabled();
  28  |   await capture(page, info, "success");
  29  | }
  30  | 
  31  | for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  32  |   test.describe(`${viewport.width}px 청약 복구`, () => {
  33  |     test.use({ viewport });
  34  | 
  35  |     test.beforeEach(async ({ page }, info) => {
  36  |       page.on("console", (message) => {
  37  |         if (message.type() === "error") console.log("browser console:", message.text());
  38  |       });
  39  |       page.on("pageerror", (error) => console.log("page error:", error.message));
  40  |       const response = await page.goto("/subscription");
  41  |       expect(response?.status()).toBeLessThan(400);
  42  |       await expect(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
  43  |       await expect(page.getByPlaceholder("만 나이")).toBeEmpty();
  44  |       await capture(page, info, "initial");
  45  |       await page.getByPlaceholder("만 나이").fill("31");
  46  |       await page.getByPlaceholder("연소득").fill("4500");
  47  |       await page.getByPlaceholder("개월 수").fill("24");
  48  |       await page.getByPlaceholder("본인 제외").fill("2");
  49  |       await page.getByPlaceholder("미입력 시 나이로 추정").fill("36");
  50  |       await page.getByRole("checkbox", { name: "혼인 상태" }).check();
  51  |       await page.getByRole("checkbox", { name: "생애최초 주택 구입" }).check();
  52  |     });
  53  | 
  54  |     test("10초 안내 후 정상 응답으로 전환한다", async ({ page }, info) => {
  55  |       let release = () => {};
  56  |       const gate = new Promise<void>((resolve) => { release = resolve; });
  57  |       await page.route("**/subscription/simulate", async (route) => {
  58  |         await gate;
  59  |         await route.fulfill({ json: success });
  60  |       });
  61  |       try {
  62  |         await page.getByRole("button", { name: "자격 확인하기" }).click();
  63  |         await expect(page.getByRole("status")).toContainText("청약 자격을 확인하고 있어요");
  64  |         await expect(page.getByRole("button", { name: "확인 중...", exact: true })).toBeDisabled();
  65  |         await capture(page, info, "loading");
  66  |         await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다", { timeout: 15_000 });
  67  |         await expect(page.getByRole("status")).toContainText(/경과\s+1\d초/);
  68  |         await expect(page.getByRole("button", { name: "서버 준비 중...", exact: true })).toBeDisabled();
  69  |         await capture(page, info, "loading-after-10s");
  70  |         release();
  71  |         await expectSuccess(page, info);
  72  |       } finally {
  73  |         release();
  74  |         await page.unrouteAll({ behavior: "ignoreErrors" });
  75  |       }
  76  |     });
  77  | 
  78  |     for (const failure of ["network", "timeout"] as const) {
  79  |       test(`${failure} 후 같은 입력으로 재시도하여 성공한다`, async ({ page }, info) => {
  80  |         if (failure === "timeout") test.setTimeout(75_000);
  81  |         const requests: CapturedRequest[] = [];
  82  |         const failedRequests: string[] = [];
  83  |         page.on("requestfailed", (request) => {
  84  |           if (request.url().endsWith("/subscription/simulate")) failedRequests.push(request.failure()?.errorText ?? "unknown");
  85  |         });
  86  |         let startedAt = 0;
  87  |         await page.route("**/subscription/simulate", async (route) => {
  88  |           requests.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData() });
  89  |           if (requests.length > 1) {
  90  |             await route.fulfill({ json: success });
  91  |           } else {
  92  |             startedAt = performance.now();
  93  |             if (failure === "network") await route.abort("failed");
  94  |             // timeout 요청은 처리하지 않고 기존 AbortController가 취소하게 둔다.
  95  |           }
  96  |         });
  97  |         await page.getByRole("button", { name: "자격 확인하기" }).click();
  98  |         if (failure === "timeout") {
  99  |           await expect(page.getByRole("status")).toContainText("청약 자격을 확인하고 있어요");
  100 |           await capture(page, info, "loading");
  101 |           await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다", { timeout: 15_000 });
  102 |           await capture(page, info, "loading-after-10s");
  103 |           await expect.poll(() => performance.now() - startedAt, { timeout: 45_000, intervals: [250] }).toBeGreaterThanOrEqual(40_000);
  104 |           await expect(page.getByRole("alert")).toHaveCount(0);
  105 |           await expect(page.getByRole("button", { name: "서버 준비 중...", exact: true })).toBeDisabled();
  106 |         }
  107 |         const alert = page.getByRole("alert");
> 108 |         await expect(alert).toContainText(failure === "timeout" ? "서버 준비 중이에요" : "네트워크 연결이 불안정해요", { timeout: failure === "timeout" ? 20_000 : 5000 });
      |                             ^ Error: expect(locator).toContainText(expected) failed
  109 |         if (failure === "timeout") {
  110 |           const elapsed = performance.now() - startedAt;
  111 |           expect(elapsed).toBeGreaterThanOrEqual(45_000);
  112 |           expect(elapsed).toBeLessThan(60_000);
  113 |           await info.attach("timeout-elapsed-ms", { body: String(elapsed), contentType: "text/plain" });
  114 |           await expect.poll(() => failedRequests.join(" ")).toMatch(/ERR_ABORTED/);
  115 |         }
  116 |         await expect(page.getByRole("status")).toHaveCount(0);
  117 |         await expect(page.getByRole("button", { name: "자격 확인하기" })).toBeEnabled();
  118 |         const retry = alert.getByRole("button", { name: "다시 시도" });
  119 |         await expect(retry).toBeEnabled();
  120 |         await retry.scrollIntoViewIfNeeded();
  121 |         await expect(retry).toBeInViewport();
  122 |         await capture(page, info, failure);
  123 |         for (const [placeholder, value] of [["만 나이", "31"], ["연소득", "4500"], ["개월 수", "24"], ["본인 제외", "2"], ["미입력 시 나이로 추정", "36"]]) {
  124 |           await expect(page.getByPlaceholder(placeholder)).toHaveValue(value);
  125 |         }
  126 |         await expect(page.getByRole("checkbox", { name: "혼인 상태" })).toBeChecked();
  127 |         await expect(page.getByRole("checkbox", { name: "생애최초 주택 구입" })).toBeChecked();
  128 |         expect(requests).toHaveLength(1);
  129 |         expect(JSON.parse(requests[0].body ?? "null")).toEqual({ age: 31, income: 4500, homelessMonths: 24, dependents: 2, savingsMonths: 36, isMarried: true, isFirstHome: true });
  130 |         await retry.click();
  131 |         await expectSuccess(page, info);
  132 |         expect(requests).toHaveLength(2);
  133 |         expect(requests[0].method).toBe("POST");
  134 |         expect(requests[1]).toEqual(requests[0]);
  135 |       });
  136 |     }
  137 |   });
  138 | }
  139 | 
```