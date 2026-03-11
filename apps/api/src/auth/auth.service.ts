import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@zipath/db";

interface OAuthProfile {
  provider: string;
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
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: OAuthProfile) {
    // 기존 유저 조회 (provider + providerId)
    let user = await this.userRepo.findOne({
      where: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
    });

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
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("유저를 찾을 수 없습니다.");
    }

    user.lastActiveAt = new Date();
    await this.userRepo.save(user);

    return user;
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("유저를 찾을 수 없습니다.");
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      provider: user.provider,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: "1h" }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "7d" }),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
      },
    };
  }
}
