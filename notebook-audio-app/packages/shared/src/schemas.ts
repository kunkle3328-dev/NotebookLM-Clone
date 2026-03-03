import { z } from 'zod';

// Enums
export const SourceType = z.enum(['pdf', 'audio', 'image', 'website', 'youtube', 'copied_text']);
export const GenerationType = z.enum(['audio_overview', 'video_overview', 'flashcards', 'quiz', 'infographic', 'slide_deck']);
export const AudienceType = z.enum(['general', 'student', 'exec', 'technical']);
export const LengthType = z.enum(['short', 'medium', 'long']);
export const ToneType = z.enum(['neutral', 'lively', 'serious']);

// Project Schema
export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Source Schema
export const SourceSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: SourceType,
  title: z.string(),
  url: z.string().optional(),
  content: z.string().optional(),
  extractedText: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Message Schema
export const MessageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  usedSourceIds: z.array(z.string()).optional(),
  citations: z.array(z.object({
    sourceId: z.string(),
    text: z.string(),
    page: z.number().optional(),
  })).optional(),
  createdAt: z.date(),
});

// Generation Settings Schema
export const GenerationSettingsSchema = z.object({
  audience: AudienceType.default('general'),
  length: LengthType.default('medium'),
  tone: ToneType.default('neutral'),
  useAllSources: z.boolean().default(true),
  customInstructions: z.string().optional(),
  selectedSourceIds: z.array(z.string()).optional(),
});

// Generation Schema
export const GenerationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: GenerationType,
  title: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  settings: GenerationSettingsSchema,
  result: z.any().optional(),
  assets: z.object({
    audioUrl: z.string().optional(),
    transcriptUrl: z.string().optional(),
    waveformUrl: z.string().optional(),
    videoUrl: z.string().optional(),
  }).optional(),
  metadata: z.object({
    duration: z.number().optional(),
    sourceCount: z.number(),
    wordCount: z.number().optional(),
  }),
  rating: z.object({
    liked: z.boolean().optional(),
    feedback: z.string().optional(),
  }).optional(),
  parentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Dialogue Script Line Schema
export const DialogueLineSchema = z.object({
  spk: z.enum(['A', 'B']),
  text: z.string(),
  style: z.object({
    pace: z.enum(['slow', 'normal', 'fast']).optional(),
    energy: z.number().min(0).max(1).optional(),
    pauseBeforeMs: z.number().optional(),
    backchannel: z.boolean().optional(),
    emphasis: z.array(z.string()).optional(),
  }).optional(),
});

// Web Search Result Schema
export const WebSearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  site: z.string(),
  favicon: z.string().optional(),
});

// Chat Request/Response Schemas
export const ChatRequestSchema = z.object({
  projectId: z.string(),
  message: z.string(),
  selectedSourceIds: z.array(z.string()).optional(),
});

export const ChatResponseSchema = z.object({
  reply: z.string(),
  usedSourceIds: z.array(z.string()),
  citations: z.array(z.object({
    sourceId: z.string(),
    text: z.string(),
    page: z.number().optional(),
  })).optional(),
});

// Types
export type SourceType = z.infer<typeof SourceType>;
export type GenerationType = z.infer<typeof GenerationType>;
export type AudienceType = z.infer<typeof AudienceType>;
export type LengthType = z.infer<typeof LengthType>;
export type ToneType = z.infer<typeof ToneType>;
export type Project = z.infer<typeof ProjectSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type GenerationSettings = z.infer<typeof GenerationSettingsSchema>;
export type Generation = z.infer<typeof GenerationSchema>;
export type DialogueLine = z.infer<typeof DialogueLineSchema>;
export type WebSearchResult = z.infer<typeof WebSearchResultSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
