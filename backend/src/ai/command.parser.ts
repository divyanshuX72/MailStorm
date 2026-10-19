/**
 * Command Parser — AI Response Parsing & Type Definitions
 * Extracts and validates structured JSON from LLM responses
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SendEmailCommand {
  action: 'send_email';
  group: string;
  template: string;
  smtp: string;
}

export interface RunCampaignCommand {
  action: 'run_campaign';
  campaign: string;
}

export interface ReplyCommand {
  action: 'reply';
  message: string;
}

export type AICommand = SendEmailCommand | RunCampaignCommand | ReplyCommand;

export interface ParseResult {
  success: boolean;
  command?: AICommand;
  error?: string;
}

// ============================================
// PARSER
// ============================================

/**
 * Extract JSON from raw LLM output.
 * Handles cases where the LLM wraps JSON in markdown code fences.
 */
function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return cleaned;
}

/**
 * Parse and validate the raw LLM response into a typed AICommand.
 */
export function parseAIResponse(raw: string): ParseResult {
  const jsonStr = extractJson(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { success: false, error: 'Invalid JSON returned by AI' };
  }

  // Validate action field
  if (!parsed.action || typeof parsed.action !== 'string') {
    return { success: false, error: 'Missing or invalid "action" field' };
  }

  const action = parsed.action.toLowerCase().trim();

  if (action === 'send_email') {
    if (!parsed.group || typeof parsed.group !== 'string') {
      return { success: false, error: 'Missing "group" field for send_email action' };
    }
    if (!parsed.template || typeof parsed.template !== 'string') {
      return { success: false, error: 'Missing "template" field for send_email action' };
    }
    if (!parsed.smtp || typeof parsed.smtp !== 'string') {
      return { success: false, error: 'Missing "smtp" field for send_email action' };
    }

    return {
      success: true,
      command: {
        action: 'send_email',
        group: parsed.group.trim(),
        template: parsed.template.trim(),
        smtp: parsed.smtp.trim(),
      },
    };
  }

  if (action === 'run_campaign') {
    if (!parsed.campaign || typeof parsed.campaign !== 'string') {
      return { success: false, error: 'Missing "campaign" field for run_campaign action' };
    }

    return {
      success: true,
      command: {
        action: 'run_campaign',
        campaign: parsed.campaign.trim(),
      },
    };
  }

  if (action === 'reply') {
    return {
      success: true,
      command: {
        action: 'reply',
        message: parsed.message || 'I could not understand that.',
      },
    };
  }

  return { success: false, error: `Unsupported action: "${parsed.action}"` };
}
