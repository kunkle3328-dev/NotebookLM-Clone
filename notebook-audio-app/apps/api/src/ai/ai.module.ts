import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { TtsService } from './tts.service';
import { PrismaService } from '../common/prisma.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ConfigModule, StorageModule],
  providers: [AiService, TtsService, PrismaService],
  exports: [AiService, TtsService],
})
export class AiModule {}
