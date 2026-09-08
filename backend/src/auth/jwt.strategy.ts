import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AdminIdentity } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
      algorithms: ["HS256"],
      issuer: "devlog-api",
      audience: "devlog-admin",
    });
  }

  validate(payload: unknown): AdminIdentity {
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sub" in payload) ||
      payload.sub !== "admin" ||
      !("username" in payload) ||
      payload.username !== this.config.getOrThrow<string>("ADMIN_USERNAME")
    ) {
      throw new UnauthorizedException("登录状态无效，请重新登录");
    }
    return {
      sub: "admin",
      username: this.config.getOrThrow<string>("ADMIN_USERNAME"),
    };
  }
}
