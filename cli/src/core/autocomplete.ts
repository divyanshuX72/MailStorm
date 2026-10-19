/**
 * CLI — Autocomplete Engine
 * Provides fuzzy autocomplete for commands, agent names, and dynamic data
 */

import fuzzy from 'fuzzy';
import { clientAgentRegistry } from '../agents/registry';
import { BaseAgent } from '../agents/base-agent';

// Static command completions
const ROOT_COMMANDS = [
  '/help', '/main', '/email', '/lead', '/crm', '/proposal',
  '/research', '/meeting', '/analytics', '/history', '/settings',
  '/logout', '/exit', '/quit',
];

export class AutocompleteEngine {
  private currentAgent: BaseAgent | null = null;
  private dynamicCache: Map<string, { data: string[]; timestamp: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds

  /**
   * Set the current agent context (for context-aware completions)
   */
  setContext(agent: BaseAgent | null): void {
    this.currentAgent = agent;
  }

  /**
   * Get completions for a partial input
   */
  async complete(partial: string): Promise<string[]> {
    if (!partial || partial.length === 0) return [];

    const lower = partial.toLowerCase();

    // If starts with '/', complete commands
    if (partial.startsWith('/')) {
      return this.completeCommands(lower);
    }

    // Otherwise, try to complete against dynamic data (templates, groups, etc.)
    if (this.currentAgent) {
      return this.completeDynamic(partial);
    }

    return [];
  }

  /**
   * Complete command names
   */
  private completeCommands(partial: string): string[] {
    let candidates: string[];

    if (this.currentAgent) {
      // Get agent-specific commands
      const manifest = (this.currentAgent as any).manifest;
      if (manifest?.commands) {
        candidates = manifest.commands.flatMap((c: any) => {
          const names = [c.name];
          if (c.aliases) names.push(...c.aliases);
          return names;
        });
      } else {
        candidates = ['/help', '/status', '/history', '/back'];
      }
    } else {
      candidates = ROOT_COMMANDS;
    }

    const results = fuzzy.filter(partial, candidates);
    return results.map((r) => r.string);
  }

  /**
   * Complete against dynamic data from the current agent
   */
  private async completeDynamic(partial: string): Promise<string[]> {
    if (!this.currentAgent) return [];

    try {
      const suggestions = await this.currentAgent.getAutocomplete(partial);
      return suggestions;
    } catch {
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.dynamicCache.clear();
  }
}

export const autocomplete = new AutocompleteEngine();
