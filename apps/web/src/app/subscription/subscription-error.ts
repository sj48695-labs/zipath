import { ApiError } from "@/lib/api";

export type SubscriptionErrorKind = "timeout" | "network" | "http" | "unknown";

export interface SubscriptionErrorViewModel {
  kind: SubscriptionErrorKind;
  title: string;
  message: string;
  note: string;
}

export function getSubscriptionErrorViewModel(error: unknown): SubscriptionErrorViewModel {
  if (error instanceof ApiError) {
    if (error.kind === "timeout") {
      return {
        kind: "timeout",
        title: "서버 준비 중이에요",
        message: "Render 콜드 스타트로 응답이 늦어지고 있어요.",
        note: "잠시 후 다시 시도하면 더 잘 연결될 수 있어요.",
      };
    }

    if (error.kind === "network") {
      return {
        kind: "network",
        title: "네트워크 연결이 불안정해요",
        message: "인터넷 연결이 끊기거나 너무 불안정해서 요청을 완료하지 못했어요.",
        note: "Wi-Fi 또는 모바일 데이터를 확인한 뒤 다시 시도해주세요.",
      };
    }

    return {
      kind: "http",
      title: "청약 자격 확인에 실패했어요",
      message: error.message,
      note: "백엔드가 오류를 응답했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  return {
    kind: "unknown",
    title: "서버에 연결할 수 없어요",
    message: "잠시 후 다시 시도해주세요.",
    note: "응답을 받지 못했습니다.",
  };
}
