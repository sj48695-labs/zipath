import { SUPPORTED_REGION_LABEL } from "../_lib/regions";

interface SupportedRegionNoticeProps {
  variant?: "banner" | "inline";
  className?: string;
}

export default function SupportedRegionNotice({
  variant = "banner",
  className = "",
}: SupportedRegionNoticeProps) {
  const title =
    variant === "inline"
      ? `현재 지원 범위: ${SUPPORTED_REGION_LABEL}`
      : `실거래가 조회는 현재 ${SUPPORTED_REGION_LABEL}만 지원합니다.`;
  const body =
    variant === "inline"
      ? "아래 목록에서만 선택할 수 있으며, 그 외 지역은 추후 확대 예정입니다."
      : "지원 지역은 서울·경기·인천·부산의 일부 지역으로 제한됩니다. 그 외 지역은 추후 확대 예정입니다.";

  return (
    <div
      className={`rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 ${className}`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-yellow-700">
        {body}
      </p>
    </div>
  );
}
