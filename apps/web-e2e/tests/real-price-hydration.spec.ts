import { expect, test, type Page } from "@playwright/test";

const HYDRATION_PATTERNS = [
  /hydration/i,
  /Text content does not match server-rendered HTML/i,
  /There was an error while hydrating/i,
  /Minified React error #418/i,
  /Minified React error #423/i,
  /Minified React error #425/i,
];

function isHydrationMessage(message: string): boolean {
  return HYDRATION_PATTERNS.some((pattern) => pattern.test(message));
}

function collectHydrationIssues(page: Page): string[] {
  const issues: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    const text = message.text();
    if (isHydrationMessage(text)) {
      issues.push(text);
    }
  });

  page.on("pageerror", (error) => {
    if (isHydrationMessage(error.message)) {
      issues.push(error.message);
    }
  });

  return issues;
}

function expectPendingMonthSelect(documentHtml: string): void {
  const contractMonthSelect = documentHtml.match(
    /계약월[\s\S]*?<select[^>]*>([\s\S]*?)<\/select>/,
  );

  if (!contractMonthSelect) {
    throw new Error("서버 HTML에 계약월 select가 있어야 합니다.");
  }

  expect(
    contractMonthSelect[0],
    "배포본이 날짜 기반 계약월을 서버 HTML에 포함했거나 최신 소스와 다릅니다.",
  ).toContain("disabled");
  expect(contractMonthSelect[1]).toContain('value=""');
  expect(contractMonthSelect[1]).toContain("불러오는 중...");
  expect(contractMonthSelect[1]).not.toMatch(/value="\d{6}"/);
}

function contractMonthSelect(page: Page) {
  return page
    .locator("label", { hasText: "계약월" })
    .locator("xpath=following-sibling::select");
}

const routes = [
  { path: "/real-price", heading: "실거래가 조회" },
  { path: "/real-price/compare", heading: "지역 간 비교" },
] as const;

for (const { path, heading } of routes) {
  test(`${path} 서버 월 선택 초기 상태를 유지하고 경고 없이 하이드레이션한다`, async ({
    page,
  }) => {
    const issues = collectHydrationIssues(page);
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    expect(response).not.toBeNull();
    expectPendingMonthSelect(await response!.text());

    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    if (path === "/real-price") {
      await expect(
        page.getByText("실거래가 조회는 현재 수도권·부산만 지원합니다.", {
          exact: false,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("서울·경기·인천·부산의 일부 지역으로 제한", {
          exact: false,
        }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByText("현재 지원 범위: 수도권·부산", { exact: false }),
      ).toBeVisible();
      await expect(
        page.getByText("아래 목록에서만 선택", { exact: false }),
      ).toBeVisible();
    }

    await expect(
      page.getByText("참고용이며 법적 효력 없음", { exact: false }).first(),
    ).toBeVisible();
    await expect(contractMonthSelect(page)).toHaveValue(/^\d{6}$/);
    expect(issues).toEqual([]);
  });
}
