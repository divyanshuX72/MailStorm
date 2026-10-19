/**
 * CLI — Base Agent Handler
 * Abstract base class that all agent handlers extend.
 * Provides common functionality for command routing and API interaction.
 */

import { api } from '../core/api-client';
import { renderer, colors } from '../core/renderer';
import { AgentManifest, AgentExecuteResult } from '../core/types';

export abstract class BaseAgent {
  abstract id: string;
  abstract name: string;

  protected manifest: AgentManifest | null = null;

  /**
   * Load the full agent manifest (with commands) from the API
   */
  async loadManifest(): Promise<AgentManifest | null> {
    if (this.manifest) return this.manifest;

    try {
      const response = await api.get(`/agents/${this.id}`);
      if (response.success && response.data) {
        this.manifest = response.data;
        return this.manifest;
      }
    } catch {
      // Silent fail
    }
    return null;
  }

  /**
   * Display the agent's help (available commands)
   */
  async showHelp(): Promise<void> {
    const manifest = await this.loadManifest();
    if (!manifest) {
      renderer.error(`Could not load help for ${this.name}`);
      return;
    }

    renderer.section(`${manifest.icon || '🤖'} ${manifest.name}`);
    console.log(`  ${manifest.description}`);
    console.log('');

    if (manifest.commands && manifest.commands.length > 0) {
      renderer.commandHelp(manifest.commands);
    }

    console.log('');
    renderer.muted('Type any text to send a natural language command.');
    console.log('');
  }

  /**
   * Execute a structured command via the agent API
   */
  async executeAction(action: string, params: Record<string, any> = {}): Promise<AgentExecuteResult> {
    try {
      const response = await api.post(`/agents/${this.id}/execute`, { action, params });
      return response.data || { success: false, message: 'No response data' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Execution failed',
        error: error.message,
      };
    }
  }

  /**
   * Execute a natural language command via the agent API
   */
  async executeNL(command: string): Promise<AgentExecuteResult> {
    try {
      const response = await api.post(`/agents/${this.id}/execute`, { command });
      return response.data || { success: false, message: 'No response data' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Execution failed',
        error: error.message,
      };
    }
  }

  /**
   * Display an execution result
   */
  displayResult(result: AgentExecuteResult): void {
    if (result.success) {
      renderer.successBox(result.message, 'Execution Complete');
    } else {
      renderer.errorBox(result.error || result.message, 'Execution Failed');
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(partial: string, context?: string): Promise<string[]> {
    try {
      const params = new URLSearchParams({ q: partial });
      if (context) params.append('context', context);
      const response = await api.get(`/agents/${this.id}/autocomplete?${params}`);
      if (response.success && response.data?.suggestions) {
        return response.data.suggestions.map((s: any) => s.label);
      }
    } catch {
      // Silent fail
    }
    return [];
  }

  /**
   * Get agent history
   */
  async showHistory(): Promise<void> {
    const spinner = renderer.spinner('Loading history...');
    try {
      const response = await api.get(`/agents/${this.id}/history`);
      spinner.stop();

      if (response.success && response.data?.history?.length > 0) {
        renderer.section(`${this.name} — History`);
        const rows = response.data.history.map((h: any) => [
          h.command,
          renderer.statusBadge(h.result),
          h.message.substring(0, 40),
          new Date(h.timestamp).toLocaleString(),
        ]);
        renderer.table(['Command', 'Result', 'Message', 'Time'], rows);
      } else {
        spinner.stop();
        renderer.info('No history entries yet.');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  /**
   * Show agent status
   */
  async showStatus(): Promise<void> {
    const spinner = renderer.spinner('Loading status...');
    try {
      const response = await api.get(`/agents/${this.id}/status`);
      spinner.stop();

      if (response.success && response.data) {
        const data = response.data;
        renderer.section(`${data.icon || '🤖'} ${data.name || this.name}`);
        console.log(`  Status: ${renderer.agentStatus(data.status)}`);

        if (data.stats) {
          console.log('');
          const items = Object.entries(data.stats).map(([key, value]) => ({
            key: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value),
          }));
          renderer.keyValue(items);
        }

        if (data.message) {
          console.log('');
          renderer.info(data.message);
        }

        console.log('');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  /**
   * Handle a command input. Override in subclasses for custom behavior.
   * Returns false if the command is '/back' (signals exit from agent context).
   */
  abstract handleCommand(input: string): Promise<boolean>;
}
