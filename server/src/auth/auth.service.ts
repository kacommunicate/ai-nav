import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');

    const token = await this.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    await this.writeAudit(user.id, 'login', 'user', user.id, '');

    return { accessToken: token, user: this.sanitize(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('账号不存在');
    return this.sanitize(user);
  }

  /** 修改密码 */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('新密码至少 6 位');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('账号不存在');

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('原密码错误');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    return { success: true };
  }

  private async sign(payload: { sub: string; username: string; role: UserRole }) {
    return this.jwt.signAsync(payload);
  }

  private async writeAudit(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    detail: string,
  ) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, detail },
    });
  }

  private sanitize(user: {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
