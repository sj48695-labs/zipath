"use client";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  // AdSense 승인 전까지 플레이스홀더 표시
  return (
    <div className={`flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 ${className}`}>
      <div className="py-4 text-center">
        <p className="text-xs text-gray-400">광고 영역</p>
        <p className="text-[10px] text-gray-300">
          {format === "horizontal" ? "728x90" : format === "vertical" ? "160x600" : "336x280"}
        </p>
      </div>
      {/* AdSense 승인 후 아래 주석 해제
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      */}
    </div>
  );
}
