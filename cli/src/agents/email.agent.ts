/**
 * CLI — Email Agent Handler
 * Full interactive implementation with template/group/SMTP selection,
 * guided send flow, campaign management, and natural language support.
 */

import inquirer from 'inquirer';
import { BaseAgent } from './base-agent';
import { api } from '../core/api-client';
import { renderer, colors } from '../core/renderer';
import { EmailTemplate, ContactGroup, SmtpAccount, Campaign } from '../core/types';

export class EmailAgent extends BaseAgent {
  id = 'email';
  name = 'Email Agent';

  /**
   * Handle command input in the email agent context
   */
  async handleCommand(input: string): Promise<boolean> {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // Command routing
    if (lower === '/back' || lower === '/b') return false;
    if (lower === '/help' || lower === '/h') { await this.showHelp(); return true; }
    if (lower.startsWith('/template') || lower.startsWith('/t ') || lower === '/t') { await this.showTemplates(); return true; }
    if (lower.startsWith('/group') || lower.startsWith('/g ') || lower === '/g') { await this.showGroups(); return true; }
    if (lower.startsWith('/smtp') || lower.startsWith('/s ') || lower === '/s') { await this.showSmtp(); return true; }
    if (lower.startsWith('/campaign') || lower.startsWith('/c ') || lower === '/c') { await this.showCampaigns(); return true; }
    if (lower === '/send') { await this.interactiveSend(); return true; }
    if (lower === '/history') { await this.showHistory(); return true; }
    if (lower === '/status') { await this.showStatus(); return true; }

    // Check if input matches a template name → start interactive send flow
    const templateMatch = await this.matchTemplate(trimmed);
    if (templateMatch) {
      await this.interactiveSendWithTemplate(templateMatch);
      return true;
    }

    // Natural language fallback
    if (trimmed.length > 0) {
      await this.handleNaturalLanguage(trimmed);
      return true;
    }

    return true;
  }

  // ============================================
  // DATA DISPLAY
  // ============================================

  /**
   * Show templates list
   */
  private async showTemplates(): Promise<void> {
    const spinner = renderer.spinner('Loading templates...');
    try {
      const response = await api.get('/agents/email/templates');
      spinner.stop();

      if (response.success && response.data?.templates?.length > 0) {
        const templates: EmailTemplate[] = response.data.templates;
        renderer.section('📄 Email Templates');

        const rows = templates.map((t) => [
          colors.primary(t.name),
          t.subject.substring(0, 40) + (t.subject.length > 40 ? '...' : ''),
          t.type,
          new Date(t.updatedAt).toLocaleDateString(),
        ]);
        renderer.table(['Name', 'Subject', 'Type', 'Updated'], rows);
      } else {
        spinner.stop();
        renderer.info('No templates found. Create templates from the web dashboard.');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  /**
   * Show contact groups
   */
  private async showGroups(): Promise<void> {
    const spinner = renderer.spinner('Loading groups...');
    try {
      const response = await api.get('/agents/email/groups');
      spinner.stop();

      if (response.success && response.data?.groups?.length > 0) {
        const groups: ContactGroup[] = response.data.groups;
        renderer.section('👥 Contact Groups');

        const rows = groups.map((g) => [
          colors.primary(g.name),
          String(g.contactCount),
        ]);
        renderer.table(['Group Name', 'Contacts'], rows);
      } else {
        spinner.stop();
        renderer.info('No contact groups found. Import contacts from the web dashboard.');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  /**
   * Show SMTP accounts
   */
  private async showSmtp(): Promise<void> {
    const spinner = renderer.spinner('Loading SMTP accounts...');
    try {
      const response = await api.get('/agents/email/smtp');
      spinner.stop();

      if (response.success && response.data?.smtpAccounts?.length > 0) {
        const accounts: SmtpAccount[] = response.data.smtpAccounts;
        renderer.section('📮 SMTP Accounts');

        const rows = accounts.map((s) => [
          colors.primary(s.name) + (s.isDefault ? colors.success(' ★') : ''),
          `${s.host}:${s.port}`,
          s.provider,
          s.fromEmail,
          renderer.statusBadge(s.isEnabled ? 'ACTIVE' : 'DISABLED'),
        ]);
        renderer.table(['Name', 'Server', 'Provider', 'From', 'Status'], rows);
      } else {
        spinner.stop();
        renderer.info('No SMTP accounts found. Add SMTP from the web dashboard.');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  /**
   * Show campaigns
   */
  private async showCampaigns(): Promise<void> {
    const spinner = renderer.spinner('Loading campaigns...');
    try {
      const response = await api.get('/agents/email/campaigns');
      spinner.stop();

      if (response.success && response.data?.campaigns?.length > 0) {
        const campaigns: Campaign[] = response.data.campaigns;
        renderer.section('📧 Campaigns');

        const rows = campaigns.map((c) => [
          colors.primary(c.name),
          renderer.statusBadge(c.status),
          `${c.sent}/${c.totalRecipients}`,
          c.template?.name || '—',
          new Date(c.createdAt).toLocaleDateString(),
        ]);
        renderer.table(['Campaign', 'Status', 'Sent/Total', 'Template', 'Created'], rows);
      } else {
        spinner.stop();
        renderer.info('No campaigns found.');
      }
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }

  // ============================================
  // INTERACTIVE SEND FLOW
  // ============================================

  /**
   * Full interactive send flow: Template → Group → SMTP → Confirm → Execute
   */
  private async interactiveSend(): Promise<void> {
    const spinner = renderer.spinner('Loading data...');

    try {
      // Fetch all data in parallel
      const [templatesRes, groupsRes, smtpRes] = await Promise.all([
        api.get('/agents/email/templates'),
        api.get('/agents/email/groups'),
        api.get('/agents/email/smtp'),
      ]);
      spinner.stop();

      const templates: EmailTemplate[] = templatesRes.data?.templates || [];
      const groups: ContactGroup[] = groupsRes.data?.groups || [];
      const smtpAccounts: SmtpAccount[] = smtpRes.data?.smtpAccounts || [];

      if (templates.length === 0) { renderer.error('No templates available. Create one first.'); return; }
      if (groups.length === 0) { renderer.error('No contact groups available. Import contacts first.'); return; }
      if (smtpAccounts.length === 0) { renderer.error('No SMTP accounts available. Add one first.'); return; }

      // Step 1: Select Template
      const { templateId } = await inquirer.prompt([{
        type: 'list',
        name: 'templateId',
        message: 'Select Template:',
        choices: templates.map((t) => ({
          name: `${t.name}  ${colors.muted(`— ${t.subject}`)}`,
          value: t.id,
          short: t.name,
        })),
      }]);

      const selectedTemplate = templates.find((t) => t.id === templateId)!;

      // Step 2: Select Group
      const { groupName } = await inquirer.prompt([{
        type: 'list',
        name: 'groupName',
        message: 'Select Group:',
        choices: groups.map((g) => ({
          name: `${g.name}  ${colors.muted(`(${g.contactCount} contacts)`)}`,
          value: g.name,
          short: g.name,
        })),
      }]);

      const selectedGroup = groups.find((g) => g.name === groupName)!;

      // Step 3: Select SMTP
      const { smtpAccountId } = await inquirer.prompt([{
        type: 'list',
        name: 'smtpAccountId',
        message: 'Select SMTP:',
        choices: smtpAccounts.map((s) => ({
          name: `${s.name}  ${colors.muted(`(${s.host}:${s.port})`)}${s.isDefault ? colors.success(' ★ Default') : ''}`,
          value: s.id,
          short: s.name,
        })),
      }]);

      const selectedSmtp = smtpAccounts.find((s) => s.id === smtpAccountId)!;

      // Step 4: Show Summary & Confirm
      renderer.blank();
      renderer.box(
        [
          `${colors.muted('Template')}  : ${colors.primary(selectedTemplate.name)}`,
          `${colors.muted('Subject')}   : ${selectedTemplate.subject}`,
          `${colors.muted('Group')}     : ${colors.primary(selectedGroup.name)} (${selectedGroup.contactCount} contacts)`,
          `${colors.muted('SMTP')}      : ${colors.primary(selectedSmtp.name)} (${selectedSmtp.host})`,
          `${colors.muted('Action')}    : Send Email Campaign`,
        ].join('\n'),
        'Execution Summary'
      );
      renderer.blank();

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Confirm execution?',
        default: true,
      }]);

      if (!confirm) {
        renderer.info('Cancelled.');
        return;
      }

      // Step 5: Execute
      const execSpinner = renderer.spinner('Sending campaign...');
      const result = await this.executeAction('send', {
        templateId,
        groupName,
        smtpAccountId,
      });
      execSpinner.stop();

      this.displayResult(result);
    } catch (error: any) {
      spinner.stop();
      renderer.error(error.message);
    }
  }

  /**
   * Interactive send flow starting with a pre-matched template
   */
  private async interactiveSendWithTemplate(template: EmailTemplate): Promise<void> {
    renderer.success(`Template detected: ${template.name}`);
    renderer.blank();

    const spinner = renderer.spinner('Loading groups and SMTP...');
    try {
      const [groupsRes, smtpRes] = await Promise.all([
        api.get('/agents/email/groups'),
        api.get('/agents/email/smtp'),
      ]);
      spinner.stop();

      const groups: ContactGroup[] = groupsRes.data?.groups || [];
      const smtpAccounts: SmtpAccount[] = smtpRes.data?.smtpAccounts || [];

      if (groups.length === 0) { renderer.error('No contact groups available.'); return; }
      if (smtpAccounts.length === 0) { renderer.error('No SMTP accounts available.'); return; }

      // Select Group
      const { groupName } = await inquirer.prompt([{
        type: 'list',
        name: 'groupName',
        message: 'Select Group:',
        choices: groups.map((g) => ({
          name: `${g.name}  ${colors.muted(`(${g.contactCount} contacts)`)}`,
          value: g.name,
          short: g.name,
        })),
      }]);

      const selectedGroup = groups.find((g) => g.name === groupName)!;

      // Select SMTP
      const { smtpAccountId } = await inquirer.prompt([{
        type: 'list',
        name: 'smtpAccountId',
        message: 'Select SMTP:',
        choices: smtpAccounts.map((s) => ({
          name: `${s.name}  ${colors.muted(`(${s.host}:${s.port})`)}${s.isDefault ? colors.success(' ★ Default') : ''}`,
          value: s.id,
          short: s.name,
        })),
      }]);

      const selectedSmtp = smtpAccounts.find((s) => s.id === smtpAccountId)!;

      // Summary & Confirm
      renderer.blank();
      renderer.box(
        [
          `${colors.muted('Template')}  : ${colors.primary(template.name)}`,
          `${colors.muted('Subject')}   : ${template.subject}`,
          `${colors.muted('Group')}     : ${colors.primary(selectedGroup.name)} (${selectedGroup.contactCount} contacts)`,
          `${colors.muted('SMTP')}      : ${colors.primary(selectedSmtp.name)} (${selectedSmtp.host})`,
          `${colors.muted('Action')}    : Send Email Campaign`,
        ].join('\n'),
        'Execution Summary'
      );
      renderer.blank();

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Confirm execution?',
        default: true,
      }]);

      if (!confirm) { renderer.info('Cancelled.'); return; }

      const execSpinner = renderer.spinner('Sending campaign...');
      const result = await this.executeAction('send', {
        templateId: template.id,
        groupName,
        smtpAccountId,
      });
      execSpinner.stop();
      this.displayResult(result);
    } catch (error: any) {
      spinner.stop();
      renderer.error(error.message);
    }
  }

  // ============================================
  // TEMPLATE MATCHING
  // ============================================

  /**
   * Check if user input matches a template name
   */
  private async matchTemplate(input: string): Promise<EmailTemplate | null> {
    if (input.startsWith('/')) return null; // Commands don't match templates

    try {
      const response = await api.get('/agents/email/templates');
      if (!response.success || !response.data?.templates) return null;

      const templates: EmailTemplate[] = response.data.templates;
      const lower = input.toLowerCase();

      // Exact match
      const exact = templates.find((t) => t.name.toLowerCase() === lower);
      if (exact) return exact;

      // Partial match (if the input is at least 3 chars)
      if (input.length >= 3) {
        const partial = templates.find((t) => t.name.toLowerCase().includes(lower));
        if (partial) return partial;
      }

      return null;
    } catch {
      return null;
    }
  }

  // ============================================
  // NATURAL LANGUAGE
  // ============================================

  /**
   * Handle natural language input
   */
  private async handleNaturalLanguage(input: string): Promise<void> {
    const spinner = renderer.spinner('Processing command...');
    try {
      const result = await this.executeNL(input);
      spinner.stop();
      this.displayResult(result);
    } catch (error: any) {
      spinner.fail(error.message);
    }
  }
}
