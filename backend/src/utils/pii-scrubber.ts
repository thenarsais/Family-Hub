/**
 * PII Scrubber - COPPA Compliance (Decision 29)
 * Removes sensitive data from errors before sending to error tracking (Sentry)
 * Prevents accidental exposure of child/parent PII in error logs
 */

const SENSITIVE_KEYS = [
  // Authentication
  'password',
  'password_confirm',
  'access_token',
  'refresh_token',
  'api_key',
  'session_token',
  'authorization',
  'auth_token',

  // Personal Information (COPPA)
  'child_name',
  'child_first_name',
  'child_last_name',
  'birth_date',
  'date_of_birth',
  'dob',
  'parent_email',
  'parent_phone',
  'phone',
  'phone_number',
  'email',
  'email_address',

  // Location (COPPA)
  'latitude',
  'longitude',
  'gps_coordinates',
  'street',
  'street_address',
  'postal_code',
  'zip_code',
  'address',

  // Financial (PCI)
  'card_number',
  'credit_card',
  'cvv',
  'cvv2',
  'ssn',
  'social_security_number',
  'cardholder',
  'cardholder_name',
  'bank_account',
  'routing_number',

  // Database credentials
  'connection_string',
  'database_url',
  'db_password',
];

interface ErrorObject {
  [key: string]: any;
}

export function scrubbedError(error: ErrorObject): ErrorObject {
  return scrubRecursive(error, new WeakSet());
}

function scrubRecursive(obj: any, visited: WeakSet<object>, depth = 0): any {
  // Prevent infinite recursion on circular references
  if (depth > 20) return obj;
  if (obj === null || obj === undefined) return obj;

  const primitiveTypes = ['string', 'number', 'boolean'];
  if (primitiveTypes.includes(typeof obj)) return obj;

  // Handle circular references
  if (typeof obj === 'object') {
    if (visited.has(obj)) return '[Circular]';
    visited.add(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => scrubRecursive(item, visited, depth + 1));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const scrubbed: ErrorObject = {};

    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        scrubbed[key] = '[REDACTED]';
        // Log warning in development
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`⚠️  PII Scrubbed: ${key}`);
        }
      } else if (value !== null && value !== undefined && typeof value === 'object') {
        scrubbed[key] = scrubRecursive(value, visited, depth + 1);
      } else {
        scrubbed[key] = value;
      }
    }

    return scrubbed;
  }

  return obj;
}

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(
    (sensitiveKey) =>
      lowerKey === sensitiveKey ||
      lowerKey.includes(sensitiveKey) ||
      sensitiveKey.includes(lowerKey)
  );
}

/**
 * Sanitize an error for Sentry
 * Call this before sending any error to error tracking
 */
export function sanitizeForSentry(error: any): any {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return scrubbedError(error);
  }

  return error;
}
