import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { SourcesModule } from './sources/sources.module';
import { ChatModule } from './chat/chat.module';
import { GenerationsModule } from './generations/generations.module';
import { AiModule } from './ai/ai.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    AuthModule,
    ProjectsModule,
    SourcesModule,
    ChatModule,
    GenerationsModule,
    AiModule,
    QueueModule,
    StorageModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
