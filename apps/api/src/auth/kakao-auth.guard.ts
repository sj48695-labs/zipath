import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class KakaoAuthGuard extends AuthGuard("kakao") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
