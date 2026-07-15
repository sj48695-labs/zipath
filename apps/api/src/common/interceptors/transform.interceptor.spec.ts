import { ExecutionContext, CallHandler } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { TransformInterceptor } from "./transform.interceptor";

describe("TransformInterceptor", () => {
  it("성공 응답을 {success:true, data} 로 래핑한다", async () => {
    const interceptor = new TransformInterceptor<{ value: number }>();
    const ctx = {} as ExecutionContext;
    const next: CallHandler = { handle: () => of({ value: 1 }) };

    const result = await lastValueFrom(interceptor.intercept(ctx, next));

    expect(result).toEqual({ success: true, data: { value: 1 } });
  });
});
