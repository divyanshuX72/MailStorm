/**
 * Template Service — Business Logic
 */

import { templateRepository } from '../repositories/template.repository';
import { AppError, replaceTemplateVariables, sanitizeHtml } from '../utils/helpers';
import { parsePagination, createPaginationMeta, parseSort } from '../utils/pagination';
import { TemplateInput, PaginatedResponse } from '../types';
import { Template, Prisma } from '@prisma/client';
import prisma from '../config/database';
import logger from '../utils/logger';

class TemplateService {
  /**
   * Create a new template
   */
  async create(userId: string, input: TemplateInput): Promise<Template> {
    // Extract variables from content
    const variables = this.extractVariables(input.htmlContent || input.textContent || '');

    const template = await templateRepository.create({
      name: input.name,
      subject: input.subject,
      htmlContent: input.htmlContent ? sanitizeHtml(input.htmlContent) : null,
      textContent: input.textContent,
      type: input.type,
      variables: JSON.stringify(variables),
      user: { connect: { id: userId } },
    });

    await this.logActivity(userId, 'CREATE', template.id);
    return template;
  }

  /**
   * Get all templates with pagination
   */
  async getAll(userId: string, query: any): Promise<PaginatedResponse<Template>> {
    const { page, limit, skip } = parsePagination(query);
    const { field, order } = parseSort(query.sortBy, query.sortOrder, [
      'name', 'type', 'createdAt', 'updatedAt',
    ]);

    const where: Prisma.TemplateWhereInput = { userId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { subject: { contains: query.search } },
      ];
    }
    if (query.type) where.type = query.type;

    const { templates, total } = await templateRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [field]: order },
    });

    return {
      data: templates,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get a single template
   */
  async getById(id: string, userId: string): Promise<Template> {
    const template = await templateRepository.findById(id);
    if (!template || template.userId !== userId) {
      throw new AppError('Template not found', 404);
    }
    return template;
  }

  /**
   * Update a template
   */
  async update(id: string, userId: string, input: Partial<TemplateInput>): Promise<Template> {
    const template = await templateRepository.findById(id);
    if (!template || template.userId !== userId) {
      throw new AppError('Template not found', 404);
    }

    const updateData: any = { ...input };

    if (input.htmlContent) {
      updateData.htmlContent = sanitizeHtml(input.htmlContent);
    }

    // Re-extract variables if content changed
    if (input.htmlContent || input.textContent) {
      const content = input.htmlContent || input.textContent || template.htmlContent || template.textContent || '';
      updateData.variables = JSON.stringify(this.extractVariables(content));
    }

    const updated = await templateRepository.update(id, updateData);
    await this.logActivity(userId, 'UPDATE', id);
    return updated;
  }

  /**
   * Delete a template
   */
  async delete(id: string, userId: string): Promise<void> {
    const template = await templateRepository.findById(id);
    if (!template || template.userId !== userId) {
      throw new AppError('Template not found', 404);
    }

    await templateRepository.delete(id);
    await this.logActivity(userId, 'DELETE', id);
  }

  /**
   * Preview a template with sample data
   */
  preview(htmlContent: string, variables: Record<string, string> = {}): string {
    const sampleData: Record<string, string> = {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      phone: '+1234567890',
      unsubscribeLink: '#',
      ...variables,
    };

    return replaceTemplateVariables(htmlContent, sampleData);
  }

  /**
   * Extract {{variable}} patterns from template content
   */
  private extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  private async logActivity(userId: string, action: string, entityId: string): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: { userId, action, entity: 'Template', entityId },
      });
    } catch { /* silent */ }
  }
}

export const templateService = new TemplateService();
