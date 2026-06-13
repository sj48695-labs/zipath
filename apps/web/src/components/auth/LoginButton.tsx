import Link from "next/link";

export function LoginButton() {
  return (
    <Link
      href="/login"
      className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      로그인하기
    </Link>
  );
}
