import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/shared/database/database.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,         // hace disponible ConfigService en toda la app
      envFilePath: '.env',    // explícito; por defecto también intenta .env
      // ignoreEnvFile: false, // asegúrate de NO poner true aquí
    }),
    DatabaseModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
