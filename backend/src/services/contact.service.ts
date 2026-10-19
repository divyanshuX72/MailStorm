/**
 * Contact Service — Business Logic
 * Handles contact management, import/export, and validation
 */

import { contactRepository } from '../repositories/contact.repository';
import { AppError, isValidEmail, parseJsonSafe } from '../utils/helpers';
import { parsePagination, createPaginationMeta, parseSort } from '../utils/pagination';
import { ContactInput, ContactImportResult, PaginatedResponse } from '../types';
import { Contact, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import prisma from '../config/database';
import * as XLSX from 'xlsx';
import fs from 'fs';

class ContactService {
  /**
   * Create a single contact
   */
  async create(userId: string, input: ContactInput): Promise<Contact> {
    // Check for duplicate
    const existing = await contactRepository.findByEmailAndUser(input.email, userId);
    if (existing) {
      throw new AppError('A contact with this email already exists', 409);
    }

    let resolvedGroupName = input.groupName;
    if (resolvedGroupName) {
      resolvedGroupName = await contactRepository.resolveGroupName(userId, resolvedGroupName);
    }

    const contact = await contactRepository.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      phone: input.phone,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      groupName: resolvedGroupName || null,
      source: 'manual',
      user: { connect: { id: userId } },
    });

    await this.logActivity(userId, 'CREATE', contact.id);
    return contact;
  }

  /**
   * Get paginated contacts with search and filters
   */
  async getAll(userId: string, query: any): Promise<PaginatedResponse<Contact>> {
    const { page, limit, skip } = parsePagination(query);
    const { field, order } = parseSort(query.sortBy, query.sortOrder, [
      'email', 'firstName', 'lastName', 'company', 'groupName', 'status', 'createdAt',
    ]);

    // Build where clause
    const where: Prisma.ContactWhereInput = { userId };

    // Search across email, name, company
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { company: { contains: query.search } },
      ];
    }

    if (query.groupName) where.groupName = query.groupName;
    if (query.status) where.status = query.status;

    // Tag filtering (search within JSON string)
    if (query.tag) {
      where.tags = { contains: query.tag };
    }

    const { contacts, total } = await contactRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [field]: order },
    });

    return {
      data: contacts,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get a single contact
   */
  async getById(id: string, userId: string): Promise<Contact> {
    const contact = await contactRepository.findById(id);
    if (!contact || contact.userId !== userId) {
      throw new AppError('Contact not found', 404);
    }
    return contact;
  }

  /**
   * Update a contact
   */
  async update(id: string, userId: string, input: Partial<ContactInput>): Promise<Contact> {
    const contact = await contactRepository.findById(id);
    if (!contact || contact.userId !== userId) {
      throw new AppError('Contact not found', 404);
    }

    // Check for duplicate email if email is being changed
    if (input.email && input.email !== contact.email) {
      const existing = await contactRepository.findByEmailAndUser(input.email, userId);
      if (existing) {
        throw new AppError('A contact with this email already exists', 409);
      }
    }

    const updateData: any = { ...input };
    if (input.tags) {
      updateData.tags = JSON.stringify(input.tags);
    }
    if (input.groupName !== undefined) {
      if (input.groupName) {
        updateData.groupName = await contactRepository.resolveGroupName(userId, input.groupName);
      } else {
        updateData.groupName = null;
      }
    }

    const updated = await contactRepository.update(id, updateData);
    await this.logActivity(userId, 'UPDATE', id);
    return updated;
  }

  /**
   * Delete a contact
   */
  async delete(id: string, userId: string): Promise<void> {
    const contact = await contactRepository.findById(id);
    if (!contact || contact.userId !== userId) {
      throw new AppError('Contact not found', 404);
    }

    await contactRepository.delete(id);
    await this.logActivity(userId, 'DELETE', id);
  }

  /**
   * Bulk delete contacts
   */
  async bulkDelete(ids: string[], userId: string): Promise<number> {
    const count = await contactRepository.deleteMany(ids, userId);
    await this.logActivity(userId, 'DELETE', `bulk:${count}`);
    return count;
  }

  /**
   * Import contacts from Excel or CSV file
   */
  async importContacts(userId: string, filePath: string, groupName?: string): Promise<ContactImportResult> {
    const result: ContactImportResult = {
      total: 0,
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: [],
    };

    try {
      // Read the file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      result.total = rows.length;

      // Process each row
      const validContacts: Prisma.ContactCreateManyInput[] = [];

      // Resolve the explicit groupName if provided
      let globalResolvedGroup = groupName;
      if (globalResolvedGroup) {
        globalResolvedGroup = await contactRepository.resolveGroupName(userId, globalResolvedGroup);
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Account for header row

        // Extract email (try common column names)
        const email = (
          row.email || row.Email || row.EMAIL ||
          row['E-mail'] || row['e-mail'] || row.mail || ''
        ).toString().trim().toLowerCase();

        if (!email || !isValidEmail(email)) {
          result.errors++;
          result.details.push({ row: rowNum, email: email || 'empty', error: 'Invalid email' });
          continue;
        }

        // Check for duplicate in current batch
        if (validContacts.some((c) => c.email === email)) {
          result.duplicates++;
          result.details.push({ row: rowNum, email, error: 'Duplicate in file' });
          continue;
        }

        let rowGroup = (row.group || row.Group || '').toString().trim() || null;
        if (rowGroup && !globalResolvedGroup) {
          rowGroup = await contactRepository.resolveGroupName(userId, rowGroup);
        }

        validContacts.push({
          email,
          firstName: (row.firstName || row.first_name || row['First Name'] || row.name || '').toString().trim() || null,
          lastName: (row.lastName || row.last_name || row['Last Name'] || '').toString().trim() || null,
          company: (row.company || row.Company || row.organization || '').toString().trim() || null,
          phone: (row.phone || row.Phone || row.mobile || '').toString().trim() || null,
          tags: row.tags ? JSON.stringify(row.tags.toString().split(',').map((t: string) => t.trim())) : null,
          groupName: globalResolvedGroup || rowGroup || null,
          source: 'import',
          userId,
        });
      }

      // Bulk insert (skip duplicates that already exist in DB)
      if (validContacts.length > 0) {
        const insertedCount = await contactRepository.createMany(validContacts);
        result.imported = insertedCount;
        result.duplicates += validContacts.length - insertedCount;
      }

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      await this.logActivity(userId, 'IMPORT', `imported:${result.imported}`);
      logger.info(`Contacts imported: ${result.imported}/${result.total}`, { userId });

      return result;
    } catch (error: any) {
      logger.error('Contact import failed', { error: error.message });
      throw new AppError(`Import failed: ${error.message}`, 400);
    }
  }

  /**
   * Get available contact groups
   */
  async getGroups(userId: string): Promise<{ name: string; count: number }[]> {
    return contactRepository.getGroups(userId);
  }

  /**
   * Get available tags
   */
  async getTags(userId: string): Promise<string[]> {
    return contactRepository.getTags(userId);
  }

  private async logActivity(userId: string, action: string, entityId: string): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: { userId, action, entity: 'Contact', entityId },
      });
    } catch { /* silent */ }
  }
}

export const contactService = new ContactService();
