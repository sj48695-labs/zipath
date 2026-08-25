import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { OAuthLoginInput } from "@zipath/types";
import { createRemoteJWKSet, jwtVerify } from "jose";
import AppleStrategyBase = require("passport-apple");
import type { Request } from "express";

interface AppleProfile {
  id?: string;
  email?: string;
  name?: { firstName?: string; lastName?: string };
}

interface AppleRequest extends Request { appleNonce?: string; appleProfile?: AppleProfile; }
const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

@Injectable()
export class AppleStrategy extends PassportStrategy(AppleStrategyBase, "apple") {
  private static readonly logger = new Logger(AppleStrategy.name);

  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>("APPLE_CLIENT_ID") || "";
    const teamID = config.get<string>("APPLE_TEAM_ID") || "";
    const keyID = config.get<string>("APPLE_KEY_ID") || "";
    const privateKey = (config.get<string>("APPLE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
    if (!clientID || !teamID || !keyID || !privateKey) AppleStrategy.logger.warn("APPLE credential 미설정 — Apple OAuth가 실제로 동작하지 않습니다.");
    super({ clientID, teamID, keyID, privateKeyString: privateKey, callbackURL: config.get<string>("APPLE_CALLBACK_URL"), scope: ["name", "email"], passReqToCallback: true });
  }

  async validate(
    request: AppleRequest,
    _accessToken: string,
    _refreshToken: string,
    idToken: string,
    profile: AppleProfile,
  ): Promise<OAuthLoginInput> {
    const clientID = this.config.get<string>("APPLE_CLIENT_ID") || "";
    const verified = await jwtVerify(idToken, appleKeys, { issuer: "https://appleid.apple.com", audience: clientID });
    if (typeof verified.payload.sub !== "string" || verified.payload.nonce !== request.appleNonce) {
      throw new Error("Apple ID token 검증에 실패했습니다.");
    }
    const supplied = request.appleProfile ?? profile;
    const name = supplied.name ? [supplied.name.firstName, supplied.name.lastName].filter((item): item is string => Boolean(item)).join(" ") : "";
    return { provider: "apple", providerId: verified.payload.sub, email: typeof verified.payload.email === "string" ? verified.payload.email : supplied.email ?? null, nickname: name || null };
  }
}
