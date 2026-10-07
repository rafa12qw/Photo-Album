import {
  Body,
  Controller,
  Delete,
  Get,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ListAlbumsDto } from './dto/list-albums.dto';
import type { UploadableFile } from '../storage/storage.service';
import { CommentDto } from './dto/comment.dto';
import { MemberDto } from './dto/member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Controller('albums')
@UseGuards(JwtAuthGuard)
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  findAll(@Query() query: ListAlbumsDto) {
    return this.albumsService.findAll(query);
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

  @Post(':albumId/photos/upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  uploadPhoto(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Req() request: { user: { sub: string } },
    @UploadedFile() file?: UploadableFile,
  ) {
    if (!file) throw new BadRequestException('A photo file is required');
    return this.albumsService.uploadPhoto(albumId, request.user.sub, file);
  }

  @Delete(':albumId/photos/:photoId')
  removePhoto(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.albumsService.removePhoto(albumId, photoId);
  }

  @Put(':albumId/photos/:photoId')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  replacePhoto(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Req() request: { user: { sub: string } },
    @UploadedFile() file?: UploadableFile,
  ) {
    if (!file) throw new BadRequestException('A photo file is required');
    return this.albumsService.replacePhoto(albumId, photoId, request.user.sub, file);
  }

  @Patch(':albumId/photos/:photoId')
  updatePhoto(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Body() dto: UpdatePhotoDto,
  ) {
    return this.albumsService.updatePhoto(albumId, photoId, dto);
  }

  @Patch(':albumId/photos/order')
  reorderPhotos(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: ReorderPhotosDto,
  ) {
    return this.albumsService.reorderPhotos(albumId, dto);
  }

  @Get(':albumId/members')
  listMembers(@Param('albumId', ParseUUIDPipe) albumId: string) {
    return this.albumsService.listMembers(albumId);
  }

  @Post(':albumId/members')
  addMember(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: MemberDto,
  ) {
    return this.albumsService.addMember(albumId, dto);
  }

  @Delete(':albumId/members/:userId')
  removeMember(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.albumsService.removeMember(albumId, userId);
  }

  @Get(':albumId/photos/:photoId/comments')
  listComments(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.albumsService.listComments(albumId, photoId);
  }

  @Post(':albumId/photos/:photoId/comments')
  addComment(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Body() dto: CommentDto,
  ) {
    return this.albumsService.addComment(albumId, photoId, dto);
  }

  @Delete(':albumId/photos/:photoId/comments/:commentId')
  removeComment(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.albumsService.removeComment(albumId, photoId, commentId);
  }

  @Patch(':albumId/photos/:photoId/comments/:commentId')
  updateComment(
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() request: { user: { sub: string } },
    @Body() dto: UpdateCommentDto,
  ) {
    return this.albumsService.updateComment(albumId, photoId, commentId, request.user.sub, dto);
  }
}