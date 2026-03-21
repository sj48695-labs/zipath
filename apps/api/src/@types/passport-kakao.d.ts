// passport-kakao has no official @types package.
// Minimal type declaration to satisfy TypeScript compiler.
declare module 'passport-kakao' {
  import { Strategy as PassportStrategy } from 'passport';

  interface Profile {
    id: string;
    displayName: string;
    username?: string;
    _json: {
      kakao_account?: {
        email?: string;
        profile?: {
          nickname?: string;
          profile_image_url?: string;
        };
      };
    };
  }

  interface StrategyOptions {
    clientID: string;
    clientSecret?: string;
    callbackURL: string;
  }

  type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ) => void;

  class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyCallback);
    name: string;
  }
}
