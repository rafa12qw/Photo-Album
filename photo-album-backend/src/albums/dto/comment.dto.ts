import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CommentDto {
  @IsUUID()
  authorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;
}