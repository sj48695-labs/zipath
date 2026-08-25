import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@zipath/db";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./google.strategy";
import { AppleStrategy } from "./apple.strategy";
import { KakaoStrategy } from "./kakao.strategy";
import { NaverStrategy } from "./naver.strategy";
import { JwtStrategy } from "./jwt.strategy";

const logger = new Logger("AuthModule");

type OAuthStrategyClass = new (config: ConfigService) => unknown;

function conditionalOAuthProvider(
  Strategy: OAuthStrategyClass,
  envKey: string,
  name: string,
) {
  return {
    provide: Strategy,
    useFactory: (config: ConfigService) => {
      if (!config.get(envKey)) {
        logger.warn(`${envKey} not set — ${name} OAuth disabled`);
        return null;
      }
      return new Strategy(config);
    },
    inject: [ConfigService],
  };
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    conditionalOAuthProvider(GoogleStrategy, "GOOGLE_CLIENT_ID", "Google"),
    conditionalOAuthProvider(AppleStrategy, "APPLE_CLIENT_ID", "Apple"),
    conditionalOAuthProvider(KakaoStrategy, "KAKAO_CLIENT_ID", "Kakao"),
    conditionalOAuthProvider(NaverStrategy, "NAVER_CLIENT_ID", "Naver"),
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
