import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { log } from 'console';
import { PrismaClientRepository } from './prisma.repository';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly prismaClientRepository: PrismaClientRepository,
  ) {}

  async onModuleInit() {
    await this.prismaClientRepository.dbConnect();
    log('Connected to DB successfully');
  }

  async onModuleDestroy() {
    await this.prismaClientRepository.dbDisconnect();
    log('Disconnected from DB');
  }

  async cleanDatabase() {
    try {
      await this.prismaClientRepository.cleanDatabase();
    } catch (error) {
      log(error);
    }
  }
}
