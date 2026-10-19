/**
 * Template Repository — Database Access Layer
 */

import prisma from '../config/database';
import { Prisma, Template } from '@prisma/client';

export class TemplateRepository {
  async create(data: Prisma.TemplateCreateInput): Promise<Template> {
    return prisma.template.create({ data });
  }

  async findById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({ where: { id } });
  }

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.TemplateWhereInput;
    orderBy?: Prisma.TemplateOrderByWithRelationInput;
  }) {
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
      }),
      prisma.template.count({ where: params.where }),
    ]);
    return { templates, total };
  }

  async update(id: string, data: Prisma.TemplateUpdateInput): Promise<Template> {
    return prisma.template.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Template> {
    return prisma.template.delete({ where: { id } });
  }

  async count(userId: string): Promise<number> {
    return prisma.template.count({ where: { userId } });
  }
}

export const templateRepository = new TemplateRepository();
