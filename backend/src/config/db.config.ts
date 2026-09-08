import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function databaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const port: number = Number(config.get<string>("DB_PORT", "3306"));
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("DB_PORT 必须是有效端口");
  const synchronize: boolean =
    config.get<string>("DB_SYNC", "false") === "true";
  if (config.get<string>("NODE_ENV") === "production" && synchronize) {
    throw new Error(
      "生产环境禁止 DB_SYNC=true，请按部署文档初始化或变更表结构",
    );
  }
  return {
    type: "mysql",
    host: config.getOrThrow<string>("DB_HOST"),
    port,
    username: config.getOrThrow<string>("DB_USER"),
    password: config.getOrThrow<string>("DB_PASSWORD"),
    database: config.getOrThrow<string>("DB_NAME"),
    charset: "utf8mb4",
    timezone: "Z",
    autoLoadEntities: true,
    synchronize,
    logging: false,
    retryAttempts: 3,
    retryDelay: 1000,
  };
}
