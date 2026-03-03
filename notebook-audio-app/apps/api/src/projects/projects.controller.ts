import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

class CreateProjectDto {
  title: string;
  description?: string;
}

class UpdateProjectDto {
  title?: string;
  description?: string;
}

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(@Body() dto: CreateProjectDto) {
    const project = await this.projectsService.create(dto);
    return { success: true, data: project };
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  async findAll() {
    const projects = await this.projectsService.findAll();
    return { success: true, data: projects };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(id);
    return { success: true, data: project };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const project = await this.projectsService.update(id, dto);
    return { success: true, data: project };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return { success: true };
  }

  @Get(':id/sources')
  @ApiOperation({ summary: 'Get project sources' })
  async getSources(@Param('id') id: string) {
    const sources = await this.projectsService.getSources(id);
    return { success: true, data: sources };
  }

  @Get(':id/generations')
  @ApiOperation({ summary: 'Get project generations' })
  async getGenerations(@Param('id') id: string) {
    const generations = await this.projectsService.getGenerations(id);
    return { success: true, data: generations };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get project messages' })
  async getMessages(@Param('id') id: string) {
    const messages = await this.projectsService.getMessages(id);
    return { success: true, data: messages };
  }
}
