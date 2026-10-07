import { Module } from '@nestjs/common';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [AlbumsController],
  imports: [StorageModule, AuthModule],
  providers: [AlbumsService],
})
export class AlbumsModule {}