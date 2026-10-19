#!/usr/bin/env node

/**
 * Atreal CSO — Universal Agent CLI
 * Entry point for the `agent` command
 * 
 * Usage:
 *   agent              — Launch interactive REPL
 *   agent --version    — Show version
 *   agent --help       — Show help
 */

import { App } from '../core/app';
import { renderer, colors } from '../core/renderer';

// Handle --version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('agent v1.0.0');
  process.exit(0);
}

// Handle --help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('');
  console.log(colors.primary.bold('  Atreal CSO — Universal Agent CLI'));
  console.log('');
  console.log('  Usage:');
  console.log('    agent              Launch interactive REPL');
  console.log('    agent --version    Show version');
  console.log('    agent --help       Show this help');
  console.log('');
  console.log('  Environment:');
  console.log('    AGENT_API_URL      Backend API URL (default: http://localhost:5000)');
  console.log('');
  console.log('  Interactive Commands:');
  console.log('    /help              Show available commands');
  console.log('    /email             Switch to Email Agent');
  console.log('    /main              Switch to Main Agent');
  console.log('    /lead              Switch to Lead Agent');
  console.log('    /crm               Switch to CRM Agent');
  console.log('    /proposal          Switch to Proposal Agent');
  console.log('    /research          Switch to Research Agent');
  console.log('    /meeting           Switch to Meeting Agent');
  console.log('    /analytics         Switch to Analytics Agent');
  console.log('    /settings          View settings');
  console.log('    /logout            Sign out');
  console.log('    /exit              Exit the CLI');
  console.log('');
  process.exit(0);
}

// Launch the app
async function main(): Promise<void> {
  try {
    const app = new App();
    await app.start();
  } catch (error: any) {
    renderer.blank();
    renderer.errorBox(
      error.message || 'An unexpected error occurred',
      'Fatal Error'
    );
    renderer.blank();
    process.exit(1);
  }
}

main();
