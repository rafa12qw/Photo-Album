import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  constructor(config: ConfigService) {
    this.root = resolve(process.cwd(), config.get<string>('UPLOAD_DIR', 'uploads'));
  }

  async upload(userId: string, file: UploadableFile) {
    const extension = extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const key = join('users', userId, 'photos', `${randomUUID()}${extension}`);
    const target = this.filePath(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.buffer);
    return key;
  }

  async remove(key: string) {
    await rm(this.filePath(key), { force: true });
  }

  publicUrl(key: string) {
    return `/uploads/${key.split('\\').join('/')}`;
  }

  private filePath(key: string) {
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}/`)) throw new Error('Invalid upload path');
    return target;
  }
}