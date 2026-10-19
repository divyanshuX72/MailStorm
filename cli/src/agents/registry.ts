/**
 * CLI — Client-Side Agent Registry
 * Fetches available agents from the backend and caches them
 */

import { api } from '../core/api-client';
import { AgentManifest } from '../core/types';

class ClientAgentRegistry {
  private agents: AgentManifest[] = [];
  private lastFetch: number = 0;
  private cacheTTL: number = 60000; // 1 minute

  /**
   * Fetch agents from the backend API
   */
  async fetch(): Promise<AgentManifest[]> {
    const now = Date.now();
    if (this.agents.length > 0 && now - this.lastFetch < this.cacheTTL) {
      return this.agents;
    }

    const response = await api.get('/agents');
    if (response.success && response.data?.agents) {
      this.agents = response.data.agents;
      this.lastFetch = now;
    }

    return this.agents;
  }

  /**
   * Get a specific agent by ID
   */
  async get(agentId: string): Promise<AgentManifest | undefined> {
    const agents = await this.fetch();
    return agents.find((a) => a.id === agentId);
  }

  /**
   * Get detailed agent info (includes commands)
   */
  async getDetailed(agentId: string): Promise<AgentManifest | undefined> {
    const response = await api.get(`/agents/${agentId}`);
    if (response.success && response.data) {
      return response.data;
    }
    return undefined;
  }

  /**
   * List all agents
   */
  async list(): Promise<AgentManifest[]> {
    return this.fetch();
  }

  /**
   * List active agents
   */
  async listActive(): Promise<AgentManifest[]> {
    const agents = await this.fetch();
    return agents.filter((a) => a.status === 'active');
  }

  /**
   * Get agent IDs
   */
  async ids(): Promise<string[]> {
    const agents = await this.fetch();
    return agents.map((a) => a.id);
  }

  /**
   * Clear cache
   */
  invalidate(): void {
    this.agents = [];
    this.lastFetch = 0;
  }
}

export const clientAgentRegistry = new ClientAgentRegistry();
