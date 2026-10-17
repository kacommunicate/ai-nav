import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  root() {
    return {
      name: 'AI 导航站 API',
      version: '1.0.0',
      docs: '/api/docs',
      status: 'running',
    };
  }

  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
