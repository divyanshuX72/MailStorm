/**
 * Validation Middleware
 * Uses Zod schemas to validate request body, params, and query
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Create a validation middleware from Zod schemas
 * Validates body, params, and/or query independently
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
}

/**
 * Shorthand — validate only the request body
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Shorthand — validate only the request params
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}

/**
 * Shorthand — validate only the query string
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}
