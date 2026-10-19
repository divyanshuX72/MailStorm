/**
 * CLI — Main Application (REPL Loop)
 * The interactive command loop that routes input to agents.
 */

import readline from 'readline';
import { renderer, colors } from './renderer';
import { autocomplete } from './autocomplete';
import { commandHistory } from './history';
import { auth } from './auth';
import { configManager } from './config';
import { clientAgentRegistry } from '../agents/registry';
import { BaseAgent } from '../agents/base-agent';
import { EmailAgent } from '../agents/email.agent';
import { MainAgent } from '../agents/main.agent';
import { leadAgent, crmAgent, proposalAgent, researchAgent, meetingAgent, analyticsAgent } from '../agents/stub.agent';
import { showWelcome, showRootHelp, showSettings } from '../ui/welcome';
import { AgentManifest } from './types';

// Agent handler map
const agentHandlers = new Map<string, BaseAgent>([
  ['email', new EmailAgent()],
  ['main', new MainAgent()],
  ['lead', leadAgent],
  ['crm', crmAgent],
  ['proposal', proposalAgent],
  ['research', researchAgent],
  ['meeting', meetingAgent],
  ['analytics', analyticsAgent],
] as Array<[string, BaseAgent]>);

export class App {
  private rl: readline.Interface | null = null;
  private currentAgent: BaseAgent | null = null;
  private agents: AgentManifest[] = [];
  private running = true;

  /**
   * Start the CLI application
   */
  async start(): Promise<void> {
    // 1. Authenticate
    const authenticated = await auth.ensureAuthenticated();
    if (!authenticated) {
      renderer.error('Authentication failed. Exiting.');
      process.exit(1);
    }

    // 2. Discover agents
    const spinner = renderer.spinner('Discovering agents...');
    try {
      this.agents = await clientAgentRegistry.fetch();
      spinner.succeed(`${this.agents.length} agents discovered`);
    } catch (error: any) {
      spinner.fail(`Failed to discover agents: ${error.message}`);
      renderer.warning('Running in limited mode. Some features may be unavailable.');
      this.agents = [];
    }

    // 3. Show welcome banner
    showWelcome(this.agents);

    // 4. Start REPL
    this.startREPL();
  }

  /**
   * Start the interactive REPL loop
   */
  private startREPL(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      completer: (line: string, callback: (err: any, result: [string[], string]) => void) => {
        this.handleTabComplete(line).then((completions) => {
          callback(null, [completions, line]);
        });
      },
    });

    this.rl.prompt();

    this.rl.on('line', async (line: string) => {
      const input = line.trim();

      if (input.length > 0) {
        commandHistory.add(input);
        await this.handleInput(input);
      }

      if (this.running) {
        this.rl!.setPrompt(this.getPrompt());
        this.rl!.prompt();
      }
    });

    this.rl.on('close', () => {
      this.exit();
    });

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      if (this.currentAgent) {
        // Exit current agent context
        this.currentAgent = null;
        autocomplete.setContext(null);
        renderer.blank();
        renderer.info('Returned to root.');
        this.rl!.setPrompt(this.getPrompt());
        this.rl!.prompt();
      } else {
        renderer.blank();
        this.exit();
      }
    });
  }

  /**
   * Get the current prompt string
   */
  private getPrompt(): string {
    if (this.currentAgent) {
      const manifest = this.agents.find((a) => a.id === this.currentAgent!.id);
      const icon = manifest?.icon || '🤖';
      return colors.primary(`${icon} ${this.currentAgent.id}`) + colors.muted(' > ');
    }
    return colors.primary('atreal') + colors.muted(' > ');
  }

  /**
   * Handle user input
   */
  private async handleInput(input: string): Promise<void> {
    const lower = input.toLowerCase().trim();

    // If inside an agent context, delegate to the agent handler
    if (this.currentAgent) {
      try {
        const stayInAgent = await this.currentAgent.handleCommand(input);
        if (!stayInAgent) {
          // Agent returned false → exit agent context
          this.currentAgent = null;
          autocomplete.setContext(null);
          renderer.info('Returned to root.');
        }
      } catch (error: any) {
        renderer.error(error.message);
      }
      return;
    }

    // Root-level command routing
    if (lower === '/exit' || lower === '/quit') { this.exit(); return; }
    if (lower === '/help') { showRootHelp(this.agents); return; }
    if (lower === '/settings') { showSettings(); return; }
    if (lower === '/history') { this.showHistory(); return; }
    if (lower === '/logout') { await this.handleLogout(); return; }

    // Agent navigation: /email, /main, /lead, etc.
    if (lower.startsWith('/')) {
      const agentId = lower.substring(1).split(' ')[0];
      const handler = agentHandlers.get(agentId);

      if (handler) {
        this.currentAgent = handler;
        autocomplete.setContext(handler);

        const manifest = this.agents.find((a) => a.id === agentId);
        if (manifest) {
          renderer.blank();
          renderer.section(`${manifest.icon} ${manifest.name}`);
          console.log(`  ${manifest.description}`);
          console.log('');
          renderer.muted(`Type /help for commands, /back to return.`);
          renderer.blank();
        }
        return;
      }

      // Unknown command
      renderer.error(`Unknown command: ${input}. Type /help for available commands.`);
      return;
    }

    // Natural language at root level → send to main agent
    if (input.length > 0) {
      const mainHandler = agentHandlers.get('main');
      if (mainHandler) {
        try {
          const spinner = renderer.spinner('Processing...');
          const result = await mainHandler.executeNL(input);
          spinner.stop();
          mainHandler.displayResult(result);
        } catch (error: any) {
          renderer.error(error.message);
        }
      }
    }
  }

  /**
   * Handle tab completion
   */
  private async handleTabComplete(partial: string): Promise<string[]> {
    return autocomplete.complete(partial);
  }

  /**
   * Show command history
   */
  private showHistory(): void {
    const history = commandHistory.getRecent(15);
    if (history.length === 0) {
      renderer.info('No command history yet.');
      return;
    }

    renderer.section('Command History');
    history.forEach((cmd, i) => {
      console.log(`  ${colors.muted(`${i + 1}.`)} ${cmd}`);
    });
    console.log('');
  }

  /**
   * Handle logout
   */
  private async handleLogout(): Promise<void> {
    await auth.logout();
    renderer.info('Exiting...');
    process.exit(0);
  }

  /**
   * Clean exit
   */
  private exit(): void {
    this.running = false;
    renderer.blank();
    renderer.muted('Goodbye! 👋');
    renderer.blank();
    if (this.rl) {
      this.rl.close();
    }
    process.exit(0);
  }
}
