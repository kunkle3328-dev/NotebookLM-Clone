import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';
import { PrismaService } from '../common/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [StorageModule, AiModule],
  providers: [SourcesService, PrismaService],
  controllers: [SourcesController],
  exports: [SourcesService],
})
export class SourcesModule {}
