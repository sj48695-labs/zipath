/**
 * 쿠팡 파트너스 필수 고지 문구.
 * 이 문구를 누락하면 계정이 정지될 수 있으니 파트너스 링크/배너가 있는 페이지에 반드시 노출하세요.
 */
export default function CoupangDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-muted-foreground ${className}`}>
      이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
    </p>
  );
}
