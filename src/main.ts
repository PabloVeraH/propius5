import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './modules/shared/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,              // elimina propiedades no declaradas en DTO
      forbidNonWhitelisted: true,   // lanza 400 si vienen propiedades extra
      transform: true,              // transforma payload a instancias de DTO
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,       // opcional: falla en el primer error
      // enableErrorMessages: process.env.NODE_ENV !== 'production',
    }),);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);
  
  await app.listen(Number(port));
  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
}
bootstrap();
