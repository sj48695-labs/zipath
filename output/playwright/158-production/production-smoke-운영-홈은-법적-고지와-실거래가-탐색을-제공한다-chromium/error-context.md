# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-smoke.spec.ts >> 운영 홈은 법적 고지와 실거래가 탐색을 제공한다
- Location: tests/production-smoke.spec.ts:15:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('법적 고지')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('법적 고지')

```

```yaml
- banner:
  - text: Zipath
  - navigation:
    - link "청약":
      - /url: /subscription
    - link "대출":
      - /url: /loan
    - link "체크리스트":
      - /url: /checklist
- heading "내 집으로 가는 길, Zipath" [level=1]
- paragraph: 부동산이 처음이라도 괜찮아요. 청약 자격 확인부터 계약서 체크리스트까지, 필요한 모든 정보를 한 곳에서 확인하세요.
- link "청약 자격 확인하기":
  - /url: /subscription
- link "체크리스트 보기":
  - /url: /checklist
- heading "주요 기능" [level=2]
- link "🏠 청약 자격 시뮬레이션 나이, 소득, 무주택 기간을 입력하면 청약 가능 여부를 바로 확인할 수 있어요.":
  - /url: /subscription
  - text: 🏠
  - heading "청약 자격 시뮬레이션" [level=3]
  - paragraph: 나이, 소득, 무주택 기간을 입력하면 청약 가능 여부를 바로 확인할 수 있어요.
- link "💰 대출 한도 계산기 연소득과 기존 대출을 기반으로 받을 수 있는 대출 금액을 계산해드려요.":
  - /url: /loan
  - text: 💰
  - heading "대출 한도 계산기" [level=3]
  - paragraph: 연소득과 기존 대출을 기반으로 받을 수 있는 대출 금액을 계산해드려요.
- link "✅ 계약서 체크리스트 월세, 전세, 매매 유형별로 계약 시 꼭 확인해야 할 항목을 정리했어요.":
  - /url: /checklist
  - text: ✅
  - heading "계약서 체크리스트" [level=3]
  - paragraph: 월세, 전세, 매매 유형별로 계약 시 꼭 확인해야 할 항목을 정리했어요.
- link "📊 실거래가 조회 국토교통부 실거래가 데이터로 관심 지역의 시세를 확인하세요.":
  - /url: /real-price
  - text: 📊
  - heading "실거래가 조회" [level=3]
  - paragraph: 국토교통부 실거래가 데이터로 관심 지역의 시세를 확인하세요.
- link "📢 공공분양 공고 최신 공공분양 공고를 한눈에 확인하고, 주요 정보를 요약해드려요.":
  - /url: /announcements
  - text: 📢
  - heading "공공분양 공고" [level=3]
  - paragraph: 최신 공공분양 공고를 한눈에 확인하고, 주요 정보를 요약해드려요.
- link "📖 부동산 용어 사전 갑구, 을구, 근저당... 어려운 부동산 용어를 쉽게 설명해드려요.":
  - /url: /glossary
  - text: 📖
  - heading "부동산 용어 사전" [level=3]
  - paragraph: 갑구, 을구, 근저당... 어려운 부동산 용어를 쉽게 설명해드려요.
- contentinfo:
  - paragraph: Zipath - 부동산 입문자를 위한 올인원 가이드
  - paragraph: 본 서비스에서 제공하는 모든 정보는 참고용이며, 법적 효력이 없습니다.
  - link "개인정보처리방침":
    - /url: /privacy
  - link "이용약관":
    - /url: /terms
- alert
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  |
  3  | const HYDRATION_RE =
  4  |   /hydration|Minified React error #(418|423|425)|Text content does not match server-rendered HTML/i;
  5  |
  6  | test("운영 홈은 핵심 안내를 렌더링한다", async ({ page }) => {
  7  |   const response = await page.goto("/");
  8  |
  9  |   expect(response?.status()).toBeLessThan(400);
  10 |   await expect(
  11 |     page.getByRole("heading", { name: /내 집으로 가는 길,\s*Zipath/ }),
  12 |   ).toBeVisible();
  13 | });
  14 |
  15 | test("운영 홈은 법적 고지와 실거래가 탐색을 제공한다", async ({ page }) => {
  16 |   await page.setViewportSize({ width: 390, height: 844 });
  17 |   const response = await page.goto("/");
  18 |   expect(response?.status()).toBeLessThan(400);
  19 |
> 20 |   await expect(page.getByText("법적 고지")).toBeVisible();
     |                                         ^ Error: expect(locator).toBeVisible() failed
  21 |   await page.getByRole("button", { name: "메뉴 열기" }).click();
  22 |   await expect(
  23 |     page.locator("#mobile-nav-menu").getByRole("link", { name: "실거래가" }),
  24 |   ).toBeVisible();
  25 | });
  26 |
  27 | test("운영 청약 화면은 청약통장 필드와 확인 중 상태를 제공한다", async ({
  28 |   page,
  29 | }) => {
  30 |   await page.route("**/subscription/simulate", async (route) => {
  31 |     await new Promise((resolve) => {
  32 |       setTimeout(resolve, 1500);
  33 |     });
  34 |     await route.fulfill({
  35 |       status: 200,
  36 |       contentType: "application/json",
  37 |       body: JSON.stringify({
  38 |         results: [],
  39 |         points: [],
  40 |         totalPoints: 0,
  41 |         maxPoints: 0,
  42 |         message: "ok",
  43 |       }),
  44 |     });
  45 |   });
  46 |
  47 |   const response = await page.goto("/subscription");
  48 |   expect(response?.status()).toBeLessThan(400);
  49 |   await expect(page.getByText("청약통장 가입기간")).toBeVisible();
  50 |
  51 |   await page.getByPlaceholder("만 나이").fill("29");
  52 |   await page.getByPlaceholder("연소득").fill("4000");
  53 |   await page.getByPlaceholder("개월 수").fill("36");
  54 |   await page.getByRole("button", { name: "자격 확인하기" }).click();
  55 |   await expect(page.getByRole("button", { name: /확인 중/ })).toBeDisabled();
  56 | });
  57 |
  58 | test("운영 실거래가 직접 접근 시 hydration console error가 없다", async ({
  59 |   page,
  60 | }) => {
  61 |   const hydration: string[] = [];
  62 |   page.on("console", (message) => {
  63 |     if (message.type() === "error" && HYDRATION_RE.test(message.text())) {
  64 |       hydration.push(message.text());
  65 |     }
  66 |   });
  67 |   page.on("pageerror", (error) => {
  68 |     if (HYDRATION_RE.test(error.message)) {
  69 |       hydration.push(error.message);
  70 |     }
  71 |   });
  72 |
  73 |   const response = await page.goto("/real-price");
  74 |   expect(response?.status()).toBeLessThan(400);
  75 |   await expect(page.getByRole("heading", { name: "실거래가 조회" })).toBeVisible();
  76 |   expect(hydration).toEqual([]);
  77 | });
  78 |
  79 | test("운영 환경은 favicon을 제공한다", async ({ request }) => {
  80 |   const response = await request.get("/favicon.ico");
  81 |   const contentType = response.headers()["content-type"] ?? "";
  82 |
  83 |   expect(response.status()).toBe(200);
  84 |   expect(contentType).toMatch(/image\/(x-icon|vnd\.microsoft\.icon|icon)/i);
  85 |   expect((await response.body()).byteLength).toBeGreaterThan(0);
  86 | });
  87 |
```
