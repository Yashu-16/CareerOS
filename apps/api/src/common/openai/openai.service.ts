import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Thin wrapper around the OpenAI SDK.
 * Centralizing this means: one place to swap models, one place to add
 * retry/backoff, and the API key never has to be referenced anywhere else
 * in the codebase.
 */
@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set. AI features (resume parsing, tailoring) will fail until it is configured.',
      );
    }
    this.client = new OpenAI({ apiKey: apiKey || 'missing-key' });
    this.model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o';
  }

  /**
   * Calls the model and forces a JSON object response.
   * Every AI feature in CareerOS (parsing, tailoring, scoring) goes through
   * this so the JSON-mode contract is enforced in one place.
   */
  async generateJson<T = Record<string, unknown>>(params: {
    system: string;
    user: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<T> {
    const { system, user, temperature = 0.2, maxTokens = 4000 } = params;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    try {
      return JSON.parse(content) as T;
    } catch (err) {
      this.logger.error(`Failed to parse OpenAI JSON response: ${content}`);
      throw new Error('OpenAI returned malformed JSON');
    }
  }

  async generateText(params: { system: string; user: string; temperature?: number; maxTokens?: number }): Promise<string> {
    const { system, user, temperature = 0.4, maxTokens = 2000 } = params;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    return completion.choices[0]?.message?.content ?? '';
  }
}
