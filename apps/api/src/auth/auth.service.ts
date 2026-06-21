import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 30;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; fullName: string | null };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: {
            fullName: dto.fullName,
          },
        },
      },
      include: { profile: true },
    });

    return this.issueTokens(user.id, user.email, user.profile?.fullName ?? dto.fullName);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user.id, user.email, user.profile?.fullName ?? null);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Rotate: revoke the old token, issue a new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.profile?.fullName ?? null);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    fullName: string | null,
  ): Promise<AuthTokens> {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-access-secret-change-me',
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY') || '15m',
      },
    );

    const rawRefreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: { id: userId, email, fullName },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
