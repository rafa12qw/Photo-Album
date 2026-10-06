import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

const albumInclude = {
  photos: {
    orderBy: { position: 'asc' as const },
    include: { photo: true },
  },
};

@Injectable()
export class AlbumsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerId?: string) {
    return this.prisma.album.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { photos: true } } },
    });
  }

  async findOne(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: albumInclude,
    });
    if (!album) throw new NotFoundException(`Album ${id} not found`);
    return album;
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
    await this.prisma.albumPhoto.delete({
      where: { albumId_photoId: { albumId, photoId } },
    });
    return { albumId, photoId, deleted: true };
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