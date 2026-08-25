import { getOAuthLoginUrl, OAUTH_PROVIDERS } from "./oauth-providers";

describe("OAuth providers", () => {
  it("Apple을 포함한 OAuth 공급자를 노출한다", () => {
    expect(OAUTH_PROVIDERS.map((provider) => provider.id)).toEqual(["google", "kakao", "naver", "apple"]);
  });

  it.each(["google", "kakao", "naver", "apple"] as const)("%s 시작 URL은 기존 API 계약을 사용한다", (provider) => {
    expect(getOAuthLoginUrl(provider)).toBe(`http://localhost:4000/api/auth/${provider}`);
  });

  it("API URL override를 유지한다", () => {
    expect(getOAuthLoginUrl("apple", "https://api.zipath.example/api")).toBe("https://api.zipath.example/api/auth/apple");
  });
});
