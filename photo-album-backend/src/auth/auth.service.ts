import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: AuthDto) {
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email.toLowerCase(), passwordHash: await bcrypt.hash(dto.password, 12) },
      });
      return this.issueToken(user.id, user.email);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user.id, user.email);
  }

  private issueToken(userId: string, email: string) {
    return {
      accessToken: this.jwt.sign({ sub: userId, email }),
      user: { id: userId, email },
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }
}