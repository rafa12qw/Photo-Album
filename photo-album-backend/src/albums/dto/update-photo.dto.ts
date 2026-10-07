import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePhotoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  caption?: string;
}