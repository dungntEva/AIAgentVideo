import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const rendersDir = join(process.cwd(), 'public', 'renders');
  fs.mkdirSync(rendersDir, { recursive: true });
  app.useStaticAssets(join(process.cwd(), 'public'));

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`🚀 OmniReel NestJS + GraphQL Backend running at http://localhost:${port}/graphql`);
}

bootstrap();

