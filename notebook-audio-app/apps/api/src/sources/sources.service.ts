import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { Source, SourceType, WebSearchResult } from '@notebook/shared';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class SourcesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private ai: AiService,
  ) {}

  async createPdf(projectId: string, file: Express.Multer.File, title?: string): Promise<Source> {
    // Upload file to storage
    const fileUrl = await this.storage.uploadFile(
      `projects/${projectId}/sources`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    // Extract text from PDF
    let extractedText = '';
    try {
      extractedText = await this.ai.extractPdfText(file.buffer);
    } catch (error) {
      console.error('PDF extraction failed:', error);
    }

    // Create source record
    const source = await this.prisma.source.create({
      data: {
        projectId,
        type: 'pdf',
        title: title || file.originalname.replace(/\.pdf$/i, ''),
        fileUrl,
        extractedText,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    // Create chunks for RAG
    if (extractedText) {
      await this.createChunks(source.id, projectId, extractedText);
    }

    return source as Source;
  }

  async createAudio(projectId: string, file: Express.Multer.File, title?: string): Promise<Source> {
    const fileUrl = await this.storage.uploadFile(
      `projects/${projectId}/sources`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    // TODO: Transcribe audio if needed
    const source = await this.prisma.source.create({
      data: {
        projectId,
        type: 'audio',
        title: title || file.originalname.replace(/\.(mp3|wav|m4a|ogg)$/i, ''),
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return source as Source;
  }

  async createImage(projectId: string, file: Express.Multer.File, title?: string): Promise<Source> {
    const fileUrl = await this.storage.uploadFile(
      `projects/${projectId}/sources`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    // TODO: OCR if needed
    const source = await this.prisma.source.create({
      data: {
        projectId,
        type: 'image',
        title: title || file.originalname.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''),
        fileUrl,
        thumbnailUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return source as Source;
  }

  async createWebsite(projectId: string, url: string, title?: string): Promise<Source> {
    // Fetch and extract content
    let extractedText = '';
    let pageTitle = title;
    let faviconUrl = '';

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NotebookBot/1.0)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      
      if (!pageTitle) {
        pageTitle = $('title').text() || $('h1').first().text() || 'Untitled Webpage';
      }

      // Extract main content
      $('script, style, nav, footer, header, aside').remove();
      extractedText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 50000);

      // Try to find favicon
      const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');
      if (favicon) {
        faviconUrl = favicon.startsWith('http') ? favicon : new URL(favicon, url).href;
      }
    } catch (error) {
      console.error('Website extraction failed:', error);
      if (!pageTitle) pageTitle = url;
    }

    const source = await this.prisma.source.create({
      data: {
        projectId,
        type: 'website',
        title: pageTitle,
        url,
        extractedText,
        faviconUrl,
      },
    });

    if (extractedText) {
      await this.createChunks(source.id, projectId, extractedText);
    }

    return source as Source;
  }

  async createYoutube(projectId: string, url: string, title?: string): Promise<Source> {
    // Extract video ID
    const videoId = this.extractYoutubeId(url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : undefined;

    // TODO: Try to get transcript
    let extractedText = '';
    try {
      extractedText = await this.ai.extractYoutubeTranscript(videoId);
    } catch (error) {
      console.error('YouTube transcript extraction failed:', error);
    }

    const source = await this.prisma.source.create({
      data: {
        projectId,
        type: 'youtube',
        title: title || 'YouTube Video',
        url,
        thumbnailUrl,
        extractedText,
      },
    });

    if (extractedText) {
      await this.createChunks(source.id, projectId, extractedText);
    }

    return source as Source;
  }

  async createText(projectId: string, title: string, text: string): Promise<Source> {
    const source = await this.prisma.source.create({
      data: {
        projectId,
        type: 'copied_text',
        title,
        content: text,
        extractedText: text,
      },
    });

    await this.createChunks(source.id, projectId, text);

    return source as Source;
  }

  async searchWeb(query: string): Promise<WebSearchResult[]> {
    // TODO: Implement real web search (e.g., using SerpAPI, Bing API, etc.)
    // For now, return stub results
    return [
      {
        title: `Search result for "${query}"`,
        url: 'https://example.com/result1',
        snippet: 'This is a placeholder search result. Implement real web search integration.',
        site: 'example.com',
        favicon: 'https://example.com/favicon.ico',
      },
      {
        title: `Another result for "${query}"`,
        url: 'https://example.com/result2',
        snippet: 'Implement web search using SerpAPI, Bing Search API, or similar service.',
        site: 'example.com',
      },
    ];
  }

  async findAll(projectId: string): Promise<Source[]> {
    const sources = await this.prisma.source.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return sources as Source[];
  }

  async findOne(id: string): Promise<Source> {
    const source = await this.prisma.source.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException(`Source ${id} not found`);
    }

    return source as Source;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.source.delete({
      where: { id },
    });
  }

  private extractYoutubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/shorts\/([^&\s?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private async createChunks(sourceId: string, projectId: string, text: string): Promise<void> {
    const chunks = this.ai.chunkText(text, 1000, 100);
    
    for (let i = 0; i < chunks.length; i++) {
      await this.prisma.chunk.create({
        data: {
          sourceId,
          projectId,
          text: chunks[i],
          index: i,
        },
      });
    }
  }
}
