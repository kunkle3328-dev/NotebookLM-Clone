import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { Message, ChatResponse } from '@notebook/shared';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async chat(
    projectId: string,
    message: string,
    selectedSourceIds?: string[],
  ): Promise<ChatResponse> {
    // Save user message
    await this.prisma.message.create({
      data: {
        projectId,
        role: 'user',
        content: message,
        usedSourceIds: selectedSourceIds || [],
      },
    });

    // Get relevant chunks using RAG
    const relevantChunks = await this.ai.retrieveRelevantChunks(
      projectId,
      message,
      5,
      selectedSourceIds,
    );

    // Get chat history for context
    const history = await this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // Generate response
    const response = await this.ai.generateChatResponse(
      message,
      relevantChunks,
      history.map(h => ({ role: h.role, content: h.content })),
    );

    // Extract used source IDs from chunks
    const usedSourceIds = [...new Set(relevantChunks.map(c => c.sourceId))];

    // Create citations
    const citations = relevantChunks.slice(0, 3).map(chunk => ({
      sourceId: chunk.sourceId,
      text: chunk.text.substring(0, 200) + '...',
      page: chunk.metadata?.page,
    }));

    // Save assistant message
    await this.prisma.message.create({
      data: {
        projectId,
        role: 'assistant',
        content: response,
        usedSourceIds,
        citations,
      },
    });

    return {
      reply: response,
      usedSourceIds,
      citations,
    };
  }

  async getHistory(projectId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    return messages as Message[];
  }

  async clearHistory(projectId: string): Promise<void> {
    await this.prisma.message.deleteMany({
      where: { projectId },
    });
  }
}
