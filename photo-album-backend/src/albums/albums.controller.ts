import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  findAll(@Query('ownerId') ownerId?: string) {
    return this.albumsService.findAll(ownerId);
  }

  @Post()
  create(@Body() dto: CreateAlbumDto) {
    return this.albumsService.create(dto);
  }

  @Get(':albumId')
  findOne(@Param('albumId', ParseUUIDPipe) albumId: string) {
    return this.albumsService.findOne(albumId);
  }

  @Patch(':albumId')
  update(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    return this.albumsService.update(albumId, dto);
  }

  @Delete(':albumId')
  remove(@Param('albumId', ParseUUIDPipe) albumId: string) {
    return this.albumsService.remove(albumId);
  }

  @Post(':albumId/photos')
  addPhoto(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: CreatePhotoDto,
  ) {
    return this.albumsService.addPhoto(albumId, dto);
  }

  @Delete(':albumId/photos/:photoId')
  removePhoto(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.albumsService.removePhoto(albumId, photoId);
  }

  @Patch(':albumId/photos/order')
  reorderPhotos(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: ReorderPhotosDto,
  ) {
    return this.albumsService.reorderPhotos(albumId, dto);
  }
}