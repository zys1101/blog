import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ApiResponse } from "../interceptors/transform.interceptor";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter<unknown> {
  private readonly logger: Logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response: Response = host.switchToHttp().getResponse<Response>();
    const status: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = "服务器暂时不可用，请稍后重试";
    if (exception instanceof HttpException && status < 500) {
      const detail: string | object = exception.getResponse();
      if (typeof detail === "string") message = detail;
      else if ("message" in detail) {
        const value: unknown = detail.message;
        if (typeof value === "string") message = value;
        else if (Array.isArray(value))
          message = value
            .filter((item: unknown): item is string => typeof item === "string")
            .join("；");
      }
    }
    // 不向客户端暴露 SQL、环境变量或堆栈，也不记录请求中的密码/token。
    if (status >= 500)
      this.logger.error(
        exception instanceof Error ? exception.name : "Unknown server error",
      );
    const body: ApiResponse<null> = { code: status, message, data: null };
    response.status(status).json(body);
  }
}
