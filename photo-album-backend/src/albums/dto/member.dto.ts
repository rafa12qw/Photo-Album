import { IsEmail, IsEnum } from 'class-validator';
import { AlbumRole } from '@prisma/client';

export class MemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(AlbumRole)
  role: AlbumRole = AlbumRole.VIEWER;
}