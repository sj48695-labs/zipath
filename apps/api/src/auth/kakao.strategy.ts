import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-kakao";

interface KakaoAccount {
  email?: string;
  is_email_valid?: boolean;
  is_email_verified?: boolean;
}

interface KakaoProfileJson {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: KakaoAccount;
}

interface KakaoProfile {
  id: string;
  username: string;
  displayName: string;
  _json: KakaoProfileJson;
}

interface KakaoOAuthUser {
  provider: string;
  providerId: string;
  email: string | null;
  nickname: string | null;
}

type DoneCallback = (error: Error | null, user?: KakaoOAuthUser) => void;

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, "kakao") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("KAKAO_CLIENT_ID") || "",
      clientSecret: config.get<string>("KAKAO_CLIENT_SECRET") || "",
      callbackURL: config.get<string>("KAKAO_CALLBACK_URL") || "http://localhost:4000/auth/kakao/callback",
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: KakaoProfile,
    done: DoneCallback,
  ): void {
    const user: KakaoOAuthUser = {
      provider: "kakao",
      providerId: String(profile.id),
      email: profile._json.kakao_account?.email ?? null,
      nickname: profile.displayName ?? profile.username ?? null,
    };

    done(null, user);
  }
}
