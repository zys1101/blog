import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";

export interface LoginResult {
  token: string;
  expiresIn: number;
}
export interface AdminIdentity {
  sub: "admin";
  username: string;
}

@Injectable()
export class AuthService {
  private readonly username: string;
  private readonly passwordHash: string;

  constructor(
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    this.username = config.getOrThrow<string>("ADMIN_USERNAME");
    this.passwordHash = config.getOrThrow<string>("ADMIN_PASSWORD_HASH");
    if (!this.username.trim() || this.username.length > 64)
      throw new Error("ADMIN_USERNAME 长度必须为 1–64");
    if (!/^\$2[ab]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.passwordHash))
      throw new Error("ADMIN_PASSWORD_HASH 必须是 bcrypt 哈希");
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    // bcrypt 仅使用前 72 字节，显式拒绝超出限制的输入。
    if (Buffer.byteLength(dto.password, "utf8") > 72)
      throw new UnauthorizedException("用户名或密码错误");
    const passwordMatches: boolean = await bcrypt.compare(
      dto.password,
      this.passwordHash,
    );
    if (dto.username !== this.username || !passwordMatches)
      throw new UnauthorizedException("用户名或密码错误");
    const payload: AdminIdentity = { sub: "admin", username: this.username };
    return { token: await this.jwtService.signAsync(payload), expiresIn: 7200 };
  }
}
