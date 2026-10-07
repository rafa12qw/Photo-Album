import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ListAlbumsDto } from './dto/list-albums.dto';
import { StorageService, UploadableFile } from '../storage/storage.service';
import { CommentDto } from './dto/comment.dto';
import { MemberDto } from './dto/member.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

const albumInclude = {
  photos: {
    orderBy: { position: 'asc' as const },
    include: { photo: { include: { comments: { include: { author: { select: { id: true, email: true } }, }, orderBy: { createdAt: 'asc' as const } } } } },
  },
};

@Injectable()
export class AlbumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: ListAlbumsDto) {
    const skip = (query.page - 1) * query.limit;
    const where = query.ownerId ? { ownerId: query.ownerId } : undefined;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.album.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { photos: true } } },
      }),
      this.prisma.album.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async uploadPhoto(albumId: string, userId: string, file: UploadableFile) {
    await this.assertExists(albumId);
    const originalKey = await this.storage.upload(userId, file);
    const position =
      ((await this.prisma.albumPhoto.aggregate({
        where: { albumId },
        _max: { position: true },
      }))._max.position ?? -1) + 1;
    const photo = await this.prisma.photo.create({
      data: {
        originalKey,
        filename: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        albums: { create: { albumId, position } },
      },
      include: { albums: true },
    });
    return { ...photo, url: this.storage.publicUrl(photo.originalKey) };
  }

  async findOne(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: albumInclude,
    });
    if (!album) throw new NotFoundException(`Album ${id} not found`);
    return {
      ...album,
      photos: album.photos.map((link) => ({
        ...link,
        photo: { ...link.photo, url: this.storage.publicUrl(link.photo.originalKey) },
      })),
    };
  }

  create(dto: CreateAlbumDto) {
    return this.prisma.album.create({
      data: { name: dto.name, ownerId: dto.ownerId },
      include: albumInclude,
    });
  }

  async update(id: string, dto: UpdateAlbumDto) {
    await this.assertExists(id);
    return this.prisma.album.update({
      where: { id },
      data: dto,
      include: albumInclude,
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.album.delete({ where: { id } });
    return { id, deleted: true };
  }

  async addPhoto(albumId: string, dto: CreatePhotoDto) {
    await this.assertExists(albumId);
    const { position, ...photoData } = dto;
    const nextPosition =
      position ??
      ((await this.prisma.albumPhoto.aggregate({
        where: { albumId },
        _max: { position: true },
      }))._max.position ?? -1) + 1;

    return this.prisma.photo.create({
      data: {
        ...photoData,
        albums: { create: { albumId, position: nextPosition } },
      },
      include: { albums: true },
    });
  }

  async removePhoto(albumId: string, photoId: string) {
    await this.assertPhotoInAlbum(albumId, photoId);
    const photo = await this.prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
    await this.prisma.photo.delete({ where: { id: photoId } });
    await this.storage.remove(photo.originalKey);
    return { albumId, photoId, deleted: true };
  }

  async replacePhoto(albumId: string, photoId: string, userId: string, file: UploadableFile) {
    await this.assertPhotoInAlbum(albumId, photoId);
    const current = await this.prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
    const originalKey = await this.storage.upload(userId, file);
    const photo = await this.prisma.photo.update({
      where: { id: photoId },
      data: { originalKey, filename: file.originalname, contentType: file.mimetype, sizeBytes: file.size },
      include: { albums: true },
    });
    await this.storage.remove(current.originalKey);
    return { ...photo, url: this.storage.publicUrl(photo.originalKey) };
  }

  async updatePhoto(albumId: string, photoId: string, dto: UpdatePhotoDto) {
    await this.assertPhotoInAlbum(albumId, photoId);
    const photo = await this.prisma.photo.update({
      where: { id: photoId },
      data: dto,
    });
    return { ...photo, url: this.storage.publicUrl(photo.originalKey) };
  }

  async reorderPhotos(albumId: string, dto: ReorderPhotosDto) {
    await this.assertExists(albumId);
    const links = await this.prisma.albumPhoto.findMany({
      where: { albumId, photoId: { in: dto.photoIds } },
      select: { photoId: true },
    });
    if (links.length !== dto.photoIds.length) {
      throw new NotFoundException('Every photo must belong to the album');
    }
    await this.prisma.$transaction(
      dto.photoIds.map((photoId, position) =>
        this.prisma.albumPhoto.update({
          where: { albumId_photoId: { albumId, photoId } },
          data: { position },
        }),
      ),
    );
    return this.findOne(albumId);
  }

  listMembers(albumId: string) {
    return this.prisma.albumMember.findMany({
      where: { albumId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(albumId: string, dto: MemberDto) {
    await this.assertExists(albumId);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new NotFoundException('No account exists for this email');
    return this.prisma.albumMember.upsert({
      where: { albumId_userId: { albumId, userId: user.id } },
      create: { albumId, userId: user.id, role: dto.role },
      update: { role: dto.role },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async removeMember(albumId: string, userId: string) {
    await this.prisma.albumMember.delete({ where: { albumId_userId: { albumId, userId } } });
    return { albumId, userId, deleted: true };
  }

  async listComments(albumId: string, photoId: string) {
    await this.assertPhotoInAlbum(albumId, photoId);
    return this.prisma.comment.findMany({
      where: { albumId, photoId },
      include: { author: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(albumId: string, photoId: string, dto: CommentDto) {
    await this.assertPhotoInAlbum(albumId, photoId);
    return this.prisma.comment.create({
      data: { albumId, photoId, authorId: dto.authorId, body: dto.body },
      include: { author: { select: { id: true, email: true } } },
    });
  }

  async removeComment(albumId: string, photoId: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, albumId, photoId } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { id: commentId, deleted: true };
  }

  async updateComment(
    albumId: string,
    photoId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, albumId, photoId } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.assertAlbumCollaborator(albumId, userId);
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body },
      include: { author: { select: { id: true, email: true } } },
    });
  }

  private async assertAlbumCollaborator(albumId: string, userId: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, select: { ownerId: true } });
    const member = await this.prisma.albumMember.findUnique({ where: { albumId_userId: { albumId, userId } } });
    if (!album || (album.ownerId !== userId && !member)) {
      throw new NotFoundException('You are not a collaborator on this album');
    }
  }

  private async assertExists(id: string) {
    const album = await this.prisma.album.findUnique({ where: { id } });
    if (!album) throw new NotFoundException(`Album ${id} not found`);
  }

  private async assertPhotoInAlbum(albumId: string, photoId: string) {
    const link = await this.prisma.albumPhoto.findUnique({
      where: { albumId_photoId: { albumId, photoId } },
    });
    if (!link) throw new NotFoundException('Photo not found in this album');
  }
}