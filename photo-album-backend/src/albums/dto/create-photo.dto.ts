import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  originalKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  thumbnailKey?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contentType!: string;

  @IsInt()
  @IsPositive()
  sizeBytes!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  width?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  height?: number;

  @IsOptional()
  @IsInt()
  position?: number;
}