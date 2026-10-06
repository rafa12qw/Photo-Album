import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderPhotosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  photoIds!: string[];
}