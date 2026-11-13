# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-price-timeout.spec.ts >> 390px >> 45초 timeout 뒤 늦은 응답은 timeout 안내를 바꾸지 않는다
- Location: tests/real-price-timeout.spec.ts:13:11

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('status')
Expected substring: "서버가 준비 중입니다"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('status')

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
  - button "조회 중..." [disabled]
  - heading "평형별 필터" [level=3]
  - button "전체"
  - button "~60㎡ (소형)"
  - button "60~85㎡ (중형)"
  - button "85~135㎡ (대형)"
  - button "135㎡~ (초대형)"
  - button "직접 입력"
- alert
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  |
  3  | const trade = (aptNm: string) => ({
  4  |   aptNm, dealAmount: "120,000", buildYear: "2010", dealYear: "2026",
  5  |   dealMonth: "8", dealDay: "12", excluUseAr: "84.9", floor: "7",
  6  |   umdNm: "역삼동", jibun: "123", roadNm: "테헤란로",
  7  | });
  8  |
  9  | for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  10 |   test.describe(`${viewport.width}px`, () => {
  11 |     test.use({ viewport });
  12 |     for (const retryFirst of [false, true]) {
  13 |       test(`45초 timeout 뒤 늦은 응답은 ${retryFirst ? "재시도 결과" : "timeout 안내"}를 바꾸지 않는다`, async ({ page }, testInfo) => {
  14 |         const requests: string[] = [];
  15 |         const failures: { url: string; error: string | null }[] = [];
  16 |         page.on("requestfailed", (request) => {
  17 |           if (new URL(request.url()).pathname === "/api/real-price") {
  18 |             failures.push({ url: request.url(), error: request.failure()?.errorText ?? null });
  19 |           }
  20 |         });
  21 |         let release!: () => void;
  22 |         let finished!: () => void;
  23 |         const held = new Promise<void>((resolve) => { release = resolve; });
  24 |         const released = new Promise<void>((resolve) => { finished = resolve; });
  25 |         await page.route("**/api/real-price?*", async (route) => {
  26 |           requests.push(route.request().url());
  27 |           if (requests.length === 1) {
  28 |             await held;
  29 |             try {
  30 |               await route.fulfill({ json: { trades: [trade("늦은응답아파트")] } });
  31 |             } finally {
  32 |               finished();
  33 |             }
  34 |           } else {
  35 |             await route.fulfill({ json: { trades: [trade("재시도아파트")] } });
  36 |           }
  37 |         });
  38 |         await page.goto("/real-price");
  39 |         await expect(page.locator("label", { hasText: "계약월" }).locator("xpath=following-sibling::select")).toHaveValue(/^\d{6}$/);
  40 |         const clockTime = new Date("2026-11-11T00:00:00Z");
  41 |         await page.clock.install({ time: clockTime });
  42 |         await page.clock.pauseAt(new Date(clockTime.getTime() + 1_000));
  43 |         await page.getByRole("button", { name: "조회", exact: true }).click();
  44 |         try {
  45 |           await expect.poll(() => requests.length).toBe(1);
  46 |           await page.clock.runFor(10_000);
> 47 |           await expect(page.getByRole("status")).toContainText("서버가 준비 중입니다");
     |                                                  ^ Error: expect(locator).toContainText(expected) failed
  48 |           await page.clock.runFor(34_999);
  49 |           await expect(page.getByRole("button", { name: "조회 중...", exact: true })).toBeDisabled();
  50 |           await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  51 |           await page.clock.runFor(1);
  52 |           const alert = page.locator("main").getByRole("alert");
  53 |           await expect(alert).toContainText("서버 준비 중이에요");
  54 |           await expect(page.getByRole("status")).toHaveCount(0);
  55 |           await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
  56 |           await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);
  57 |           const retry = alert.getByRole("button", { name: "다시 시도" });
  58 |           await retry.scrollIntoViewIfNeeded();
  59 |           await expect(retry).toBeInViewport();
  60 |           await expect(retry).toBeEnabled();
  61 |           const box = await alert.boundingBox();
  62 |           expect(box).not.toBeNull();
  63 |           expect(box!.x).toBeGreaterThanOrEqual(0);
  64 |           expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  65 |           await testInfo.attach("timeout", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  66 |           await expect.poll(() => failures.length).toBe(1);
  67 |           expect(failures[0].error).toMatch(/ABORTED|CANCELLED/i);
  68 |           if (retryFirst) {
  69 |             await retry.click();
  70 |             await expect(page.getByRole("table")).toContainText("재시도아파트");
  71 |             expect(requests).toHaveLength(2);
  72 |             expect(requests[1]).toBe(requests[0]);
  73 |           }
  74 |           release();
  75 |           await released;
  76 |           // Drain browser tasks after releasing the intercepted, already aborted request.
  77 |           await page.clock.runFor(100);
  78 |           await expect(page.getByText("늦은응답아파트")).toHaveCount(0);
  79 |           if (retryFirst) {
  80 |             await expect(page.getByRole("table")).toContainText("재시도아파트");
  81 |             await expect(alert).toHaveCount(0);
  82 |           } else {
  83 |             await expect(alert).toContainText("서버 준비 중이에요");
  84 |             await expect(retry).toBeEnabled();
  85 |           }
  86 |           await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
  87 |           await testInfo.attach("late-response", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  88 |         } finally {
  89 |           release();
  90 |           await testInfo.attach("requests", { body: JSON.stringify({ requests, failures }, null, 2), contentType: "application/json" });
  91 |         }
  92 |       });
  93 |     }
  94 |   });
  95 | }
  96 |
```
