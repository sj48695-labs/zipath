import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChartLoadingState from "./ChartLoadingState";

describe("ChartLoadingState", () => {
  it("renders a fixed-size loading shell", () => {
    const html = renderToStaticMarkup(React.createElement(ChartLoadingState));

    expect(html).toContain("차트를 불러오는 중입니다.");
    expect(html).toContain("min-h-[350px]");
    expect(html).toContain("justify-center");
  });
});
