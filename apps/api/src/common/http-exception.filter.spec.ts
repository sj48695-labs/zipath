import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { GlobalExceptionFilter } from "./http-exception.filter";
import type { ApiResponse } from "./interfaces/api-response.interface";

function createHost(): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

function lastBody(json: jest.Mock): ApiResponse {
  return json.mock.calls[0][0] as ApiResponse;
}

describe("GlobalExceptionFilter", () => {
  const filter = new GlobalExceptionFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation();
  });

  it("BadRequestException(배열 메시지) → 400 VALIDATION_ERROR", () => {
    const { host, status, json } = createHost();

    filter.catch(new BadRequestException({ message: ["a", "b"] }), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(lastBody(json)).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "a, b" },
    });
  });

  it("NotFoundException → 404 HTTP_404", () => {
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException("없음"), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(lastBody(json)).toEqual({
      success: false,
      error: { code: "HTTP_404", message: "없음" },
    });
  });

  it("QueryFailedError(23505) → 409 DUPLICATE_ENTRY", () => {
    const { host, status, json } = createHost();
    const err = new QueryFailedError(
      "q",
      [],
      Object.assign(new Error("x"), { code: "23505" }),
    );

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(lastBody(json).error?.code).toBe("DUPLICATE_ENTRY");
  });

  it("QueryFailedError(23503) → 400 FOREIGN_KEY_VIOLATION", () => {
    const { host, status, json } = createHost();
    const err = new QueryFailedError(
      "q",
      [],
      Object.assign(new Error("x"), { code: "23503" }),
    );

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(lastBody(json).error?.code).toBe("FOREIGN_KEY_VIOLATION");
  });

  it("QueryFailedError(기타 코드) → 500 DATABASE_ERROR", () => {
    const { host, status, json } = createHost();
    const err = new QueryFailedError(
      "q",
      [],
      Object.assign(new Error("x"), { code: "99999" }),
    );

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(lastBody(json).error?.code).toBe("DATABASE_ERROR");
  });

  it("일반 Error → 500 INTERNAL_ERROR", () => {
    const { host, status, json } = createHost();

    filter.catch(new Error("boom"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(lastBody(json).error?.code).toBe("INTERNAL_ERROR");
  });

  it("비-Error 값 → 500 UNKNOWN_ERROR", () => {
    const { host, status, json } = createHost();

    filter.catch("oops", host);

    expect(status).toHaveBeenCalledWith(500);
    expect(lastBody(json).error?.code).toBe("UNKNOWN_ERROR");
  });
});
