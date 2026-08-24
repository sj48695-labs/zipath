import { ApiError } from "@/lib/api";

export type RealPriceErrorKind = "timeout" | "network" | "http" | "unknown";

export interface RealPriceErrorViewModel {
  kind: RealPriceErrorKind;
  title: string;
  message: string;
  note: string;
}

function getProxyErrorMessage(error: unknown): string | null {
  if (error === null || typeof error !== "object") return null;
  const message = (error as Record<string, unknown>).error;
  return typeof message === "string" ? message : null;
}

export function getRealPriceErrorViewModel(
  error: unknown,
): RealPriceErrorViewModel {
  if (error instanceof ApiError) {
    if (error.kind === "timeout") {
      return {
        kind: "timeout",
        title: "서버 준비 중이에요",
        message: "Render 서버가 준비되는 동안 응답이 늦어지고 있어요.",
        note: "잠시 후 다시 시도해주세요.",
      };
    }

    if (error.kind === "network") {
      return {
        kind: "network",
        title: "네트워크 연결이 불안정해요",
        message: "인터넷 연결 문제로 실거래가 정보를 불러오지 못했어요.",
        note: "Wi-Fi 또는 모바일 데이터를 확인한 뒤 다시 시도해주세요.",
      };
    }

    return {
      kind: "http",
      title: "실거래가 조회에 실패했어요",
      message: error.message,
      note: "서버가 오류를 응답했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  const proxyErrorMessage = getProxyErrorMessage(error);
  if (proxyErrorMessage) {
    return {
      kind: "http",
      title: "실거래가 조회에 실패했어요",
      message: proxyErrorMessage,
      note: "서버가 오류를 응답했어요. 잠시 후 다시 시도해주세요.",
    };
  }

  return {
    kind: "unknown",
    title: "실거래가 정보를 불러올 수 없어요",
    message: "잠시 후 다시 시도해주세요.",
    note: "응답을 받지 못했습니다.",
  };
}
