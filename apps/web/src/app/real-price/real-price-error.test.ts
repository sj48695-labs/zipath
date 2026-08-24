import { ApiError } from "@/lib/api";
import { getRealPriceErrorViewModel } from "./real-price-error";

describe("getRealPriceErrorViewModel", () => {
  it("timeout error 를 Render 준비 및 재시도 안내로 바꾼다", () => {
    const viewModel = getRealPriceErrorViewModel(
      new ApiError("요청 시간이 초과되었습니다.", 408, "timeout"),
    );

    expect(viewModel.kind).toBe("timeout");
    expect(viewModel.title).toContain("서버 준비 중");
    expect(viewModel.message).toContain("Render");
    expect(viewModel.note).toContain("다시 시도");
  });

  it("network error 를 연결 안내로 바꾼다", () => {
    const viewModel = getRealPriceErrorViewModel(
      new ApiError("네트워크 오류", 0, "network"),
    );

    expect(viewModel.kind).toBe("network");
    expect(viewModel.title).toContain("네트워크 연결");
    expect(viewModel.note).toContain("Wi-Fi");
  });

  it("http error 는 서버 메시지를 유지한다", () => {
    const viewModel = getRealPriceErrorViewModel(
      new ApiError("실거래가 서버 오류", 500, "http"),
    );

    expect(viewModel.kind).toBe("http");
    expect(viewModel.message).toBe("실거래가 서버 오류");
  });

  it("proxy { error: string } 응답의 메시지를 유지한다", () => {
    const viewModel = getRealPriceErrorViewModel({
      error: "공공 API 응답을 불러오지 못했습니다.",
    });

    expect(viewModel.kind).toBe("http");
    expect(viewModel.message).toBe("공공 API 응답을 불러오지 못했습니다.");
  });
});
