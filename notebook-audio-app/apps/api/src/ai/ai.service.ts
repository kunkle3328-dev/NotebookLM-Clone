import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import OpenAI from 'openai';
import { Chunk, DialogueLine, Flashcard, QuizQuestion, InfographicData, SlideDeckData, VideoOverviewData } from '@notebook/shared';
import * as pdfParse from 'pdf-parse';
import axios from 'axios';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  // Text Extraction
  async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return '';
    }
  }

  async extractYoutubeTranscript(videoId: string): Promise<string> {
    // TODO: Implement YouTube transcript extraction
    // This could use youtube-transcript library or similar
    return '';
  }

  // Text Chunking
  chunkText(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.substring(start, end);
      
      // Try to end at a sentence boundary
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > chunkSize * 0.5) {
          chunk = chunk.substring(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start += chunk.length - overlap;
    }

    return chunks;
  }

  // RAG - Retrieve relevant chunks
  async retrieveRelevantChunks(
    projectId: string,
    query: string,
    topK: number = 5,
    sourceIds?: string[],
  ): Promise<Chunk[]> {
    // Get query embedding
    const queryEmbedding = await this.getEmbedding(query);

    // Get all chunks for the project
    const whereClause: any = { projectId };
    if (sourceIds && sourceIds.length > 0) {
      whereClause.sourceId = { in: sourceIds };
    }

    const chunks = await this.prisma.chunk.findMany({
      where: whereClause,
    });

    // Calculate similarity scores
    const scoredChunks = chunks.map(chunk => {
      const chunkEmbedding = chunk.embedding as number[];
      if (!chunkEmbedding) return { chunk, score: 0 };
      
      const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { chunk, score };
    });

    // Sort by score and return top K
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK).map(sc => ({
      id: sc.chunk.id,
      sourceId: sc.chunk.sourceId,
      text: sc.chunk.text,
      index: sc.chunk.index,
      metadata: sc.chunk.metadata as any,
    }));
  }

  async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
    });
    return response.data[0].embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Chat Response Generation
  async generateChatResponse(
    message: string,
    contextChunks: Chunk[],
    history: { role: string; content: string }[],
  ): Promise<string> {
    const context = contextChunks.map(c => c.text).join('\n\n');
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful assistant answering questions based on the provided sources. 
If the answer is not in the sources, say "I don't have enough information from the sources to answer that."
Be concise and accurate. Cite sources when possible.`,
      },
      ...history.slice(-5).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      {
        role: 'user',
        content: `Context from sources:\n${context}\n\nQuestion: ${message}`,
      },
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || 'I apologize, but I could not generate a response.';
  }

  // Dialogue Script Generation
  async generateDialogueScript(
    sources: string,
    settings: { audience: string; length: string; tone: string },
  ): Promise<DialogueLine[]> {
    const lengthMap = { short: '3-5 minutes', medium: '8-12 minutes', long: '15-20 minutes' };
    const targetLength = lengthMap[settings.length] || '8-12 minutes';

    const prompt = `Create a natural, engaging dialogue between two podcast hosts (Host A and Host B) discussing the following content.

Settings:
- Audience: ${settings.audience}
- Target Length: ${targetLength}
- Tone: ${settings.tone}

Content to discuss:
${sources.substring(0, 10000)}

Generate the dialogue as a JSON array of lines. Each line should have:
- spk: "A" or "B" (which host is speaking)
- text: the spoken line (1-3 sentences, conversational)
- style: optional styling hints

Rules:
- Keep lines short and conversational
- Hosts should interrupt each other naturally with backchannels
- Include clarifying questions
- If information is unclear, hosts should acknowledge it
- No long monologues

Output format: [{"spk": "A", "text": "...", "style": {...}}, ...]`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert podcast script writer. Create engaging, natural-sounding dialogue.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    try {
      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      return parsed.dialogue || parsed.lines || [];
    } catch (error) {
      console.error('Failed to parse dialogue script:', error);
      return [];
    }
  }

  // Flashcard Generation
  async generateFlashcards(sources: string, count: number = 10): Promise<Flashcard[]> {
    const prompt = `Generate ${count} study flashcards from the following content. Each flashcard should have a question and answer.

Content:
${sources.substring(0, 15000)}

Output as JSON array: [{"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}]`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    try {
      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      return parsed.flashcards || [];
    } catch (error) {
      console.error('Failed to parse flashcards:', error);
      return [];
    }
  }

  // Quiz Generation
  async generateQuiz(sources: string, questionCount: number = 10): Promise<QuizQuestion[]> {
    const prompt = `Generate a ${questionCount}-question multiple choice quiz from the following content.

Content:
${sources.substring(0, 15000)}

Output as JSON array: [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0, "explanation": "..."}]`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    try {
      const content = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      return parsed.questions || parsed.quiz || [];
    } catch (error) {
      console.error('Failed to parse quiz:', error);
      return [];
    }
  }

  // Infographic Generation
  async generateInfographic(sources: string): Promise<InfographicData> {
    const prompt = `Create an infographic structure from the following content. Organize into sections with titles, content, and visual suggestions.

Content:
${sources.substring(0, 15000)}

Output as JSON: {"title": "...", "subtitle": "...", "sections": [{"title": "...", "content": "...", "icon": "...", "color": "..."}], "sources": ["..."]}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    try {
      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse infographic:', error);
      return { title: 'Infographic', subtitle: '', sections: [], sources: [] };
    }
  }

  // Slide Deck Generation
  async generateSlideDeck(sources: string, slideCount: number = 10): Promise<SlideDeckData> {
    const prompt = `Create a ${slideCount}-slide presentation from the following content.

Content:
${sources.substring(0, 15000)}

Output as JSON: {"title": "...", "slides": [{"id": "1", "title": "...", "content": "...", "bulletPoints": ["..."], "layout": "title|content|split|image"}], "theme": {"primaryColor": "#3B5BFF", "secondaryColor": "#3CFF8F", "fontFamily": "Inter"}}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    try {
      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse slide deck:', error);
      return { title: 'Presentation', slides: [], theme: { primaryColor: '#3B5BFF', secondaryColor: '#3CFF8F', fontFamily: 'Inter' } };
    }
  }

  // Video Overview Generation
  async generateVideoOverview(
    sources: string,
    settings: { audience: string; length: string; tone: string },
  ): Promise<VideoOverviewData> {
    const lengthMap = { short: 3, medium: 8, long: 15 };
    const targetMinutes = lengthMap[settings.length] || 8;
    const sceneCount = Math.ceil(targetMinutes / 2);

    const prompt = `Create a video storyboard with narration from the following content. Divide into ${sceneCount} scenes.

Content:
${sources.substring(0, 15000)}

Output as JSON: {"title": "...", "scenes": [{"id": "1", "duration": 120, "visual": "Description of visuals", "narration": "Narration text"}], "totalDuration": ${targetMinutes * 60}}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    try {
      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse video overview:', error);
      return { title: 'Video Overview', scenes: [], totalDuration: targetMinutes * 60 };
    }
  }

  // Generate waveform data
  generateWaveform(audioBuffer: Buffer): number[] {
    // Simple waveform generation - in production, use a proper audio analysis library
    const buckets = 1000;
    const samplesPerBucket = Math.floor(audioBuffer.length / buckets);
    const waveform: number[] = [];

    for (let i = 0; i < buckets; i++) {
      let sum = 0;
      const start = i * samplesPerBucket;
      for (let j = 0; j < samplesPerBucket; j += 2) {
        const sample = audioBuffer.readInt16LE(start + j) || 0;
        sum += Math.abs(sample);
      }
      waveform.push(sum / (samplesPerBucket / 2) / 32768);
    }

    // Normalize
    const max = Math.max(...waveform);
    return waveform.map(v => v / max);
  }
}
