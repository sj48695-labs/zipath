# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subscription-recovery.spec.ts >> 1280px 청약 복구 >> network 후 같은 입력으로 재시도하여 성공한다
- Location: apps/web-e2e/tests/subscription-recovery.spec.ts:90:11

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
            - generic [ref=e12]:
              - link "청약" [ref=e13] [cursor=pointer]:
                - /url: /subscription
              - link "대출" [ref=e14] [cursor=pointer]:
                - /url: /loan
              - link "체크리스트" [ref=e15] [cursor=pointer]:
                - /url: /checklist
              - link "실거래가" [ref=e16] [cursor=pointer]:
                - /url: /real-price
    - main [ref=e17]:
      - heading "청약 자격 시뮬레이션" [level=1] [ref=e18]
      - paragraph [ref=e19]: 기본 정보를 입력하면 청약 가능 여부와 예상 가점을 확인할 수 있어요.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: 나이
            - spinbutton [ref=e24]: "31"
          - generic [ref=e25]:
            - generic [ref=e26]: 연소득 (만원)
            - spinbutton [ref=e27]: "4500"
          - generic [ref=e28]:
            - generic [ref=e29]: 무주택 기간 (개월)
            - spinbutton [ref=e30]: "24"
          - generic [ref=e31]:
            - generic [ref=e32]: 부양가족 수
            - spinbutton [ref=e33]: "2"
          - generic [ref=e34]:
            - generic [ref=e35]: 청약통장 가입기간 (개월)
            - spinbutton [ref=e36]: "36"
        - generic [ref=e37]:
          - generic [ref=e38]:
            - checkbox "혼인 상태" [checked] [ref=e39]
            - text: 혼인 상태
          - generic [ref=e40]:
            - checkbox "생애최초 주택 구입" [checked] [ref=e41]
            - text: 생애최초 주택 구입
        - button "자격 확인하기" [ref=e42] [cursor=pointer]
      - alert [ref=e44]:
        - paragraph [ref=e45]: 네트워크 연결이 불안정해요
        - paragraph [ref=e46]: 인터넷 연결이 끊기거나 너무 불안정해서 요청을 완료하지 못했어요.
        - paragraph [ref=e47]: Wi-Fi 또는 모바일 데이터를 확인한 뒤 다시 시도해주세요.
        - button "다시 시도" [ref=e48] [cursor=pointer]
      - paragraph [ref=e49]: "* 본 시뮬레이션 결과는 참고용이며 법적 효력이 없습니다."
  - alert [ref=e50]
  - generic [ref=e52]:
    - paragraph [ref=e53]:
      - text: 이 사이트는 서비스 개선과 광고를 위해 쿠키를 사용합니다.
      - link "개인정보처리방침" [ref=e54] [cursor=pointer]:
        - /url: /privacy
    - button "동의" [ref=e55] [cursor=pointer]
```

# Test source

```ts
  21  | 
  22  | async function expectInputsPreserved(page: Page) {
  23  |   for (const [placeholder, value] of [["만 나이", "31"], ["연소득", "4500"], ["개월 수", "24"], ["본인 제외", "2"], ["미입력 시 나이로 추정", "36"]]) {
  24  |     await expect(page.getByPlaceholder(placeholder)).toHaveValue(value);
  25  |   }
  26  |   await expect(page.getByRole("checkbox", { name: "혼인 상태" })).toBeChecked();
  27  |   await expect(page.getByRole("checkbox", { name: "생애최초 주택 구입" })).toBeChecked();
  28  | }
  29  | 
  30  | async function expectSuccess(page: Page, info: TestInfo) {
  31  |   await expect(page.getByRole("heading", { name: success.message, exact: true })).toBeVisible();
  32  |   await expect(page.getByRole("heading", { name: "예상 가점: 4점 / 84점" })).toBeVisible();
  33  |   await expect(page.getByRole("status")).toHaveCount(0);
  34  |   await expect(page.getByRole("alert")).toHaveCount(0);
  35  |   await expect(page.getByRole("button", { name: "자격 확인하기" })).toBeEnabled();
  36  |   await expectInputsPreserved(page);
  37  |   await capture(page, info, "success");
  38  | }
  39  | 
  40  | for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  41  |   test.describe(`${viewport.width}px 청약 복구`, () => {
  42  |     test.use({ viewport });
  43  | 
  44  |     test.beforeEach(async ({ page }, info) => {
  45  |       page.on("console", (message) => {
  46  |         if (message.type() === "error") console.log("browser console:", message.text());
  47  |       });
  48  |       page.on("pageerror", (error) => console.log("page error:", error.message));
  49  |       const response = await page.goto("/subscription");
  50  |       expect(response?.status()).toBeLessThan(400);
  51  |       await expect(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
  52  |       await expect(page.getByPlaceholder("만 나이")).toBeEmpty();
  53  |       await capture(page, info, "initial");
  54  |       await page.getByPlaceholder("만 나이").fill("31");
  55  |       await page.getByPlaceholder("연소득").fill("4500");
  56  |       await page.getByPlaceholder("개월 수").fill("24");
  57  |       await page.getByPlaceholder("본인 제외").fill("2");
  58  |       await page.getByPlaceholder("미입력 시 나이로 추정").fill("36");
  59  |       await page.getByRole("checkbox", { name: "혼인 상태" }).check();
  60  |       await page.getByRole("checkbox", { name: "생애최초 주택 구입" }).check();
  61  |     });
  62  | 
  63  |     test("10초 안내 후 정상 응답으로 전환한다", async ({ page }, info) => {
  64  |       let release = () => {};
  65  |       const gate = new Promise<void>((resolve) => { release = resolve; });
  66  |       await page.route("**/subscription/simulate", async (route) => {
  67  |         await gate;
  68  |         await route.fulfill({ json: success });
  69  |       });
  70  |       try {
  71  |         await page.getByRole("button", { name: "자격 확인하기" }).click();
  72  |         await expect(page.getByRole("status")).toContainText("청약 자격을 확인하고 있어요");
  73  |         await expect(page.getByRole("button", { name: "확인 중...", exact: true })).toBeDisabled();
  74  |         await expectInputsPreserved(page);
  75  |         await capture(page, info, "loading");
  76  |         await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다", { timeout: 15_000 });
  77  |         await expect(page.getByRole("status")).toContainText(/경과\s+1\d초/);
  78  |         await expect(page.getByRole("button", { name: "서버 준비 중...", exact: true })).toBeDisabled();
  79  |         await expectInputsPreserved(page);
  80  |         await capture(page, info, "loading-after-10s");
  81  |         release();
  82  |         await expectSuccess(page, info);
  83  |       } finally {
  84  |         release();
  85  |         await page.unrouteAll({ behavior: "ignoreErrors" });
  86  |       }
  87  |     });
  88  | 
  89  |     for (const failure of ["network", "http", "timeout"] as const) {
  90  |       test(`${failure} 후 같은 입력으로 재시도하여 성공한다`, async ({ page }, info) => {
  91  |         if (failure === "timeout") test.setTimeout(75_000);
  92  |         const requests: CapturedRequest[] = [];
  93  |         const failedRequests: string[] = [];
  94  |         page.on("requestfailed", (request) => {
  95  |           if (request.url().endsWith("/subscription/simulate")) failedRequests.push(request.failure()?.errorText ?? "unknown");
  96  |         });
  97  |         await page.route("**/subscription/simulate", async (route) => {
  98  |           requests.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData() });
  99  |           if (requests.length > 1) {
  100 |             await route.fulfill({ json: success });
  101 |           } else {
  102 |             if (failure === "network") await route.abort("failed");
  103 |             if (failure === "http") await route.fulfill({ status: 503, json: { error: "테스트용 서버 오류" } });
  104 |             // timeout 요청은 처리하지 않고 기존 AbortController가 취소하게 둔다.
  105 |           }
  106 |         });
  107 |         const startedAt = performance.now();
  108 |         await page.getByRole("button", { name: "자격 확인하기" }).click();
  109 |         if (failure === "timeout") {
  110 |           await expect(page.getByRole("status")).toContainText("청약 자격을 확인하고 있어요");
  111 |           await expectInputsPreserved(page);
  112 |           await capture(page, info, "loading");
  113 |           await expect(page.getByRole("status")).toContainText("서버가 잠시 준비 중입니다", { timeout: 15_000 });
  114 |           await expectInputsPreserved(page);
  115 |           await capture(page, info, "loading-after-10s");
  116 |           await expect.poll(() => performance.now() - startedAt, { timeout: 45_000, intervals: [250] }).toBeGreaterThanOrEqual(40_000);
  117 |           await expect(page.getByRole("alert")).toHaveCount(0);
  118 |           await expect(page.getByRole("button", { name: "서버 준비 중...", exact: true })).toBeDisabled();
  119 |         }
  120 |         const alert = page.getByRole("alert");
> 121 |         await expect(alert).toContainText(failure === "timeout" ? "서버 준비 중이에요" : failure === "http" ? "청약 자격 확인에 실패했어요" : "네트워크 연결이 불안정해요", { timeout: failure === "timeout" ? 20_000 : 5000 });
      |                             ^ Error: expect(locator).toContainText(expected) failed
  122 |         if (failure === "http") await expect(alert).toContainText("테스트용 서버 오류");
  123 |         if (failure === "timeout") {
  124 |           const elapsed = performance.now() - startedAt;
  125 |           expect(elapsed).toBeGreaterThanOrEqual(45_000);
  126 |           expect(elapsed).toBeLessThan(60_000);
  127 |           await info.attach("timeout-elapsed-ms", { body: String(elapsed), contentType: "text/plain" });
  128 |           await expect.poll(() => failedRequests.join(" ")).toMatch(/ERR_ABORTED/);
  129 |         }
  130 |         await expect(page.getByRole("status")).toHaveCount(0);
  131 |         await expect(page.getByRole("button", { name: "자격 확인하기" })).toBeEnabled();
  132 |         const retry = alert.getByRole("button", { name: "다시 시도" });
  133 |         await expect(retry).toBeEnabled();
  134 |         await retry.scrollIntoViewIfNeeded();
  135 |         await expect(retry).toBeInViewport();
  136 |         await capture(page, info, failure);
  137 |         await expectInputsPreserved(page);
  138 |         expect(requests).toHaveLength(1);
  139 |         expect(JSON.parse(requests[0].body ?? "null")).toEqual({ age: 31, income: 4500, homelessMonths: 24, dependents: 2, savingsMonths: 36, isMarried: true, isFirstHome: true });
  140 |         await retry.click();
  141 |         await expectSuccess(page, info);
  142 |         expect(requests).toHaveLength(2);
  143 |         expect(requests[0].method).toBe("POST");
  144 |         expect(requests[1]).toEqual(requests[0]);
  145 |       });
  146 |     }
  147 |   });
  148 | }
  149 | 
```