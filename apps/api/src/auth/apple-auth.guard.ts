import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";

interface AppleOAuthRequest extends Request {
  appleState?: string;
  appleNonce?: string;
  appleAuthError?: string;
}

interface AppleStatePayload {
  state: string;
  nonce: string;
  expiresAt: number;
}

const APPLE_STATE_COOKIE = "zipath_apple_oauth";
const STATE_TTL_MS = 10 * 60 * 1000;

function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeState(payload: AppleStatePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

function decodeState(value: string | undefined, secret: string): AppleStatePayload | null {
  if (!value) return null;
  try {
    const [encoded, signature] = value.split(".");
    if (!encoded || !signature) return null;
    const expectedSignature = sign(encoded, secret);
    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }
    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<AppleStatePayload>;
    return typeof candidate.state === "string" && typeof candidate.nonce === "string" && typeof candidate.expiresAt === "number" ? candidate as AppleStatePayload : null;
  } catch {
    return null;
  }
}

@Injectable()
export class AppleAuthGuard extends AuthGuard("apple") {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AppleOAuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const stateSecret = this.configService.get<string>("JWT_SECRET") || "zipath-dev-secret";

    if (request.method === "GET") {
      const state = randomBytes(32).toString("base64url");
      const nonce = randomBytes(32).toString("base64url");
      response.cookie(APPLE_STATE_COOKIE, encodeState({ state, nonce, expiresAt: Date.now() + STATE_TTL_MS }, stateSecret), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: STATE_TTL_MS,
        path: "/api/auth/apple",
      });
      request.appleState = state;
      request.appleNonce = nonce;
      return super.canActivate(context);
    }

    const expected = decodeState(readCookie(request, APPLE_STATE_COOKIE), stateSecret);
    response.clearCookie(APPLE_STATE_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/api/auth/apple" });
    const receivedState = typeof request.body?.state === "string" ? request.body.state : undefined;
    if (!expected || expected.expiresAt < Date.now() || !receivedState || receivedState !== expected.state) {
      throw new UnauthorizedException("Apple OAuth state가 유효하지 않습니다.");
    }
    request.appleNonce = expected.nonce;
    if (typeof request.body?.error === "string") {
      request.appleAuthError = request.body.error;
      return true;
    }
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AppleOAuthRequest>();
    return {
      state: request.appleState,
      nonce: request.appleNonce,
    };
  }
}
