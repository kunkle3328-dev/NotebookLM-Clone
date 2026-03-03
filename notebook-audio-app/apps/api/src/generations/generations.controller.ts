import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GenerationsService } from './generations.service';
import { GenerationType, GenerationSettings } from '@notebook/shared';

class CreateGenerationDto {
  projectId: string;
  type: GenerationType;
  title: string;
  settings: GenerationSettings;
}

class RateGenerationDto {
  liked: boolean;
  feedback?: string;
}

class UpdateTemplateDto {
  name?: string;
  instructions?: string;
  systemPrompt?: string;
}

@ApiTags('generations')
@Controller('generations')
export class GenerationsController {
  constructor(private generationsService: GenerationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new generation' })
  async create(@Body() dto: CreateGenerationDto) {
    const generation = await this.generationsService.create(
      dto.projectId,
      dto.type,
      dto.title,
      dto.settings,
    );
    return { success: true, data: generation };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get generation by ID' })
  async findOne(@Param('id') id: string) {
    const generation = await this.generationsService.findOne(id);
    return { success: true, data: generation };
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'Get generation assets' })
  async getAssets(@Param('id') id: string) {
    const assets = await this.generationsService.getAssets(id);
    return { success: true, data: assets };
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate generation' })
  async rate(@Param('id') id: string, @Body() dto: RateGenerationDto) {
    const generation = await this.generationsService.rate(id, dto.liked, dto.feedback);
    return { success: true, data: generation };
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate (create variant)' })
  async regenerate(@Param('id') id: string) {
    const generation = await this.generationsService.regenerate(id);
    return { success: true, data: generation };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete generation' })
  async remove(@Param('id') id: string) {
    await this.generationsService.remove(id);
    return { success: true };
  }

  @Get('templates/:projectId/:type')
  @ApiOperation({ summary: 'Get template for generation type' })
  async getTemplate(
    @Param('projectId') projectId: string,
    @Param('type') type: string,
  ) {
    const template = await this.generationsService.getTemplates(projectId, type);
    return { success: true, data: template };
  }

  @Post('templates/:projectId/:type')
  @ApiOperation({ summary: 'Update template for generation type' })
  async updateTemplate(
    @Param('projectId') projectId: string,
    @Param('type') type: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const template = await this.generationsService.updateTemplate(projectId, type, dto);
    return { success: true, data: template };
  }
}
