import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsUUID()
  ownerId!: string;
}