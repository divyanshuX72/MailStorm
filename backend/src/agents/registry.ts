/**
 * Agent Registry — Central Agent Discovery & Registration
 * Discovers and registers all available agents.
 * Agents register themselves by calling `registerAgent()`.
 */

import { AgentManifest } from './types';
import logger from '../utils/logger';

class AgentRegistry {
  private agents: Map<string, AgentManifest> = new Map();

  /**
   * Register an agent manifest
   */
  register(manifest: AgentManifest): void {
    if (this.agents.has(manifest.id)) {
      logger.warn(`Agent "${manifest.id}" is already registered. Overwriting.`);
    }
    this.agents.set(manifest.id, manifest);
    logger.info(`Agent registered: ${manifest.name} (${manifest.id}) v${manifest.version} [${manifest.status}]`);
  }

  /**
   * Get a specific agent by ID
   */
  get(agentId: string): AgentManifest | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all registered agents
   */
  list(): AgentManifest[] {
    return Array.from(this.agents.values());
  }

  /**
   * List only active agents
   */
  listActive(): AgentManifest[] {
    return this.list().filter((a) => a.status === 'active');
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get agent count
   */
  count(): number {
    return this.agents.size;
  }

  /**
   * Get all agent IDs
   */
  ids(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Search agents by partial name or ID
   */
  search(query: string): AgentManifest[] {
    const lower = query.toLowerCase();
    return this.list().filter(
      (a) =>
        a.id.toLowerCase().includes(lower) ||
        a.name.toLowerCase().includes(lower)
    );
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
