import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClientRepository } from './prisma.repository';

@Global()
@Module({
  providers: [PrismaService, PrismaClientRepository],
  exports: [PrismaClientRepository],
})
export class PrismaModule {}
