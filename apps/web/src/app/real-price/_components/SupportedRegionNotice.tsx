import { SUPPORTED_REGION_LABEL } from "../_lib/regions";

interface SupportedRegionNoticeProps {
  /**
   * banner: 패널 상단 상시 안내 (지원 범위 명시)
   * inline: 미지원 지역 검색 시 노출되는 인라인 경고
   */
  variant?: "banner" | "inline";
  className?: string;
}

/**
 * 실거래가 조회 지원 지역(수도권·부산) 안내.
 * 검색 결과 없음(회색 톤)과 구분되도록 amber 계열 스타일을 사용한다.
 */
export default function SupportedRegionNotice({
  variant = "banner",
  className = "",
}: SupportedRegionNoticeProps) {
  const message =
    variant === "inline"
      ? `현재 실거래가 조회는 ${SUPPORTED_REGION_LABEL}만 지원합니다. 그 외 지역은 추후 확대 예정이에요.`
      : `실거래가 조회는 현재 ${SUPPORTED_REGION_LABEL} 지역만 지원합니다. 그 외 지역은 추후 확대 예정이에요.`;

  return (
    <div
      role="status"
      className={`rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 ${className}`}
    >
      {message}
    </div>
  );
}
