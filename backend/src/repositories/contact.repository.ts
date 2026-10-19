/**
 * Contact Repository — Database Access Layer
 */

import prisma from '../config/database';
import { Prisma, Contact } from '@prisma/client';

export class ContactRepository {
  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return prisma.contact.create({ data });
  }

  async createMany(data: Prisma.ContactCreateManyInput[]): Promise<number> {
    const result = await prisma.contact.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  async findById(id: string): Promise<Contact | null> {
    return prisma.contact.findUnique({ where: { id } });
  }

  async findByEmailAndUser(email: string, userId: string): Promise<Contact | null> {
    return prisma.contact.findUnique({
      where: { email_userId: { email, userId } },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.ContactWhereInput;
    orderBy?: Prisma.ContactOrderByWithRelationInput;
  }) {
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
      }),
      prisma.contact.count({ where: params.where }),
    ]);
    return { contacts, total };
  }

  async update(id: string, data: Prisma.ContactUpdateInput): Promise<Contact> {
    return prisma.contact.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Contact> {
    return prisma.contact.delete({ where: { id } });
  }

  async deleteMany(ids: string[], userId: string): Promise<number> {
    const result = await prisma.contact.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return result.count;
  }

  async getGroups(userId: string): Promise<{ name: string; count: number }[]> {
    const grouped = await prisma.contact.groupBy({
      by: ['groupName'],
      where: { 
        userId, 
        groupName: { not: null },
        NOT: { groupName: '' }
      },
      _count: { id: true },
      orderBy: { groupName: 'asc' },
    });
    return grouped.map((g) => ({ name: g.groupName as string, count: g._count.id }));
  }

  async resolveGroupName(userId: string, inputName: string): Promise<string> {
    const trimmed = inputName.trim();
    if (!trimmed) return '';
    
    // Attempt to find an existing group with the same name (case-insensitive in default MySQL)
    const existing = await prisma.contact.findFirst({
      where: { userId, groupName: trimmed },
      select: { groupName: true },
    });

    // If it exists, return the exact casing stored in DB. Otherwise, return the trimmed input.
    return existing?.groupName || trimmed;
  }

  async getTags(userId: string): Promise<string[]> {
    const contacts = await prisma.contact.findMany({
      where: { userId, tags: { not: null } },
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    contacts.forEach((c) => {
      try {
        const tags = JSON.parse(c.tags || '[]');
        tags.forEach((t: string) => tagSet.add(t));
      } catch { /* ignore parse errors */ }
    });

    return Array.from(tagSet).sort();
  }

  async findByGroup(userId: string, groupName: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { userId, groupName, status: 'ACTIVE', isSubscribed: true },
    });
  }

  async findByIds(ids: string[], userId: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { id: { in: ids }, userId, status: 'ACTIVE', isSubscribed: true },
    });
  }

  async count(userId: string, where?: Prisma.ContactWhereInput): Promise<number> {
    return prisma.contact.count({ where: { userId, ...where } });
  }
}

export const contactRepository = new ContactRepository();
