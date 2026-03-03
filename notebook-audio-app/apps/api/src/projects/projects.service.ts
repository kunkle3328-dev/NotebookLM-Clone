import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Project } from '@notebook/shared';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; description?: string }): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
      },
    });

    // Create default templates for the project
    const generationTypes = [
      { type: 'audio_overview', name: 'Audio Overview', instructions: 'Create an engaging audio discussion between two hosts about the provided sources.' },
      { type: 'video_overview', name: 'Video Overview', instructions: 'Create a video storyboard with narration based on the provided sources.' },
      { type: 'flashcards', name: 'Flashcards', instructions: 'Generate study flashcards with questions and answers from the provided sources.' },
      { type: 'quiz', name: 'Quiz', instructions: 'Create a multiple-choice quiz to test understanding of the provided sources.' },
      { type: 'infographic', name: 'Infographic', instructions: 'Generate a structured infographic highlighting key information from the sources.' },
      { type: 'slide_deck', name: 'Slide Deck', instructions: 'Create a presentation slide deck summarizing the provided sources.' },
    ];

    for (const genType of generationTypes) {
      await this.prisma.template.create({
        data: {
          projectId: project.id,
          generationType: genType.type,
          name: genType.name,
          instructions: genType.instructions,
          systemPrompt: `You are an expert content creator. ${genType.instructions} Focus on accuracy and clarity.`,
          isDefault: true,
        },
      });
    }

    return project as Project;
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return projects as Project[];
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sources: true,
            generations: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project as Project;
  }

  async update(id: string, data: { title?: string; description?: string }): Promise<Project> {
    const project = await this.prisma.project.update({
      where: { id },
      data,
    });
    return project as Project;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async getSources(id: string) {
    const sources = await this.prisma.source.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });
    return sources;
  }

  async getGenerations(id: string) {
    const generations = await this.prisma.generation.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });
    return generations;
  }

  async getMessages(id: string) {
    const messages = await this.prisma.message.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });
    return messages;
  }
}
