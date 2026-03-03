import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GenerationsService } from './generations.service';
import { GenerationsController } from './generations.controller';
import { GenerationProcessor } from './generation.processor';
import { PrismaService } from '../common/prisma.service';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'generation',
    }),
    AiModule,
    StorageModule,
  ],
  providers: [GenerationsService, GenerationProcessor, PrismaService],
  controllers: [GenerationsController],
  exports: [GenerationsService],
})
export class GenerationsModule {}
