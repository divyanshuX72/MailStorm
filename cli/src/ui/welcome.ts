/**
 * CLI — Welcome Screen
 * Displays the startup banner with connection status, user info, and help hints
 */

import figlet from 'figlet';
import { renderer, colors } from '../core/renderer';
import { configManager } from '../core/config';
import { AgentManifest } from '../core/types';

/**
 * Display the welcome banner
 */
export function showWelcome(agents: AgentManifest[]): void {
  // ASCII Art Banner
  const banner = figlet.textSync('ATREAL', {
    font: 'Small',
    horizontalLayout: 'default',
  });

  console.log('');
  console.log(colors.primary(banner));
  console.log(colors.secondary.bold('  Universal Agent CLI') + colors.muted(' v1.0.0'));
  console.log('');

  // Connection & Session Info
  const user = configManager.getUser();
  const apiUrl = configManager.getApiUrl();
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const totalAgents = agents.length;

  renderer.keyValue([
    { key: 'Status', value: colors.success('● Connected') },
    { key: 'User', value: user ? `${user.name} (${user.email})` : colors.muted('Not logged in') },
    { key: 'Role', value: user?.role || colors.muted('—') },
    { key: 'API', value: colors.muted(apiUrl) },
    { key: 'Agents', value: `${activeAgents} active, ${totalAgents - activeAgents} coming soon` },
    { key: 'Environment', value: colors.muted('development') },
  ]);

  console.log('');
  renderer.muted('Type /help for commands, or type naturally to interact with agents.');
  renderer.muted('Press Tab for autocomplete. Type /exit to quit.');
  console.log('');
}

/**
 * Display agent list (used by /help and root prompt)
 */
export function showAgentList(agents: AgentManifest[]): void {
  renderer.section('Available Agents');

  const rows = agents.map((agent) => [
    `${agent.icon} ${agent.name}`,
    agent.description.substring(0, 50) + (agent.description.length > 50 ? '...' : ''),
    renderer.agentStatus(agent.status),
    `/${agent.id}`,
  ]);

  renderer.table(['Agent', 'Description', 'Status', 'Command'], rows);
}

/**
 * Display help for root commands
 */
export function showRootHelp(agents: AgentManifest[]): void {
  renderer.section('Agent Commands');
  agents.forEach((agent) => {
    const status = agent.status === 'active'
      ? colors.success('●')
      : colors.warning('○');
    console.log(`  ${status} ${colors.primary(`/${agent.id}`.padEnd(16))} ${agent.icon} ${agent.name}`);
  });

  renderer.section('System Commands');
  renderer.commandHelp([
    { name: '/help', description: 'Show this help message' },
    { name: '/history', description: 'View command history' },
    { name: '/settings', description: 'View current settings' },
    { name: '/logout', description: 'Sign out and clear credentials' },
    { name: '/exit', description: 'Exit the CLI', aliases: ['/quit', 'Ctrl+C'] },
  ]);

  console.log('');
  renderer.muted('Tip: Type any text to send a natural language command to the current agent.');
  console.log('');
}

/**
 * Display help for a specific agent
 */
export function showAgentHelp(agent: AgentManifest): void {
  renderer.section(`${agent.icon} ${agent.name}`);
  console.log(`  ${agent.description}`);
  console.log('');

  if (agent.commands && agent.commands.length > 0) {
    renderer.commandHelp(agent.commands);
  }

  console.log('');
  renderer.muted('Type any text to send a natural language command to this agent.');
  console.log('');
}

/**
 * Show settings
 */
export function showSettings(): void {
  const config = configManager.getAll();
  renderer.section('Settings');
  renderer.keyValue([
    { key: 'API URL', value: config.apiUrl },
    { key: 'User', value: config.user ? `${config.user.name} (${config.user.email})` : 'Not logged in' },
    { key: 'Theme', value: config.theme || 'dark' },
    { key: 'Config Path', value: configManager.getPath() },
    { key: 'Last Login', value: config.lastLogin || 'Never' },
  ]);
  console.log('');
}
