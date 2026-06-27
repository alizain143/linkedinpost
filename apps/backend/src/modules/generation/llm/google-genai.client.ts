import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GoogleGenAIClientFactory {
  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('google.apiKey')?.trim();
    const project = this.configService.get<string>('google.cloudProject')?.trim();
    return Boolean(apiKey) || Boolean(project);
  }

  createClient(): GoogleGenAI {
    const apiKey = this.configService.get<string>('google.apiKey')?.trim();
    if (apiKey) {
      return new GoogleGenAI({ apiKey });
    }

    const project = this.configService.get<string>('google.cloudProject')?.trim();
    if (project) {
      return new GoogleGenAI({
        vertexai: true,
        project,
        location:
          this.configService.get<string>('google.cloudLocation') ??
          'us-central1',
      });
    }

    throw new Error('Google GenAI is not configured');
  }
}
