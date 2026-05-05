import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { OAuthLoginInput } from "@zipath/types";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private static readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get<string>("GOOGLE_CLIENT_ID") || "";
    const clientSecret = config.get<string>("GOOGLE_CLIENT_SECRET") || "";

    if (!clientID || !clientSecret) {
      // auth.module.ts에서 env 미설정 시 strategy 등록을 스킵하지만,
      // 직접 인스턴스화될 경우(예: 테스트, 향후 리팩토링)를 위한 이중 안전장치.
      GoogleStrategy.logger.warn(
        "GOOGLE_CLIENT_ID/SECRET 미설정 — Google OAuth가 실제로 동작하지 않습니다.",
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL: config.get<string>("GOOGLE_CALLBACK_URL") || "http://localhost:4000/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): void {
    const user: OAuthLoginInput = {
      provider: "google",
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      nickname: profile.displayName ?? null,
    };

    done(null, user);
  }
}
