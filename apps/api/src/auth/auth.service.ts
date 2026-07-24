import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomUUID } from "crypto";
import { Repository } from "typeorm";
import { User } from "@zipath/db";
import type { SsoProvider, UserProfile } from "@zipath/types";

type UserWithInterestRegions = User & {
  interestRegions: string[];
};

interface OAuthProfile {
  provider: SsoProvider;
  providerId: string;
  email: string | null;
  nickname: string | null;
}

interface JwtPayload {
  sub: number;
  email: string | null;
}

interface RefreshJwtPayload extends JwtPayload {
  jti: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string | null;
    nickname: string | null;
    provider: SsoProvider | null;
  };
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<UserWithInterestRegions>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: OAuthProfile): Promise<AuthResponse> {
    let user = (await this.userRepo.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
    })) as UserWithInterestRegions | null;
    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        nickname: profile.nickname,
        provider: profile.provider,
        providerId: profile.providerId,
      });
      user.lastActiveAt = new Date();
      user = await this.userRepo.save(user);
    } else {
      user.lastActiveAt = new Date();
      if (profile.email) user.email = profile.email;
      if (profile.nickname) user.nickname = profile.nickname;
    }

    const tokens = this.generateTokens(user);
    this.persistRefreshToken(user, tokens.refreshToken);
    await this.userRepo.save(user);

    return this.toAuthResponse(user, tokens);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.findUserByIdOrThrow(payload.sub);
    const refreshTokenState = this.getRefreshTokenState(user, refreshToken);

    if (refreshTokenState === "invalid") {
      throw new UnauthorizedException("유효하지 않은 refresh token입니다.");
    }

    if (refreshTokenState === "reused") {
      await this.invalidateRefreshTokenSession(user);
      throw new UnauthorizedException("유효하지 않은 refresh token입니다.");
    }

    user.lastActiveAt = new Date();
    const tokens = this.generateTokens(user);
    this.persistRefreshToken(user, tokens.refreshToken);
    await this.userRepo.save(user);

    return this.toAuthResponse(user, tokens);
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = await this.findUserByIdOrThrow(payload.sub);

    user.lastActiveAt = new Date();
    await this.userRepo.save(user);

    return user;
  }

  async getProfile(userId: number) {
    const user = await this.findUserByIdOrThrow(userId);

    return this.toProfile(user);
  }

  async updateInterestRegions(userId: number, regions: string[]) {
    const user = await this.findUserByIdOrThrow(userId);

    user.interestRegions = this.normalizeRegions(regions);
    await this.userRepo.save(user);

    return this.toProfile(user);
  }

  private normalizeRegions(regions: string[]): string[] {
    return [...new Set(regions.map((r) => r.trim()).filter((r) => r.length > 0))];
  }

  private async findUserByIdOrThrow(userId: number): Promise<UserWithInterestRegions> {
    const user = (await this.userRepo.findOne({
      where: { id: userId },
    })) as UserWithInterestRegions | null;

    if (!user) {
      throw new UnauthorizedException("유저를 찾을 수 없습니다.");
    }

    return user;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshJwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException("유효하지 않은 refresh token입니다.");
    }
  }

  private getRefreshTokenState(
    user: UserWithInterestRegions,
    refreshToken: string,
  ): "valid" | "invalid" | "reused" {
    if (
      !user.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenInvalidatedAt
    ) {
      return "invalid";
    }

    if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
      return "invalid";
    }

    if (this.hashRefreshToken(refreshToken) !== user.refreshTokenHash) {
      return "reused";
    }

    return "valid";
  }

  private persistRefreshToken(
    user: UserWithInterestRegions,
    refreshToken: string,
  ): void {
    user.refreshTokenHash = this.hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    user.refreshTokenInvalidatedAt = null;
  }

  private async invalidateRefreshTokenSession(
    user: UserWithInterestRegions,
  ): Promise<void> {
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    user.refreshTokenInvalidatedAt = new Date();
    await this.userRepo.save(user);
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private toProfile(user: UserWithInterestRegions): UserProfile {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      provider: toSsoProvider(user.provider),
      interestRegions: user.interestRegions ?? [],
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt.toISOString(),
    };
  }

  private toAuthResponse(user: UserWithInterestRegions, tokens: TokenPair): AuthResponse {
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: toSsoProvider(user.provider),
      },
    };
  }

  private generateTokens(user: UserWithInterestRegions): TokenPair {
    const accessTokenPayload: JwtPayload = { sub: user.id, email: user.email };
    const refreshTokenPayload: RefreshJwtPayload = {
      sub: user.id,
      email: user.email,
      jti: randomUUID(),
    };

    return {
      accessToken: this.jwtService.sign(accessTokenPayload, { expiresIn: "1h" }),
      refreshToken: this.jwtService.sign(refreshTokenPayload, {
        expiresIn: "7d",
      }),
    };
  }
}

function toSsoProvider(provider: string | null): SsoProvider | null {
  switch (provider) {
    case "google":
    case "kakao":
    case "naver":
      return provider;
    default:
      return null;
  }
}
