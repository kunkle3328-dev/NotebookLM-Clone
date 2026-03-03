// Additional shared types that don't need zod validation

export interface AudioSegment {
  id: string;
  generationId: string;
  lineIndex: number;
  speaker: 'A' | 'B';
  text: string;
  audioUrl: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface WaveformData {
  buckets: number[];
  sampleRate: number;
  duration: number;
}

export interface Chunk {
  id: string;
  sourceId: string;
  text: string;
  index: number;
  embedding?: number[];
  metadata?: {
    page?: number;
    startTime?: number;
    endTime?: number;
  };
}

export interface RAGContext {
  chunks: Chunk[];
  sources: string[];
  relevanceScores: number[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceId?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourceId?: string;
}

export interface InfographicSection {
  title: string;
  content: string;
  icon?: string;
  color?: string;
}

export interface InfographicData {
  title: string;
  subtitle: string;
  sections: InfographicSection[];
  sources: string[];
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  bulletPoints: string[];
  imageUrl?: string;
  layout: 'title' | 'content' | 'split' | 'image';
}

export interface SlideDeckData {
  title: string;
  slides: Slide[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export interface VideoScene {
  id: string;
  duration: number;
  visual: string;
  narration: string;
  audioSegmentId?: string;
}

export interface VideoOverviewData {
  title: string;
  scenes: VideoScene[];
  totalDuration: number;
  backgroundMusic?: string;
}

export interface TTSVoice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  previewUrl?: string;
}

export interface TTSOptions {
  voiceId: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  expressiveness?: number;
}

export interface Template {
  id: string;
  projectId: string;
  generationType: string;
  name: string;
  instructions: string;
  systemPrompt: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
