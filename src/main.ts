import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

async function bootstrap() {
  
  console.log('CWD:', process.cwd());
  console.log('JWT_SECRET (pre-Nest):', process.env.JWT_SECRET);
  
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,              // elimina propiedades no declaradas en DTO
      forbidNonWhitelisted: false,   // lanza 400 si vienen propiedades extra
      transform: true,              // transforma payload a instancias de DTO
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,       // opcional: falla en el primer error
      // enableErrorMessages: process.env.NODE_ENV !== 'production',
    }),);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  //const prisma = app.get(PrismaService);
  //await prisma.enableShutdownHooks(app);

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  
  
  await app.listen(Number(port));
  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
}
bootstrap();
