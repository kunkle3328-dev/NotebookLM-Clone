import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';

class ChatRequestDto {
  projectId: string;
  message: string;
  selectedSourceIds?: string[];
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send chat message' })
  async chat(@Body() dto: ChatRequestDto) {
    const response = await this.chatService.chat(
      dto.projectId,
      dto.message,
      dto.selectedSourceIds,
    );
    return { success: true, data: response };
  }

  @Get('history/:projectId')
  @ApiOperation({ summary: 'Get chat history' })
  async getHistory(@Param('projectId') projectId: string) {
    const history = await this.chatService.getHistory(projectId);
    return { success: true, data: history };
  }

  @Delete('history/:projectId')
  @ApiOperation({ summary: 'Clear chat history' })
  async clearHistory(@Param('projectId') projectId: string) {
    await this.chatService.clearHistory(projectId);
    return { success: true };
  }
}
