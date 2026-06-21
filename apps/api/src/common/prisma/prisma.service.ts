import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Uses Prisma's driver-adapter architecture (engineType = "client" in
 * schema.prisma) rather than the legacy Rust query-engine binary. This
 * means no postinstall binary download from binaries.prisma.sh — Prisma
 * talks to Postgres directly through the standard `pg` driver. Same
 * benefit in restrictive/offline CI environments as it is in production
 * (smaller image, faster cold start, one less network dependency).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
