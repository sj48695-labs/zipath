import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
}

interface GoogleOAuthUser {
  provider: string;
  providerId: string;
  email: string | null;
  nickname: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID") || "",
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET") || "",
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
    const user: GoogleOAuthUser = {
      provider: "google",
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      nickname: profile.displayName ?? null,
    };

    done(null, user);
  }
}
