/**
 * Main Agent — Service Layer
 * Orchestrator service that coordinates across agents
 */

import { agentRegistry } from '../registry';
import { AgentExecuteResult, AgentHistoryEntry } from '../types';
import prisma from '../../config/database';
import logger from '../../utils/logger';

class MainAgentService {
  /**
   * Get status of all agents
   */
  async getAllAgentStatuses(userId: string) {
    const agents = agentRegistry.list();

    const statuses = await Promise.all(
      agents.map(async (agent) => {
        const stats: Record<string, number | string> = {};

        // Fetch basic stats for active agents
        if (agent.id === 'email' && agent.status === 'active') {
          const [campaigns, templates, contacts] = await Promise.all([
            prisma.campaign.count({ where: { userId } }),
            prisma.template.count({ where: { userId, isActive: true } }),
            prisma.contact.count({ where: { userId, status: 'ACTIVE' } }),
          ]);
          stats.campaigns = campaigns;
          stats.templates = templates;
          stats.contacts = contacts;
        }

        return {
          agentId: agent.id,
          name: agent.name,
          icon: agent.icon,
          status: agent.status,
          version: agent.version,
          category: agent.category,
          commandCount: agent.commands.length,
          stats,
        };
      })
    );

    return statuses;
  }

  /**
   * Execute a plan command — creates a structured plan
   */
  async executePlan(userId: string, planDescription: string): Promise<AgentExecuteResult> {
    logger.info(`Main Agent: Plan requested by ${userId}: "${planDescription}"`);

    return {
      success: true,
      message: `Plan created: "${planDescription}"`,
      data: {
        plan: planDescription,
        steps: [
          { step: 1, description: 'Analyze requirements', status: 'pending' },
          { step: 2, description: 'Identify target agents', status: 'pending' },
          { step: 3, description: 'Execute tasks', status: 'pending' },
          { step: 4, description: 'Review results', status: 'pending' },
        ],
        availableAgents: agentRegistry.listActive().map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
        })),
      },
      meta: {
        agentId: 'main',
        action: 'plan',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute a delegate command — routes task to appropriate agent
   */
  async executeDelegate(
    userId: string,
    targetAgent: string,
    task: string
  ): Promise<AgentExecuteResult> {
    const agent = agentRegistry.get(targetAgent);

    if (!agent) {
      return {
        success: false,
        message: `Agent "${targetAgent}" not found`,
        error: `Available agents: ${agentRegistry.ids().join(', ')}`,
      };
    }

    if (agent.status !== 'active') {
      return {
        success: false,
        message: `Agent "${agent.name}" is not active (status: ${agent.status})`,
        error: 'Only active agents can receive delegated tasks',
      };
    }

    logger.info(`Main Agent: Delegating to ${targetAgent}: "${task}"`);

    return {
      success: true,
      message: `Task delegated to ${agent.name}: "${task}"`,
      data: {
        delegatedTo: { id: agent.id, name: agent.name, icon: agent.icon },
        task,
        status: 'delegated',
      },
      meta: {
        agentId: 'main',
        action: 'delegate',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get cross-agent history
   */
  async getHistory(userId: string, limit: number = 15): Promise<AgentHistoryEntry[]> {
    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        details: true,
        createdAt: true,
      },
    });

    return activities.map((a) => ({
      id: a.id,
      agentId: 'main',
      command: `${a.action} ${a.entity}`,
      action: a.action,
      result: 'success' as const,
      message: a.details || `${a.action} on ${a.entity}`,
      timestamp: a.createdAt.toISOString(),
    }));
  }
}

export const mainAgentService = new MainAgentService();
