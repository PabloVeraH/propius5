import { Injectable, INestApplication, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    const logLevels: ('query' | 'info' | 'warn' | 'error')[] = isProd
      ? ['warn', 'error']
      : ['query', 'info', 'warn', 'error'];

    super({
      datasources: {db: { url: process.env.DATABASE_URL } },
      log: logLevels,
      errorFormat: isProd ? 'minimal' : 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma conectado a la base de datos');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma desconectado');
  }

  // Llama esto en bootstrap para que Nest cierre limpio cuando Prisma emite beforeExit
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit', async () => {
      this.logger.log('beforeExit recibido desde Prisma; cerrando la app Nest...');
      await app.close();
    });
  }

  // Helper conveniente para ejecutar lógica dentro de una transacción
  async withTransaction<T>(fn: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction'>) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => fn(tx as unknown as PrismaService));
  }
}