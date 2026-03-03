import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from '../storage/storage.service';
import { DialogueLine, TTSVoice, TTSOptions } from '@notebook/shared';

// TTS Provider Interface
interface TTSProvider {
  synthesize(text: string, options: TTSOptions): Promise<Buffer>;
  getVoices(): TTSVoice[];
}

// OpenAI TTS Provider
class OpenAITTSProvider implements TTSProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async synthesize(text: string, options: TTSOptions): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: options.voiceId as any,
      input: text,
      speed: options.speed || 1.0,
      response_format: 'mp3',
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'alloy', name: 'Alloy', gender: 'neutral', language: 'en' },
      { id: 'echo', name: 'Echo', gender: 'male', language: 'en' },
      { id: 'fable', name: 'Fable', gender: 'male', language: 'en' },
      { id: 'onyx', name: 'Onyx', gender: 'male', language: 'en' },
      { id: 'nova', name: 'Nova', gender: 'female', language: 'en' },
      { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'en' },
    ];
  }
}

// ElevenLabs TTS Provider (placeholder - implement if needed)
class ElevenLabsTTSProvider implements TTSProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesize(text: string, options: TTSOptions): Promise<Buffer> {
    // TODO: Implement ElevenLabs API integration
    // For now, return empty buffer - should fall back to OpenAI
    return Buffer.from([]);
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', language: 'en' },
      { id: 'XB0fDUnXU5powFXDhCwa', name: 'Rachel', gender: 'female', language: 'en' },
    ];
  }
}

// Azure TTS Provider (placeholder - implement if needed)
class AzureTTSProvider implements TTSProvider {
  private subscriptionKey: string;
  private region: string;

  constructor(subscriptionKey: string, region: string = 'eastus') {
    this.subscriptionKey = subscriptionKey;
    this.region = region;
  }

  async synthesize(text: string, options: TTSOptions): Promise<Buffer> {
    // TODO: Implement Azure TTS API integration
    return Buffer.from([]);
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male', language: 'en-US' },
      { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', language: 'en-US' },
    ];
  }
}

// Piper TTS Provider (local/open source fallback)
class PiperTTSProvider implements TTSProvider {
  private modelPath: string;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  async synthesize(text: string, options: TTSOptions): Promise<Buffer> {
    // TODO: Implement Piper TTS integration
    // This would spawn a subprocess to run Piper
    return Buffer.from([]);
  }

  getVoices(): TTSVoice[] {
    return [
      { id: 'en_US-lessac-medium', name: 'Lessac', gender: 'neutral', language: 'en-US' },
      { id: 'en_US-ryan-medium', name: 'Ryan', gender: 'male', language: 'en-US' },
    ];
  }
}

@Injectable()
export class TtsService {
  private providers: Map<string, TTSProvider> = new Map();
  private defaultProvider: string;

  constructor(
    private config: ConfigService,
    private storage: StorageService,
  ) {
    // Initialize providers
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.providers.set('openai', new OpenAITTSProvider(openaiKey));
    }

    const elevenlabsKey = this.config.get<string>('ELEVENLABS_API_KEY');
    if (elevenlabsKey) {
      this.providers.set('elevenlabs', new ElevenLabsTTSProvider(elevenlabsKey));
    }

    const azureKey = this.config.get<string>('AZURE_SPEECH_KEY');
    if (azureKey) {
      const azureRegion = this.config.get<string>('AZURE_SPEECH_REGION', 'eastus');
      this.providers.set('azure', new AzureTTSProvider(azureKey, azureRegion));
    }

    const piperPath = this.config.get<string>('PIPER_MODEL_PATH');
    if (piperPath) {
      this.providers.set('piper', new PiperTTSProvider(piperPath));
    }

    this.defaultProvider = this.config.get<string>('TTS_DEFAULT_PROVIDER', 'openai');
  }

  async synthesizeDialogue(
    dialogue: DialogueLine[],
    projectId: string,
    generationId: string,
    voiceA: string = 'nova',
    voiceB: string = 'echo',
  ): Promise<{ audioUrl: string; waveformUrl: string; duration: number }> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`TTS provider ${this.defaultProvider} not available`);
    }

    // Synthesize each line
    const audioBuffers: Buffer[] = [];
    let totalDuration = 0;

    for (const line of dialogue) {
      const voiceId = line.spk === 'A' ? voiceA : voiceB;
      const options: TTSOptions = {
        voiceId,
        speed: line.style?.pace === 'fast' ? 1.1 : line.style?.pace === 'slow' ? 0.9 : 1.0,
      };

      try {
        const buffer = await provider.synthesize(line.text, options);
        audioBuffers.push(buffer);
        // Estimate duration (rough approximation)
        totalDuration += (line.text.split(' ').length / 150) * 60; // ~150 WPM
      } catch (error) {
        console.error(`TTS failed for line: ${line.text}`, error);
      }
    }

    // Concatenate audio buffers
    const concatenated = Buffer.concat(audioBuffers);

    // Upload audio file
    const audioFileName = `${generationId}.mp3`;
    const audioUrl = await this.storage.uploadFile(
      `projects/${projectId}/generations`,
      audioFileName,
      concatenated,
      'audio/mpeg',
    );

    // Generate waveform data
    const waveform = this.generateWaveform(concatenated);
    const waveformBuffer = Buffer.from(JSON.stringify(waveform));
    const waveformFileName = `${generationId}_waveform.json`;
    const waveformUrl = await this.storage.uploadFile(
      `projects/${projectId}/generations`,
      waveformFileName,
      waveformBuffer,
      'application/json',
    );

    return {
      audioUrl,
      waveformUrl,
      duration: Math.round(totalDuration),
    };
  }

  async synthesizeSingle(
    text: string,
    options: TTSOptions,
  ): Promise<Buffer> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`TTS provider ${this.defaultProvider} not available`);
    }

    return provider.synthesize(text, options);
  }

  getAvailableVoices(): TTSVoice[] {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      return [];
    }
    return provider.getVoices();
  }

  private generateWaveform(audioBuffer: Buffer): number[] {
    // Simple waveform generation
    const buckets = 1000;
    const samplesPerBucket = Math.floor(audioBuffer.length / buckets);
    const waveform: number[] = [];

    for (let i = 0; i < buckets; i++) {
      let sum = 0;
      const start = i * samplesPerBucket;
      for (let j = 0; j < samplesPerBucket && start + j < audioBuffer.length; j += 2) {
        const sample = audioBuffer.readInt16LE(start + j) || 0;
        sum += Math.abs(sample);
      }
      waveform.push(sum / (samplesPerBucket / 2) / 32768);
    }

    // Normalize
    const max = Math.max(...waveform, 0.001);
    return waveform.map(v => v / max);
  }
}
