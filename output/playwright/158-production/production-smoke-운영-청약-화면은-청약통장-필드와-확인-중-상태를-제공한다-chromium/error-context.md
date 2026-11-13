# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-smoke.spec.ts >> 운영 청약 화면은 청약통장 필드와 확인 중 상태를 제공한다
- Location: tests/production-smoke.spec.ts:27:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('청약통장 가입기간')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('청약통장 가입기간')

```

```yaml
- banner:
  - link "Zipath":
    - /url: /
- main:
  - heading "청약 자격 시뮬레이션" [level=1]
  - paragraph: 기본 정보를 입력하면 청약 가능 여부와 예상 가점을 확인할 수 있어요.
  - text: 나이
  - spinbutton
  - text: 연소득 (만원)
  - spinbutton
  - text: 무주택 기간 (개월)
  - spinbutton
  - text: 부양가족 수
  - spinbutton
  - checkbox "혼인 상태"
  - text: 혼인 상태
  - checkbox "생애최초 주택 구입"
  - text: 생애최초 주택 구입
  - button "자격 확인하기"
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
  20 |   await expect(page.getByText("법적 고지")).toBeVisible();
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
> 49 |   await expect(page.getByText("청약통장 가입기간")).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
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
