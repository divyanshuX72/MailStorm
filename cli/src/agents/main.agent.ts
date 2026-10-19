/**
 * CLI — Main Agent Handler
 * Orchestrator agent that delegates to specialized agents
 */

import inquirer from 'inquirer';
import { BaseAgent } from './base-agent';
import { api } from '../core/api-client';
import { renderer, colors } from '../core/renderer';

export class MainAgent extends BaseAgent {
  id = 'main';
  name = 'Main Agent';

  async handleCommand(input: string): Promise<boolean> {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    if (lower === '/back' || lower === '/b') return false;
    if (lower === '/help' || lower === '/h') { await this.showHelp(); return true; }
    if (lower === '/status') { await this.showAgentStatuses(); return true; }
    if (lower === '/history') { await this.showHistory(); return true; }
    if (lower.startsWith('/plan')) { await this.handlePlan(trimmed.substring(5).trim()); return true; }
    if (lower.startsWith('/delegate')) { await this.handleDelegate(trimmed.substring(9).trim()); return true; }
    if (lower.startsWith('/decide')) { await this.handleDecide(trimmed.substring(7).trim()); return true; }

    // Natural language
    if (trimmed.length > 0) {
      const spinner = renderer.spinner('Processing...');
      const result = await this.executeNL(trimmed);
      spinner.stop();
      this.displayResult(result);
      return true;
    }

    return true;
  }

  /**
   * Show all agent statuses
   */
  private async showAgentStatuses(): Promise<void> {
    const spinner = renderer.spinner('Loading agent statuses...');
    try {
      const response = await api.get('/agents/main/status');
      spinner.stop();

      if (response.success && response.data?.agents) {
        renderer.section('🧠 Agent Status Dashboard');

        const rows = response.data.agents.map((a: any) => {
          const statsStr = Object.entries(a.stats || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || '—';

          return [
            `${a.icon} ${a.name}`,
            renderer.agentStatus(a.status),
            `v${a.version}`,
            String(a.commandCount),
            statsStr.substring(0, 35),
          ];
        });

        renderer.table(['Agent', 'Status', 'Version', 'Commands', 'Stats'], rows);
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  /**
   * Handle /plan command
   */
  private async handlePlan(description: string): Promise<void> {
    if (!description) {
      const { planDesc } = await inquirer.prompt([{
        type: 'input',
        name: 'planDesc',
        message: 'Describe your plan:',
        validate: (input: string) => input.length > 0 || 'Please enter a plan description',
      }]);
      description = planDesc;
    }

    const spinner = renderer.spinner('Creating plan...');
    const result = await this.executeAction('plan', { description });
    spinner.stop();
    this.displayResult(result);

    if (result.success && result.data?.steps) {
      renderer.section('Plan Steps');
      result.data.steps.forEach((step: any) => {
        console.log(`  ${colors.muted(`${step.step}.`)} ${step.description}  ${renderer.statusBadge(step.status)}`);
      });
      console.log('');
    }
  }

  /**
   * Handle /delegate command
   */
  private async handleDelegate(rawInput: string): Promise<void> {
    const spinner = renderer.spinner('Loading agents...');
    let agents;
    try {
      const response = await api.get('/agents');
      spinner.stop();
      agents = response.data?.agents?.filter((a: any) => a.status === 'active') || [];
    } catch (error: any) {
      spinner.fail(error.message);
      return;
    }

    if (agents.length === 0) { renderer.error('No active agents available.'); return; }

    const { targetAgent } = await inquirer.prompt([{
      type: 'list',
      name: 'targetAgent',
      message: 'Delegate to which agent?',
      choices: agents.map((a: any) => ({
        name: `${a.icon} ${a.name}`,
        value: a.id,
        short: a.name,
      })),
    }]);

    let task = rawInput;
    if (!task) {
      const { taskDesc } = await inquirer.prompt([{
        type: 'input',
        name: 'taskDesc',
        message: 'Task description:',
        validate: (input: string) => input.length > 0 || 'Please enter a task',
      }]);
      task = taskDesc;
    }

    const execSpinner = renderer.spinner('Delegating...');
    const result = await this.executeAction('delegate', { agent: targetAgent, task });
    execSpinner.stop();
    this.displayResult(result);
  }

  /**
   * Handle /decide command
   */
  private async handleDecide(question: string): Promise<void> {
    if (!question) {
      const { decideQ } = await inquirer.prompt([{
        type: 'input',
        name: 'decideQ',
        message: 'What decision do you need help with?',
        validate: (input: string) => input.length > 0 || 'Please enter a question',
      }]);
      question = decideQ;
    }

    const spinner = renderer.spinner('Analyzing...');
    const result = await this.executeNL(`Decide: ${question}`);
    spinner.stop();
    this.displayResult(result);
  }
}
