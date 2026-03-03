import { Processor, Process } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { TtsService } from '../ai/tts.service';
import { GenerationSettings, GenerationType, DialogueLine } from '@notebook/shared';

interface GenerationJob {
  generationId: string;
  projectId: string;
  type: GenerationType;
  settings: GenerationSettings;
}

@Processor('generation')
export class GenerationProcessor {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private tts: TtsService,
  ) {}

  @Process('generate')
  async handleGeneration(job: Job<GenerationJob>) {
    const { generationId, projectId, type, settings } = job.data;

    console.log(`Processing generation ${generationId} of type ${type}`);

    // Update status to processing
    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    try {
      // Get source content
      const sources = await this.getSourceContent(projectId, settings);
      
      switch (type) {
        case 'audio_overview':
          await this.generateAudioOverview(generationId, projectId, sources, settings);
          break;
        case 'video_overview':
          await this.generateVideoOverview(generationId, projectId, sources, settings);
          break;
        case 'flashcards':
          await this.generateFlashcards(generationId, projectId, sources);
          break;
        case 'quiz':
          await this.generateQuiz(generationId, projectId, sources);
          break;
        case 'infographic':
          await this.generateInfographic(generationId, projectId, sources);
          break;
        case 'slide_deck':
          await this.generateSlideDeck(generationId, projectId, sources);
          break;
        default:
          throw new Error(`Unknown generation type: ${type}`);
      }

      // Update status to completed
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      console.log(`Generation ${generationId} completed successfully`);
    } catch (error) {
      console.error(`Generation ${generationId} failed:`, error);
      
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });
      
      throw error;
    }
  }

  private async getSourceContent(
    projectId: string,
    settings: GenerationSettings,
  ): Promise<string> {
    const whereClause: any = { projectId };
    
    if (!settings.useAllSources && settings.selectedSourceIds?.length) {
      whereClause.id = { in: settings.selectedSourceIds };
    }

    const sources = await this.prisma.source.findMany({
      where: whereClause,
    });

    return sources
      .map(s => `Source: ${s.title}\n${s.extractedText || s.content || ''}`)
      .join('\n\n---\n\n');
  }

  private async generateAudioOverview(
    generationId: string,
    projectId: string,
    sources: string,
    settings: GenerationSettings,
  ) {
    // Generate dialogue script
    const dialogue = await this.ai.generateDialogueScript(sources, {
      audience: settings.audience,
      length: settings.length,
      tone: settings.tone,
    });

    // Synthesize speech
    const { audioUrl, waveformUrl, duration } = await this.tts.synthesizeDialogue(
      dialogue,
      projectId,
      generationId,
    );

    // Update generation with results
    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        result: { dialogue },
        assets: {
          audioUrl,
          waveformUrl,
        },
        metadata: {
          duration,
          sourceCount: sources.split('---').length,
          wordCount: dialogue.reduce((sum, line) => sum + line.text.split(' ').length, 0),
        },
      },
    });
  }

  private async generateVideoOverview(
    generationId: string,
    projectId: string,
    sources: string,
    settings: GenerationSettings,
  ) {
    // Generate video storyboard
    const videoData = await this.ai.generateVideoOverview(sources, {
      audience: settings.audience,
      length: settings.length,
      tone: settings.tone,
    });

    // Generate narration audio for each scene
    const narrationTexts = videoData.scenes.map(s => s.narration).join(' ');
    const narrationBuffer = await this.tts.synthesizeSingle(narrationTexts, {
      voiceId: 'nova',
      speed: 1.0,
    });

    const audioFileName = `${generationId}_narration.mp3`;
    const audioUrl = await this.uploadBuffer(
      `projects/${projectId}/generations`,
      audioFileName,
      narrationBuffer,
      'audio/mpeg',
    );

    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        result: videoData,
        assets: {
          audioUrl,
        },
        metadata: {
          duration: videoData.totalDuration,
          sourceCount: sources.split('---').length,
        },
      },
    });
  }

  private async generateFlashcards(
    generationId: string,
    projectId: string,
    sources: string,
  ) {
    const flashcards = await this.ai.generateFlashcards(sources, 15);

    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        result: { flashcards },
        metadata: {
          cardCount: flashcards.length,
          sourceCount: sources.split('---').length,
        },
      },
    });
  }

  private async generateQuiz(
    generationId: string,
    projectId: string,
    sources: string,
  ) {
    const questions = await this.ai.generateQuiz(sources, 10);

    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        result: { questions },
        metadata: {
          questionCount: questions.length,
          sourceCount: sources.split('---').length,
        },
      },
    });
  }

  private async generateInfographic(
    generationId: string,
    projectId: string,
    sources: string,
  ) {
    const infographic = await this.ai.generateInfographic(sources);

    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        result: infographic,
        metadata: {
          sectionCount: infographic.sections.length,
          sourceCount: sources.split('---').length,
        },
      },
    });
  }

  private async generateSlideDeck(
    generationId: string,
    projectId: string,
    sources: string,
  ) {
    const slideDeck = await this.ai.generateSlideDeck(sources, 12);

    await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        result: slideDeck,
        metadata: {
          slideCount: slideDeck.slides.length,
          sourceCount: sources.split('---').length,
        },
      },
    });
  }

  private async uploadBuffer(
    path: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    // This is a placeholder - implement actual upload logic
    // Should use the StorageService
    return `https://storage.example.com/${path}/${filename}`;
  }
}
