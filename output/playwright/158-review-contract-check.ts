// 운영 테스트의 시간 계약을 모의 페이지로 검사한다. 실행 방법은 docs/verification/158-real-price.md의 두 번째 코드 리뷰 절을 따른다.
import { test } from "@playwright/test";
import "./real-price-production.spec";

test.beforeEach(async ({ page }) => {
  await page.route("**/real-price", (route) => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: `<main><h1>실거래가 조회</h1><p>참고용이며 법적 효력 없음</p>
      <div><label>지역</label><select><option value="11680">서울 강남구</option></select></div>
      <label>계약월</label><select><option value="202611">2026년 11월</option></select>
      <button id="search" onclick="run()">조회</button>
      <script>
        async function run() {
          document.querySelector('[role="alert"]')?.remove();
          const button = document.querySelector('#search');
          button.disabled = true;
          button.textContent = '조회 중...';
          const response = await fetch('/api/real-price?LAWD_CD=11680&DEAL_YMD=202611&numOfRows=50');
          button.disabled = false;
          button.textContent = '조회';
          document.querySelector('main').insertAdjacentHTML('beforeend', response.ok
            ? '<div>검색 결과가 없습니다</div>'
            : '<div role="alert">실거래가 조회에 실패했어요<button onclick="run()">다시 시도</button></div>');
        }
      </script></main>`,
  }));
  let attempts = 0;
  await page.route("**/api/real-price?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.REVIEW_RESPONSE_DELAY_MS ?? 47_000)));
    await route.fulfill({ status: process.env.REVIEW_FIRST_ERROR && attempts++ === 0 ? 500 : 200, json: { trades: [] } });
  });
});
