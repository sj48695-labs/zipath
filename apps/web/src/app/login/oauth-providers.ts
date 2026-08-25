export type OAuthProviderId = "google" | "kakao" | "naver" | "apple";

export interface OAuthProvider {
  id: OAuthProviderId;
  name: string;
  color: string;
  textColor: string;
  icon: string;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: "google", name: "Google", color: "bg-white border hover:bg-gray-50", textColor: "text-gray-700", icon: "G" },
  { id: "kakao", name: "카카오", color: "bg-[#FEE500] hover:bg-[#FDD800]", textColor: "text-[#191919]", icon: "K" },
  { id: "naver", name: "네이버", color: "bg-[#03C75A] hover:bg-[#02B350]", textColor: "text-white", icon: "N" },
  { id: "apple", name: "Apple", color: "bg-black hover:bg-gray-800", textColor: "text-white", icon: "" },
];

export function getOAuthLoginUrl(provider: OAuthProviderId, apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"): string {
  return `${apiUrl}/auth/${provider}`;
}
