import { expect, test } from "@playwright/test";

type AnnouncementItem = {
  id: number;
  title: string;
  region: string;
  supplyType: string;
  startDate: string;
  endDate: string;
  detailUrl: string | null;
  summary: string | null;
  rawData: Record<string, unknown> | null;
};

function createResponse(items: AnnouncementItem[], lastSyncedAt: string | null) {
  return {
    items,
    totalCount: items.length,
    page: 1,
    limit: 10,
    lastSyncedAt,
  };
}

const sampleItem: AnnouncementItem = {
  id: 1,
  title: "테스트 아파트",
  region: "서울",
  supplyType: "공공분양",
  startDate: "2026-03-01",
  endDate: "2026-03-31",
  detailUrl: "https://example.com",
  summary: "테스트 공고입니다.",
  rawData: null,
};

test("공고 페이지는 데이터 없음 상태에서 다음 행동과 법적 고지를 안내한다", async ({
  page,
}) => {
  await page.route("**/api/announcements**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createResponse([], "2026-07-05T00:00:00.000Z")),
    });
  });

  const response = await page.goto("/announcements");
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole("heading", { name: "공공분양 공고" })).toBeVisible();
  await expect(page.getByText("참고용이며 법적 효력 없음")).toBeVisible();
  await expect(page.getByText("현재 등록된 공고가 없습니다.")).toBeVisible();
  await expect(page.getByText("마지막 동기화")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "청약홈에서 직접 확인하기" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "다시 불러오기" }),
  ).toBeVisible();
});

test("공고 페이지는 필터 결과 없음 상태를 별도로 안내한다", async ({
  page,
}) => {
  const requestedUrls: string[] = [];

  await page.route("**/api/announcements**", async (route) => {
    requestedUrls.push(route.request().url());
    const url = new URL(route.request().url());
    const region = url.searchParams.get("region");
    const items = region === "서울" ? [] : [sampleItem];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createResponse(items, "2026-07-05T00:00:00.000Z")),
    });
  });

  const response = await page.goto("/announcements");
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByText("테스트 아파트")).toBeVisible();

  await page.getByLabel("지역 필터").fill("서울");
  await page.getByRole("button", { name: "필터 적용" }).click();

  await expect(page.getByText("선택한 지역의 공고가 없습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "필터 초기화" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "청약홈에서 직접 확인하기" }),
  ).toBeVisible();
  expect(requestedUrls.some((url) => url.includes("region=서울"))).toBe(true);
});

test("공고 페이지는 API 실패를 빈 상태와 분리해 보여준다", async ({ page }) => {
  await page.route("**/api/announcements**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: "공고 API 응답이 올바르지 않습니다. 잠시 후 다시 시도하세요.",
      }),
    });
  });

  const response = await page.goto("/announcements");
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole("alert")).toContainText(
    "공고 API 응답이 올바르지 않습니다.",
  );
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(page.getByText("현재 등록된 공고가 없습니다.")).toHaveCount(0);
});
