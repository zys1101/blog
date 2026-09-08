import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap(): Promise<void> {
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = Number(config.get<string>("PORT", "3000"));
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT 必须是有效端口");

  app.disable("x-powered-by");
  // 允许 DTO 中 100,000 字正文（包括中文与 JSON 转义），同时限制请求体大小。
  app.useBodyParser("json", { limit: "1mb" });
  app.setGlobalPrefix("api");
  // 前端生产环境通过同源 /api 访问；跨域仅允许显式列出的地址。
  const origins: string[] = config
    .get<string>("CORS_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((value: string): string => value.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(port, "0.0.0.0");
  Logger.log(`API listening on port ${port}, prefix /api`, "Bootstrap");
}

void bootstrap().catch((error: unknown): void => {
  Logger.error(
    error instanceof Error ? error.message : "启动失败",
    undefined,
    "Bootstrap",
  );
  process.exitCode = 1;
});
