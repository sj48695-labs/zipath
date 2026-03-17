import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Public } from "./public.decorator";

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
  constructor(private readonly authService: AuthService) {}

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
