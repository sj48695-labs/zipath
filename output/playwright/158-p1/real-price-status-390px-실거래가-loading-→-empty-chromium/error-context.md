# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-price-status.spec.ts >> 390px >> 실거래가 loading → empty
- Location: tests/real-price-status.spec.ts:24:11

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('참고용이며 법적 효력 없음').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
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

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   |
  3   | function monthSelect(page: Page) {
  4   |   return page.locator("label", { hasText: "계약월" }).locator("xpath=following-sibling::select");
  5   | }
  6   |
  7   | async function openSearch(page: Page): Promise<void> {
  8   |   await page.goto("/real-price");
  9   |   await expect(monthSelect(page)).toHaveValue(/^\d{6}$/);
> 10  |   await expect(page.getByText("참고용이며 법적 효력 없음", { exact: false }).first()).toBeVisible();
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  11  | }
  12  |
  13  | const trade = {
  14  |   aptNm: "검증아파트", dealAmount: "120,000", buildYear: "2010",
  15  |   dealYear: "2026", dealMonth: "8", dealDay: "12", excluUseAr: "84.9",
  16  |   floor: "7", umdNm: "역삼동", jibun: "123", roadNm: "테헤란로",
  17  | };
  18  |
  19  | for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  20  |   test.describe(`${viewport.width}px`, () => {
  21  |     test.use({ viewport });
  22  |
  23  |     for (const outcome of ["success", "empty"] as const) {
  24  |       test(`실거래가 loading → ${outcome}`, async ({ page }, testInfo) => {
  25  |         let releaseResponse!: () => void;
  26  |         const held = new Promise<void>((resolve) => { releaseResponse = resolve; });
  27  |         await page.route("**/api/real-price?*", async (route) => {
  28  |           await held;
  29  |           await route.fulfill({ json: { trades: outcome === "success" ? [trade] : [] } });
  30  |         });
  31  |         await openSearch(page);
  32  |         await page.getByRole("button", { name: "조회", exact: true }).click();
  33  |         try {
  34  |           await expect(page.getByRole("button", { name: "조회 중...", exact: true })).toBeDisabled();
  35  |           await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");
  36  |           await expect(page.getByRole("status")).toContainText("실거래가를 조회하고 있어요");
  37  |           await testInfo.attach("loading", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  38  |         } finally {
  39  |           releaseResponse();
  40  |         }
  41  |         if (outcome === "success") {
  42  |           await expect(page.getByRole("table")).toContainText(trade.aptNm);
  43  |           await expect(page.getByText("총 1건 (최대 50건 표시)")).toBeVisible();
  44  |           await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);
  45  |         } else {
  46  |           const empty = page.getByText("검색 결과가 없습니다");
  47  |           await empty.scrollIntoViewIfNeeded();
  48  |           await expect(empty).toBeInViewport();
  49  |           await expect(page.getByText("다른 계약월을 선택해보세요.")).toBeVisible();
  50  |           await expect(page.getByText("다른 지역을 선택해 다시 조회해보세요.")).toBeVisible();
  51  |           const box = await empty.boundingBox();
  52  |           expect(box).not.toBeNull();
  53  |           expect(box!.x).toBeGreaterThanOrEqual(0);
  54  |           expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  55  |         }
  56  |         await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  57  |         await expect(page.getByRole("status")).toHaveCount(0);
  58  |         await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
  59  |         await testInfo.attach(outcome, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  60  |       });
  61  |     }
  62  |
  63  |     test("HTTP 오류 후 입력을 바꿔도 동일 조건으로 재시도해 거래를 표시한다", async ({ page }, testInfo) => {
  64  |       const requests: string[] = [];
  65  |       let releaseResponse!: () => void;
  66  |       const held = new Promise<void>((resolve) => { releaseResponse = resolve; });
  67  |       await page.route("**/api/real-price?*", async (route) => {
  68  |         requests.push(route.request().url());
  69  |         if (requests.length === 1) {
  70  |           await held;
  71  |           await route.fulfill({ status: 500, json: { error: "일시적인 오류" } });
  72  |         } else {
  73  |           await route.fulfill({ json: { trades: [trade] } });
  74  |         }
  75  |       });
  76  |       await openSearch(page);
  77  |       await page.getByRole("button", { name: "조회", exact: true }).click();
  78  |       try {
  79  |         await expect(page.getByRole("button", { name: "조회 중...", exact: true })).toBeDisabled();
  80  |         await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");
  81  |       } finally {
  82  |         releaseResponse();
  83  |       }
  84  |       const alert = page.locator("main").getByRole("alert");
  85  |       await expect(alert).toContainText("실거래가 조회에 실패했어요");
  86  |       await expect(page.getByRole("status")).toHaveCount(0);
  87  |       await expect(page.getByText("검색 결과가 없습니다")).toHaveCount(0);
  88  |       await expect(page.getByRole("button", { name: "조회", exact: true })).toBeEnabled();
  89  |       const retry = alert.getByRole("button", { name: "다시 시도" });
  90  |       await retry.scrollIntoViewIfNeeded();
  91  |       await expect(retry).toBeInViewport();
  92  |       const box = await alert.boundingBox();
  93  |       expect(box).not.toBeNull();
  94  |       expect(box!.x).toBeGreaterThanOrEqual(0);
  95  |       expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  96  |       await testInfo.attach("error", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  97  |       await page.locator("label", { hasText: "지역" }).locator("xpath=following-sibling::select").selectOption({ index: 1 });
  98  |       await monthSelect(page).selectOption({ index: 1 });
  99  |       // Tab from the preceding search button verifies keyboard reachability.
  100 |       await page.getByRole("button", { name: "조회", exact: true }).focus();
  101 |       await page.keyboard.press("Tab");
  102 |       // Area filters precede retry, so walk the actual tab order rather than focusing retry directly.
  103 |       for (let step = 0; step < 20 && !(await retry.evaluate((el) => el === document.activeElement)); step++) {
  104 |         await page.keyboard.press("Tab");
  105 |       }
  106 |       await expect(retry).toBeFocused();
  107 |       await page.keyboard.press("Enter");
  108 |       await expect(page.getByRole("table")).toContainText(trade.aptNm);
  109 |       expect(requests).toHaveLength(2);
  110 |       expect(requests[1]).toBe(requests[0]);
```
