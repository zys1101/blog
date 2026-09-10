import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret: string = config.getOrThrow<string>("JWT_SECRET");
        if (secret.length < 32)
          throw new Error("JWT_SECRET 至少需要 32 个字符");
        return {
          secret,
          signOptions: {
            expiresIn: "7d",
            algorithm: "HS256",
            issuer: "devlog-api",
            audience: "devlog-admin",
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
