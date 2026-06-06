import { SUPPORTED_REGION_LABEL } from "../_lib/regions";

interface SupportedRegionNoticeProps {
  variant?: "banner" | "inline";
  className?: string;
}

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
