import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { Generation, GenerationSettings, GenerationType } from '@notebook/shared';

@Injectable()
export class GenerationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('generation') private generationQueue: Queue,
  ) {}

  async create(
    projectId: string,
    type: GenerationType,
    title: string,
    settings: GenerationSettings,
  ): Promise<Generation> {
    const generation = await this.prisma.generation.create({
      data: {
        projectId,
        type,
        title,
        status: 'pending',
        settings: settings as any,
        metadata: {
          sourceCount: settings.useAllSources ? undefined : (settings.selectedSourceIds?.length || 0),
        },
      },
    });

    // Add to queue for processing
    await this.generationQueue.add(
      'generate',
      {
        generationId: generation.id,
        projectId,
        type,
        settings,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return generation as Generation;
  }

  async findAll(projectId: string): Promise<Generation[]> {
    const generations = await this.prisma.generation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return generations as Generation[];
  }

  async findOne(id: string): Promise<Generation> {
    const generation = await this.prisma.generation.findUnique({
      where: { id },
    });

    if (!generation) {
      throw new NotFoundException(`Generation ${id} not found`);
    }

    return generation as Generation;
  }

  async getAssets(id: string) {
    const generation = await this.findOne(id);
    return {
      assets: generation.assets || {},
      status: generation.status,
    };
  }

  async rate(id: string, liked: boolean, feedback?: string): Promise<Generation> {
    const generation = await this.prisma.generation.update({
      where: { id },
      data: {
        rating: {
          liked,
          feedback,
        },
      },
    });
    return generation as Generation;
  }

  async regenerate(id: string): Promise<Generation> {
    const original = await this.findOne(id);
    
    // Create new generation as variant
    const newGeneration = await this.prisma.generation.create({
      data: {
        projectId: original.projectId,
        type: original.type,
        title: original.title,
        status: 'pending',
        settings: original.settings as any,
        parentId: id,
        metadata: original.metadata as any,
      },
    });

    // Add to queue
    await this.generationQueue.add(
      'generate',
      {
        generationId: newGeneration.id,
        projectId: original.projectId,
        type: original.type,
        settings: original.settings,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return newGeneration as Generation;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.generation.delete({
      where: { id },
    });
  }

  async getTemplates(projectId: string, generationType: string) {
    const template = await this.prisma.template.findUnique({
      where: {
        projectId_generationType: {
          projectId,
          generationType,
        },
      },
    });
    return template;
  }

  async updateTemplate(
    projectId: string,
    generationType: string,
    data: { name?: string; instructions?: string; systemPrompt?: string },
  ) {
    const template = await this.prisma.template.upsert({
      where: {
        projectId_generationType: {
          projectId,
          generationType,
        },
      },
      update: data,
      create: {
        projectId,
        generationType,
        name: data.name || generationType,
        instructions: data.instructions || '',
        systemPrompt: data.systemPrompt || '',
        isDefault: false,
      },
    });
    return template;
  }
}
