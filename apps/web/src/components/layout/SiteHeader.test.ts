import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SiteHeader from "./SiteHeader";

jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
    }) => (
      React.createElement("a", { href, ...rest }, children)
    ),
  };
});

jest.mock("@/app/_components/NotificationBell", () => ({
  __esModule: true,
  default: () => null,
}));

describe("SiteHeader", () => {
  it("글로벌 내비게이션과 법적 고지를 함께 렌더링한다", () => {
    const html = renderToStaticMarkup(React.createElement(SiteHeader));

    expect(html).toContain('href="/"');
    expect(html).toContain("Zipath");
    expect(html).toContain('href="/subscription"');
    expect(html).toContain('href="/loan"');
    expect(html).toContain('href="/checklist"');
    expect(html).toContain('href="/real-price"');
    expect(html).toContain("참고용이며 법적 효력 없음");
    expect(html).toContain("실제 계약, 청약, 대출 판단 전에는 반드시 공식 문서와 담당 기관 안내를 확인하세요.");
  });
});
