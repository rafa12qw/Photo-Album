import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'photo-album-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
