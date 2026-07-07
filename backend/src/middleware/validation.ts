/**
 * Request Validation Middleware
 * Validates and sanitizes incoming requests
 */

import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | Promise<boolean>;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate ISO date format
 */
function isValidDate(date: string): boolean {
  try {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  } catch {
    return false;
  }
}

/**
 * Sanitize string input (remove dangerous characters)
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate a single field against a rule
 */
async function validateField(
  value: any,
  rule: ValidationRule
): Promise<{ valid: boolean; error?: string }> {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      valid: false,
      error: rule.message || `${rule.field} is required`
    };
  }

  // Skip validation if value is not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: rule.message || `${rule.field} must be a string` };
      }

      // Check length
      if (rule.min !== undefined && value.length < rule.min) {
        return {
          valid: false,
          error: rule.message || `${rule.field} must be at least ${rule.min} characters`
        };
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return {
          valid: false,
          error: rule.message || `${rule.field} must be at most ${rule.max} characters`
        };
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        return {
          valid: false,
          error: rule.message || `${rule.field} format is invalid`
        };
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: rule.message || `${rule.field} must be a number` };
      }

      if (rule.min !== undefined && value < rule.min) {
        return {
          valid: false,
          error: rule.message || `${rule.field} must be at least ${rule.min}`
        };
      }
      if (rule.max !== undefined && value > rule.max) {
        return {
          valid: false,
          error: rule.message || `${rule.field} must be at most ${rule.max}`
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: rule.message || `${rule.field} must be a boolean` };
      }
      break;

    case 'email':
      if (!isValidEmail(value)) {
        return { valid: false, error: rule.message || `${rule.field} must be a valid email` };
      }
      break;

    case 'uuid':
      if (!isValidUUID(value)) {
        return { valid: false, error: rule.message || `${rule.field} must be a valid UUID` };
      }
      break;

    case 'date':
      if (!isValidDate(value)) {
        return { valid: false, error: rule.message || `${rule.field} must be a valid ISO date` };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { valid: false, error: rule.message || `${rule.field} must be an array` };
      }

      if (rule.min !== undefined && value.length < rule.min) {
        return {
          valid: false,
          error: rule.message || `${rule.field} must have at least ${rule.min} items`
        };
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return {
          valid: false,
          error: rule.message || `${rule.field} must have at most ${rule.max} items`
        };
      }
      break;
  }

  // Custom validation
  if (rule.custom) {
    const customValid = await rule.custom(value);
    if (!customValid) {
      return {
        valid: false,
        error: rule.message || `${rule.field} validation failed`
      };
    }
  }

  return { valid: true };
}

/**
 * Create validation middleware for a schema
 */
export function validate(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};
    const sanitized: any = {};

    // Validate each field in schema
    for (const [field, rule] of Object.entries(schema)) {
      const value = req.body[field];

      // Sanitize strings
      if (rule.type === 'string' && typeof value === 'string') {
        sanitized[field] = sanitizeString(value);
      } else {
        sanitized[field] = value;
      }

      // Validate
      const validation = await validateField(value, rule);
      if (!validation.valid) {
        errors[field] = validation.error || 'Invalid value';
      }
    }

    // If validation failed, return errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors
      });
    }

    // Replace body with sanitized values
    req.body = sanitized;
    next();
  };
}

/**
 * Quick validation for a single request
 */
export async function validateRequest(
  data: any,
  schema: ValidationSchema
): Promise<{ valid: boolean; errors?: Record<string, string>; data?: any }> {
  const errors: Record<string, string> = {};
  const sanitized: any = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    if (rule.type === 'string' && typeof value === 'string') {
      sanitized[field] = sanitizeString(value);
    } else {
      sanitized[field] = value;
    }

    const validation = await validateField(value, rule);
    if (!validation.valid) {
      errors[field] = validation.error || 'Invalid value';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: sanitized };
}

export default { validate, validateRequest };
