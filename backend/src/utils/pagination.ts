/**
 * Pagination Utility
 * Standardized pagination handling for all list endpoints
 */

import { PAGINATION } from './constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse and validate pagination query parameters
 */
export function parsePagination(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  let page = Number(query.page) || PAGINATION.DEFAULT_PAGE;
  let limit = Number(query.limit) || PAGINATION.DEFAULT_LIMIT;

  // Enforce bounds
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Generate pagination metadata from results
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse sort parameters with validation against allowed fields
 */
export function parseSort(
  sortBy: string | undefined,
  sortOrder: string | undefined,
  allowedFields: string[]
): { field: string; order: 'asc' | 'desc' } {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder === 'asc' ? 'asc' : 'desc';
  return { field, order };
}
