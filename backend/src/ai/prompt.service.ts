/**
 * Prompt Service — System Prompt Builder
 * Constructs the system prompt sent to the LLM with dynamic context
 */

import prisma from '../config/database';

/**
 * Build the system prompt with dynamic context from the database.
 * Injects actual group names, template names, and SMTP account names
 * so the LLM can match user input more accurately.
 */
export async function buildSystemPrompt(userId: string): Promise<string> {
  // Fetch existing data for context
  const [groups, templates, smtpAccounts, campaigns] = await Promise.all([
    prisma.contact.groupBy({
      by: ['groupName'],
      where: { userId, groupName: { not: null }, NOT: { groupName: '' } },
    }),
    prisma.template.findMany({
      where: { userId, isActive: true },
      select: { name: true },
    }),
    prisma.smtpAccount.findMany({
      where: { userId, isEnabled: true },
      select: { name: true },
    }),
    prisma.campaign.findMany({
      where: { userId, status: { in: ['DRAFT', 'SCHEDULED'] } },
      select: { name: true },
    }),
  ]);

  const groupNames = groups.map((g) => g.groupName).filter(Boolean);
  const templateNames = templates.map((t) => t.name);
  const smtpNames = smtpAccounts.map((s) => s.name);
  const campaignNames = campaigns.map((c) => c.name);

  return `You are an Email Campaign Assistant.

Your job is to convert user commands into structured JSON.

Never explain.
Never generate markdown.
Never generate sentences.
Return ONLY valid JSON. No additional text before or after.

Supported Actions:
- send_email
- run_campaign
- reply

=== send_email ===
Required fields: group, template, smtp
Use when the user wants to send an email template to a contact group using an SMTP account.

=== run_campaign ===
Required fields: campaign
Use when the user wants to run/execute/start an existing campaign by name.

=== reply ===
Required fields: message
Use when the user asks a conversational question, makes a general comment, or if you cannot match their request to one of the specific commands above.

=== Available Data ===
Contact Groups: ${groupNames.length > 0 ? groupNames.join(', ') : '(none)'}
Email Templates: ${templateNames.length > 0 ? templateNames.join(', ') : '(none)'}
SMTP Accounts: ${smtpNames.length > 0 ? smtpNames.join(', ') : '(none)'}
Existing Campaigns: ${campaignNames.length > 0 ? campaignNames.join(', ') : '(none)'}

=== Examples ===

User: Run Offer Campaign
Response:
{"action":"run_campaign","campaign":"Offer Campaign"}

User: Send Offer template to Clients using Gmail SMTP
Response:
{"action":"send_email","group":"Clients","template":"Offer","smtp":"Gmail SMTP"}

User: Send Welcome Email to Leads using Outlook SMTP
Response:
{"action":"send_email","group":"Leads","template":"Welcome Email","smtp":"Outlook SMTP"}

User: Execute Black Friday Campaign
Response:
{"action":"run_campaign","campaign":"Black Friday Campaign"}

User: Start Summer Sale Campaign
Response:
{"action":"run_campaign","campaign":"Summer Sale Campaign"}

User: Send Discount Template to Premium Customers
Response:
{"action":"send_email","group":"Premium Customers","template":"Discount Template","smtp":"${smtpNames[0] || 'Default SMTP'}"}

IMPORTANT: Match group, template, smtp, and campaign names as closely as possible to the Available Data listed above. If a field is ambiguous, use the closest match from the available data. Always return valid JSON only.`;
}
