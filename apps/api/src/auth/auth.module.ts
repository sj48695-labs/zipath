import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@zipath/db";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./google.strategy";
import { KakaoStrategy } from "./kakao.strategy";
import { NaverStrategy } from "./naver.strategy";
import { JwtStrategy } from "./jwt.strategy";

const logger = new Logger("AuthModule");

const oauthProviders = [
  { strategy: GoogleStrategy, envKey: "GOOGLE_CLIENT_ID", name: "Google" },
  { strategy: KakaoStrategy, envKey: "KAKAO_CLIENT_ID", name: "Kakao" },
  { strategy: NaverStrategy, envKey: "NAVER_CLIENT_ID", name: "Naver" },
].flatMap(({ strategy, envKey, name }) => {
  if (!process.env[envKey]) {
    logger.warn(`${envKey} not set — ${name} OAuth disabled`);
    return [];
  }
  return [strategy];
});

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") || "zipath-dev-secret",
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...oauthProviders],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
