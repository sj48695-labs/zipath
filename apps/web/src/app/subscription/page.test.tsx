import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/components/layout/SiteHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="site-header" />,
}));

import SubscriptionPage from "./page";

describe("SubscriptionPage", () => {
  it("renders the savings duration inputs and the legal disclaimer", () => {
    const html = renderToStaticMarkup(React.createElement(SubscriptionPage));

    expect(html).toContain("청약통장 가입기간 (년)");
    expect(html).toContain("청약통장 가입기간 (개월)");
    expect(html).toContain("실제 가입기간을 년/월로 입력하세요.");
    expect(html).toContain("기본 정보를 입력하면 청약 가능 여부와 입력 기준 가점을 확인할 수 있어요.");
    expect(html).not.toContain("예상 가점");
    expect(html).toContain("참고용이며 법적 효력 없음");
    expect(html).not.toContain("미입력 시 나이로 추정");
  });
});
