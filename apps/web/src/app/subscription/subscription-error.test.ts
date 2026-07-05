import { ApiError } from "@/lib/api";
import { getSubscriptionErrorViewModel } from "./subscription-error";

describe("getSubscriptionErrorViewModel", () => {
  it("timeout error 를 Render 콜드 스타트 메시지로 바꾼다", () => {
    const viewModel = getSubscriptionErrorViewModel(
      new ApiError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.", 408, "timeout"),
    );

    expect(viewModel.kind).toBe("timeout");
    expect(viewModel.title).toContain("서버 준비 중");
    expect(viewModel.message).toContain("콜드 스타트");
  });

  it("network error 를 연결 불안정 메시지로 바꾼다", () => {
    const viewModel = getSubscriptionErrorViewModel(
      new ApiError("네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.", 0, "network"),
    );

    expect(viewModel.kind).toBe("network");
    expect(viewModel.title).toContain("네트워크 연결");
    expect(viewModel.note).toContain("Wi-Fi");
  });

  it("http error 는 backend message 를 유지한다", () => {
    const viewModel = getSubscriptionErrorViewModel(
      new ApiError("백엔드 오류", 500, "http"),
    );

    expect(viewModel.kind).toBe("http");
    expect(viewModel.message).toBe("백엔드 오류");
  });
});
