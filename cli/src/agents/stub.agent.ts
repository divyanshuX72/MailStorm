/**
 * CLI — Stub Agent Handler
 * Generic handler for agents that are "coming_soon".
 * Displays proper messaging and available command previews.
 */

import { BaseAgent } from './base-agent';
import { renderer, colors } from '../core/renderer';

export class StubAgent extends BaseAgent {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }

  async handleCommand(input: string): Promise<boolean> {
    const trimmed = input.trim().toLowerCase();

    if (trimmed === '/back' || trimmed === '/b') return false;
    if (trimmed === '/help' || trimmed === '/h') { await this.showHelp(); return true; }
    if (trimmed === '/status') { await this.showStatus(); return true; }
    if (trimmed === '/history') { await this.showHistory(); return true; }

    // Any other input → show coming soon message
    await this.showComingSoon();
    return true;
  }

  private async showComingSoon(): Promise<void> {
    const manifest = await this.loadManifest();
    const icon = manifest?.icon || '🔧';

    renderer.blank();
    renderer.box(
      [
        `${icon} ${this.name}`,
        '',
        colors.warning('This agent is currently under development.'),
        colors.muted('It will be available in a future release.'),
        '',
        colors.muted('Available commands will include:'),
        ...(manifest?.commands || []).map((c) =>
          `  ${colors.primary(c.name.padEnd(16))} ${c.description}`
        ),
      ].join('\n'),
      'Coming Soon'
    );
    renderer.blank();
  }
}

// Pre-configured stub agents
export const leadAgent = new StubAgent('lead', 'Lead Agent');
export const crmAgent = new StubAgent('crm', 'CRM Agent');
export const proposalAgent = new StubAgent('proposal', 'Proposal Agent');
export const researchAgent = new StubAgent('research', 'Research Agent');
export const meetingAgent = new StubAgent('meeting', 'Meeting Agent');
export const analyticsAgent = new StubAgent('analytics', 'Analytics Agent');
