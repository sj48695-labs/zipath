import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LegalDisclaimer from "./LegalDisclaimer";

describe("LegalDisclaimer", () => {
  it("참고용 및 법적 효력 없음 고지를 렌더링한다", () => {
    const html = renderToStaticMarkup(React.createElement(LegalDisclaimer));

    expect(html).toContain("참고용이며 법적 효력 없음");
    expect(html).toContain("참고용이며 법적 효력이 없습니다");
    expect(html).toContain("청약홈 원문을 확인해주세요");
  });
});
