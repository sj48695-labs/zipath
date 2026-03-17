import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { GoogleAuthGuard } from "./google-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Public } from "./public.decorator";

interface GoogleOAuthUser {
  provider: string;
  providerId: string;
  email: string | null;
  nickname: string | null;
}

const oauthLoginSchema = z.object({
  provider: z.enum(["google", "kakao", "naver"]),
  providerId: z.string().min(1),
  email: z.string().email().nullable(),
  nickname: z.string().nullable(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /** Google OAuth 로그인 시작 */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get("google")
  googleLogin(): void {
    // GoogleAuthGuard가 Google OAuth 페이지로 리다이렉트
  }

  /** Google OAuth 콜백 */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get("google/callback")
  async googleCallback(
    @Request() req: { user: GoogleOAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const tokens = await this.authService.validateOAuthLogin(req.user);
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    // 프론트엔드로 토큰을 쿼리 파라미터로 전달
    const redirectUrl = new URL("/auth/callback", frontendUrl);
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);

    res.redirect(redirectUrl.toString());
  }

  /** OAuth 콜백에서 받은 프로필로 로그인/회원가입 */
  @Public()
  @Post("login")
  async login(@Body() body: unknown) {
    const parsed = oauthLoginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    return this.authService.validateOAuthLogin(parsed.data);
  }

  /** 토큰 갱신 */
  @Public()
  @Post("refresh")
  async refresh(@Body() body: unknown) {
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("refreshToken이 필요합니다.");
    }
    // refresh 토큰 검증은 서비스에서 처리
    return { message: "TODO: refresh token rotation" };
  }

  /** 내 프로필 */
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req: { user: { id: number } }) {
    return this.authService.getProfile(req.user.id);
  }
}
