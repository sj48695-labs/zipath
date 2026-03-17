import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import type { ApiResponse } from "./interfaces/api-response.interface";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.buildResponse(exception);

    response.status(status).json(body);
  }

  private buildResponse(exception: unknown): {
    status: number;
    body: ApiResponse;
  } {
    if (exception instanceof BadRequestException) {
      return this.handleValidationError(exception);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    if (exception instanceof QueryFailedError) {
      return this.handleQueryFailedError(exception);
    }

    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "서버 오류가 발생했습니다.",
          },
        },
      };
    }

    this.logger.error(`Unknown error: ${String(exception)}`);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "알 수 없는 오류가 발생했습니다.",
        },
      },
    };
  }

  private handleValidationError(exception: BadRequestException): {
    status: number;
    body: ApiResponse;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      const msg = resp.message;
      message = Array.isArray(msg) ? (msg as string[]).join(", ") : String(msg);
    } else {
      message = String(exceptionResponse);
    }

    return {
      status,
      body: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message,
        },
      },
    };
  }

  private handleHttpException(exception: HttpException): {
    status: number;
    body: ApiResponse;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    if (typeof exceptionResponse === "string") {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null
    ) {
      const resp = exceptionResponse as Record<string, unknown>;
      const msg = resp.message;
      message = Array.isArray(msg)
        ? (msg as string[]).join(", ")
        : typeof msg === "string"
          ? msg
          : exception.message;
    } else {
      message = exception.message;
    }

    return {
      status,
      body: {
        success: false,
        error: {
          code: `HTTP_${status}`,
          message,
        },
      },
    };
  }

  private handleQueryFailedError(exception: QueryFailedError): {
    status: number;
    body: ApiResponse;
  } {
    this.logger.error(
      `Database query failed: ${exception.message}`,
      exception.stack,
    );

    const driverError = exception.driverError as Record<string, unknown> | undefined;
    const pgCode = driverError?.code as string | undefined;

    // PostgreSQL unique violation
    if (pgCode === "23505") {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          success: false,
          error: {
            code: "DUPLICATE_ENTRY",
            message: "이미 존재하는 데이터입니다.",
          },
        },
      };
    }

    // PostgreSQL foreign key violation
    if (pgCode === "23503") {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          success: false,
          error: {
            code: "FOREIGN_KEY_VIOLATION",
            message: "참조하는 데이터가 존재하지 않습니다.",
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "데이터베이스 오류가 발생했습니다.",
        },
      },
    };
  }
}
