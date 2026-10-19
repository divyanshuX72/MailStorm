/**
 * OpenRouter Service — LLM API Client
 * Sends commands to OpenRouter and receives structured JSON responses
 */

import { env } from '../config/env';
import { buildSystemPrompt } from './prompt.service';
import { parseAIResponse, ParseResult } from './command.parser';
import logger from '../utils/logger';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

/**
 * Call the OpenRouter API with a user command and parse the response.
 * Retries once if the first response is invalid JSON.
 */
export async function processCommand(
  userId: string,
  userCommand: string
): Promise<ParseResult> {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'OpenRouter API key is not configured. Add OPENROUTER_API_KEY to your .env file.' };
  }

  const model = env.OPENROUTER_MODEL || 'openrouter/auto';

  // Build system prompt with dynamic context
  const systemPrompt = await buildSystemPrompt(userId);

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userCommand },
  ];

  // Attempt up to 2 times (initial + 1 retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const rawContent = await callOpenRouter(model, messages, apiKey);

      if (!rawContent) {
        if (attempt === 0) {
          logger.warn('Empty response from OpenRouter, retrying...');
          // Add a retry hint to messages
          messages.push(
            { role: 'assistant', content: '' },
            { role: 'user', content: 'Please return ONLY valid JSON as instructed.' }
          );
          continue;
        }
        return { success: false, error: 'Unable to understand command. The AI returned an empty response.' };
      }

      const result = parseAIResponse(rawContent);

      if (!result.success && attempt === 0) {
        logger.warn(`AI returned invalid response, retrying. Error: ${result.error}`);
        // Add retry context
        messages.push(
          { role: 'assistant', content: rawContent },
          { role: 'user', content: 'That was not valid JSON. Please return ONLY a valid JSON object as instructed. No explanation, no markdown.' }
        );
        continue;
      }

      return result;
    } catch (error: any) {
      logger.error(`OpenRouter API call failed (attempt ${attempt + 1})`, { error: error.message });

      if (attempt === 0) continue;

      return {
        success: false,
        error: `AI service error: ${error.message}`,
      };
    }
  }

  return { success: false, error: 'Unable to understand command. Please try rephrasing.' };
}

/**
 * Make the actual HTTP call to OpenRouter API.
 */
async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  apiKey: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Email Campaign AI Command',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1, // Low temperature for consistent structured output
        max_tokens: 256,
        top_p: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenRouter API returned ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (data.error) {
      throw new Error(data.error.message || 'Unknown OpenRouter error');
    }

    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }

    throw error;
  }
}
