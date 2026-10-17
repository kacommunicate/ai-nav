import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  // CORS：WEB_ORIGIN 支持逗号分隔的多个来源（如 GitHub Pages 域名 +
  // 本地开发地址），未配置时放开（同进程托管场景无需 CORS）。
  const allowedOrigins = (process.env.WEB_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: allowedOrigins.length > 0 ? { origin: allowedOrigins, credentials: true } : true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- 同进程托管前端构建产物（可选）----
  // 前后端分离部署（前端在 GitHub Pages、后端在 Render 等）时此目录不存在，
  // 直接跳过；Docker 部署时 Dockerfile 会把 web/dist 复制到这里。
  const webDist = process.env.WEB_DIST || join(__dirname, '..', 'web', 'dist');
  if (existsSync(webDist)) {
    app.useStaticAssets(webDist);
    // SPA 回退：除 /api 外的所有路径都返回 index.html，交给前端路由处理
    app.use((req: any, res: any, next: () => void) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(join(webDist, 'index.html'));
    });
    console.log(`📦 前端静态文件已托管: ${webDist}`);
  } else {
    console.log(`ℹ️  未找到前端构建产物 (${webDist})，仅提供 API 服务`);
  }

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  const config = new DocumentBuilder()
    .setTitle('AI 导航站 API')
    .setDescription('AI 工具导航站后台管理 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API 服务已启动: http://localhost:${port}/api`);
  console.log(`📚 Swagger 文档:    http://localhost:${port}/api/docs`);
}

bootstrap();
