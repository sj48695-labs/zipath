import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { OAuthLoginInput } from "@zipath/types";
import { Strategy, Profile } from "passport-naver-v2";

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, "naver") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("NAVER_CLIENT_ID") || "",
      clientSecret: config.get<string>("NAVER_CLIENT_SECRET") || "",
      callbackURL: config.get<string>("NAVER_CALLBACK_URL") || "http://localhost:4000/auth/naver/callback",
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: OAuthLoginInput | false) => void,
  ): void {
    const user: OAuthLoginInput = {
      provider: "naver",
      providerId: profile.id,
      email: profile.email ?? null,
      nickname: profile.nickname ?? null,
    };

    done(null, user);
  }
}
