import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

export type UploadableFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class StorageService {
  private readonly root: string;
  private readonly provider: string;

  constructor(config: ConfigService) {
    this.provider = config.get<string>('UPLOAD_PROVIDER', 'local');
    this.root = resolve(process.cwd(), config.get<string>('UPLOAD_DIR', 'uploads'));
    if (this.provider === 'cloudinary') {
      cloudinary.config({
        cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
        api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      });
    }
  }

  async upload(userId: string, file: UploadableFile) {
    const extension = extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (this.provider === 'cloudinary') {
      return new Promise<string>((resolveUpload, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: `photo-album/users/${userId}/photos`,
          public_id: randomUUID(),
          resource_type: 'image',
        }, (error, result) => {
          if (error || !result) reject(error ?? new Error('Cloudinary upload failed'));
          else resolveUpload(result.public_id);
        });
        stream.end(file.buffer);
      });
    }
    const key = join('users', userId, 'photos', `${randomUUID()}${extension}`);
    const target = this.filePath(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.buffer);
    return key;
  }

  async remove(key: string) {
    if (this.provider === 'cloudinary') {
      await cloudinary.uploader.destroy(key, { resource_type: 'image' });
      return;
    }
    await rm(this.filePath(key), { force: true });
  }

  publicUrl(key: string) {
    if (this.provider === 'cloudinary') return cloudinary.url(key, { secure: true, resource_type: 'image' });
    return `/uploads/${key.split('\\').join('/')}`;
  }

  private filePath(key: string) {
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}/`)) throw new Error('Invalid upload path');
    return target;
  }
}