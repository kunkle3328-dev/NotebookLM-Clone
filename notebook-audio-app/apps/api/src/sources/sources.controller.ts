import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SourcesService } from './sources.service';

class CreateUrlDto {
  url: string;
  title?: string;
}

class CreateTextDto {
  title: string;
  text: string;
}

class SearchWebDto {
  q: string;
}

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Post('pdf')
  @ApiOperation({ summary: 'Upload PDF source' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createPdf(
    @Query('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
  ) {
    const source = await this.sourcesService.createPdf(projectId, file, title);
    return { success: true, data: source };
  }

  @Post('audio')
  @ApiOperation({ summary: 'Upload audio source' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createAudio(
    @Query('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
  ) {
    const source = await this.sourcesService.createAudio(projectId, file, title);
    return { success: true, data: source };
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload image source' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createImage(
    @Query('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
  ) {
    const source = await this.sourcesService.createImage(projectId, file, title);
    return { success: true, data: source };
  }

  @Post('url')
  @ApiOperation({ summary: 'Add website URL source' })
  async createWebsite(@Body() dto: CreateUrlDto, @Query('projectId') projectId: string) {
    const source = await this.sourcesService.createWebsite(projectId, dto.url, dto.title);
    return { success: true, data: source };
  }

  @Post('youtube')
  @ApiOperation({ summary: 'Add YouTube source' })
  async createYoutube(@Body() dto: CreateUrlDto, @Query('projectId') projectId: string) {
    const source = await this.sourcesService.createYoutube(projectId, dto.url, dto.title);
    return { success: true, data: source };
  }

  @Post('text')
  @ApiOperation({ summary: 'Add copied text source' })
  async createText(@Body() dto: CreateTextDto, @Query('projectId') projectId: string) {
    const source = await this.sourcesService.createText(projectId, dto.title, dto.text);
    return { success: true, data: source };
  }

  @Get('search/web')
  @ApiOperation({ summary: 'Search web for sources' })
  async searchWeb(@Query() query: SearchWebDto) {
    const results = await this.sourcesService.searchWeb(query.q);
    return { success: true, data: results };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get source by ID' })
  async findOne(@Param('id') id: string) {
    const source = await this.sourcesService.findOne(id);
    return { success: true, data: source };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete source' })
  async remove(@Param('id') id: string) {
    await this.sourcesService.remove(id);
    return { success: true };
  }
}
