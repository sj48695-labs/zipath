import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<UserWithInterestRegions>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: OAuthProfile) {
    // 기존 유저 조회 (provider + providerId)
    let user = (await this.userRepo.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
    })) as UserWithInterestRegions | null;

    if (!user) {
      // 신규 유저 생성
      user = this.userRepo.create({
        email: profile.email,
        nickname: profile.nickname,
        provider: profile.provider,
        providerId: profile.providerId,
      });
      user = await this.userRepo.save(user);
    } else {
      // 기존 유저 정보 업데이트
      user.lastActiveAt = new Date();
      if (profile.email) user.email = profile.email;
      if (profile.nickname) user.nickname = profile.nickname;
      await this.userRepo.save(user);
    }

    return this.generateTokens(user);
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = (await this.userRepo.findOne({
      where: { id: payload.sub },
    })) as UserWithInterestRegions | null;

    if (!user) {
      throw new UnauthorizedException("유저를 찾을 수 없습니다.");
    }

    user.lastActiveAt = new Date();
    await this.userRepo.save(user);

    return user;
  }

  async getProfile(userId: number) {
    const user = (await this.userRepo.findOne({
      where: { id: userId },
    })) as UserWithInterestRegions | null;

    if (!user) {
      throw new UnauthorizedException("유저를 찾을 수 없습니다.");
    }

    return this.toProfile(user);
  }

  async updateInterestRegions(userId: number, regions: string[]) {
    const user = (await this.userRepo.findOne({
      where: { id: userId },
    })) as UserWithInterestRegions | null;

    if (!user) {
      throw new UnauthorizedException("유저를 찾을 수 없습니다.");
    }

    user.interestRegions = this.normalizeRegions(regions);
    await this.userRepo.save(user);

    return this.toProfile(user);
  }

  private normalizeRegions(regions: string[]): string[] {
    return [...new Set(regions.map((r) => r.trim()).filter((r) => r.length > 0))];
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

  private generateTokens(user: UserWithInterestRegions) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: "1h" }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "7d" }),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: toSsoProvider(user.provider),
      },
    };
  }
}

function toSsoProvider(provider: string | null): SsoProvider | null {
  switch (provider) {
    case "google":
    case "kakao":
    case "naver":
    case "apple":
      return provider;
    default:
      return null;
  }
}
