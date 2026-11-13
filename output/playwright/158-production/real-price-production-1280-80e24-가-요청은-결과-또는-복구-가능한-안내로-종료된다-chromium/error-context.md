# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-price-production.spec.ts >> 1280px >> 실제 실거래가 요청은 결과 또는 복구 가능한 안내로 종료된다
- Location: tests/real-price-production.spec.ts:6:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('참고용이며 법적 효력 없음').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "soft toBeVisible" with timeout 5000ms
  - waiting for getByText('참고용이며 법적 효력 없음').first()

```

```yaml
- banner:
  - link "Zipath":
    - /url: /
  - navigation:
    - link "청약":
      - /url: /subscription
    - link "대출":
      - /url: /loan
    - link "체크리스트":
      - /url: /checklist
- main:
  - heading "실거래가 조회" [level=1]
  - link "지역 간 비교 →":
    - /url: /real-price/compare
  - paragraph: 국토교통부 아파트 매매 실거래가 데이터를 조회합니다.
  - button "테이블"
  - button "차트"
  - button "월별 추이"
  - text: 지역
  - combobox:
    - option "서울 종로구"
    - option "서울 중구"
    - option "서울 용산구"
    - option "서울 성동구"
    - option "서울 광진구"
    - option "서울 동대문구"
    - option "서울 중랑구"
    - option "서울 성북구"
    - option "서울 강북구"
    - option "서울 도봉구"
    - option "서울 노원구"
    - option "서울 은평구"
    - option "서울 서대문구"
    - option "서울 마포구"
    - option "서울 양천구"
    - option "서울 강서구"
    - option "서울 구로구"
    - option "서울 금천구"
    - option "서울 영등포구"
    - option "서울 동작구"
    - option "서울 관악구"
    - option "서울 서초구"
    - option "서울 강남구" [selected]
    - option "서울 송파구"
    - option "서울 강동구"
    - option "경기 수원시 장안구"
    - option "경기 수원시 권선구"
    - option "경기 수원시 팔달구"
    - option "경기 수원시 영통구"
    - option "경기 성남시 수정구"
    - option "경기 성남시 중원구"
    - option "경기 성남시 분당구"
    - option "경기 고양시 덕양구"
    - option "경기 고양시 일산동구"
    - option "경기 고양시 일산서구"
    - option "경기 화성시"
    - option "경기 파주시"
    - option "경기 용인시 처인구"
    - option "경기 용인시 기흥구"
    - option "경기 용인시 수지구"
    - option "경기 김포시"
    - option "인천 중구"
    - option "인천 동구"
    - option "인천 미추홀구"
    - option "인천 연수구"
    - option "인천 남동구"
    - option "인천 부평구"
    - option "인천 계양구"
    - option "인천 서구"
    - option "부산 중구"
    - option "부산 서구"
    - option "부산 동구"
    - option "부산 영도구"
    - option "부산 부산진구"
    - option "부산 동래구"
    - option "부산 남구"
    - option "부산 북구"
    - option "부산 해운대구"
    - option "부산 사하구"
    - option "부산 금정구"
    - option "부산 강서구"
    - option "부산 연제구"
    - option "부산 수영구"
    - option "부산 사상구"
    - option "부산 기장군"
  - text: 계약월
  - combobox:
    - option "2026년 11월" [selected]
    - option "2026년 10월"
    - option "2026년 9월"
    - option "2026년 8월"
    - option "2026년 7월"
    - option "2026년 6월"
    - option "2026년 5월"
    - option "2026년 4월"
    - option "2026년 3월"
    - option "2026년 2월"
    - option "2026년 1월"
    - option "2025년 12월"
  - button "조회"
  - heading "평형별 필터" [level=3]
  - button "전체"
  - button "~60㎡ (소형)"
  - button "60~85㎡ (중형)"
  - button "85~135㎡ (대형)"
  - button "135㎡~ (초대형)"
  - button "직접 입력"
- alert
```

```
Error: page.screenshot: Target page, context or browser has been closed
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  |
  3  | for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  4  |   test.describe(`${viewport.width}px`, () => {
  5  |     test.use({ viewport });
  6  |     test("실제 실거래가 요청은 결과 또는 복구 가능한 안내로 종료된다", async ({ page, baseURL }, testInfo) => {
  7  |       test.setTimeout(150_000);
  8  |       expect(baseURL, "실제 운영 URL을 명시해야 한다").toBe("https://zipath-web.vercel.app");
  9  |       const events: object[] = [];
  10 |       page.on("console", (message) => {
  11 |         if (message.type() === "error") events.push({ type: "console", text: message.text() });
  12 |       });
  13 |       page.on("pageerror", (error) => events.push({ type: "pageerror", text: error.message }));
  14 |       page.on("requestfailed", (request) => events.push({ type: "requestfailed", url: request.url(), error: request.failure() }));
  15 |       page.on("response", (response) => {
  16 |         if (new URL(response.url()).pathname === "/api/real-price") {
  17 |           events.push({ type: "response", url: response.url(), status: response.status(), at: new Date().toISOString() });
  18 |         }
  19 |       });
  20 |       const requestUrls: string[] = [];
  21 |       page.on("request", (request) => {
  22 |         if (new URL(request.url()).pathname === "/api/real-price") {
  23 |           requestUrls.push(request.url());
  24 |           events.push({ type: "request", url: request.url(), at: new Date().toISOString() });
  25 |         }
  26 |       });
  27 |       try {
  28 |         const response = await page.goto("/real-price");
  29 |         expect(response?.status()).toBeLessThan(400);
  30 |         await expect(page.getByRole("heading", { name: "실거래가 조회", exact: true })).toBeVisible();
  31 |         const month = page.locator("label", { hasText: "계약월" }).locator("xpath=following-sibling::select");
  32 |         const region = page.locator("label", { hasText: "지역" }).locator("xpath=following-sibling::select");
  33 |         await expect(month).toHaveValue(/^\d{6}$/);
  34 |         events.push({ type: "conditions", region: await region.inputValue(), month: await month.inputValue() });
  35 |         // Keep collecting the actual request even when an older deployment lacks the disclaimer.
  36 |         await expect.soft(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
  37 |         for (let attempt = 0; attempt < 2; attempt++) {
  38 |           const started = Date.now();
  39 |           if (attempt === 0) {
  40 |             await page.getByRole("button", { name: "조회", exact: true }).click();
  41 |           } else {
  42 |             const retry = page.locator("main").getByRole("alert").getByRole("button", { name: "다시 시도" });
  43 |             await retry.scrollIntoViewIfNeeded();
  44 |             await expect(retry).toBeInViewport();
  45 |             const box = await retry.boundingBox();
  46 |             expect(box).not.toBeNull();
  47 |             expect(box!.x).toBeGreaterThanOrEqual(0);
  48 |             expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  49 |             await page.getByRole("button", { name: "조회", exact: true }).focus();
  50 |             for (let step = 0; step < 20 && !(await retry.evaluate((el) => el === document.activeElement)); step++) {
  51 |               await page.keyboard.press("Tab");
  52 |             }
  53 |             await expect(retry).toBeFocused();
  54 |             await page.keyboard.press("Enter");
  55 |           }
  56 |           await expect.poll(() => requestUrls.length).toBe(attempt + 1);
  57 |           await testInfo.attach(`attempt-${attempt + 1}-loading`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  58 |           let outcome = "pending";
  59 |           try {
  60 |             await expect.poll(async () => {
  61 |               if (await page.getByRole("button", { name: "조회 중...", exact: true }).count()) return "pending";
  62 |               if (await page.locator("main").getByRole("alert").count()) {
  63 |                 return (await page.locator("main").getByRole("alert").innerText()).includes("서버 준비 중이에요") ? "timeout" : "error";
  64 |               }
  65 |               if (await page.getByText("검색 결과가 없습니다").count()) return "empty";
  66 |               if (await page.getByRole("table").locator("tbody tr").count()) return "success";
  67 |               return "pending";
  68 |             }, { timeout: Math.max(1, 48_000 - (Date.now() - started)), intervals: [100, 250, 500] }).not.toBe("pending");
  69 |             const alert = page.locator("main").getByRole("alert");
  70 |             outcome = await alert.count()
  71 |               ? ((await alert.innerText()).includes("서버 준비 중이에요") ? "timeout" : "error")
  72 |               : await page.getByText("검색 결과가 없습니다").count() ? "empty" : "success";
  73 |             await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
  74 |             await expect(page.getByRole("status")).toHaveCount(0);
  75 |           } finally {
  76 |             events.push({ type: "terminal", attempt: attempt + 1, outcome, elapsedMs: Date.now() - started, at: new Date().toISOString(), searchEnabled: await page.getByRole("button", { name: "조회", exact: true }).isEnabled().catch(() => false) });
> 77 |             await testInfo.attach(`attempt-${attempt + 1}-terminal`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
     |                                                                                         ^ Error: page.screenshot: Target page, context or browser has been closed
  78 |           }
  79 |           if (attempt === 1) expect(requestUrls[1]).toBe(requestUrls[0]);
  80 |           if (outcome === "success" || outcome === "empty") break;
  81 |         }
  82 |       } finally {
  83 |         await testInfo.attach("actual-production-observations", { body: JSON.stringify({ url: baseURL, viewport, events }, null, 2), contentType: "application/json" });
  84 |       }
  85 |     });
  86 |   });
  87 | }
  88 |
```
