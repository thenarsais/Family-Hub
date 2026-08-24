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

  // Location (COPPA) — note: container keys like 'address'/'location' are
  // deliberately NOT listed here; only their sensitive sub-fields are, so the
  // scrubber recurses into the object and redacts street/postal_code/lat/long
  // individually while preserving non-sensitive siblings like city.
  'latitude',
  'longitude',
  'gps_coordinates',
  'street',
  'street_address',
  'postal_code',
  'zip_code',

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

type ErrorObject = Record<string, unknown>;

export function scrubbedError(error: ErrorObject): ErrorObject {
  return scrubRecursive(error, new WeakSet()) as ErrorObject;
}

function scrubRecursive(obj: unknown, visited: WeakSet<object>, depth = 0): unknown {
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
      if (isSensitiveKey(key) && value !== null && value !== undefined) {
        scrubbed[key] = '[REDACTED]';
        // Log warning in development
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`⚠️  PII Scrubbed: ${key}`);
        }
      } else if (isSensitiveKey(key)) {
        // Nothing to leak from a null/undefined value — preserve it as-is
        // rather than masking the fact that the field was empty.
        scrubbed[key] = value;
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
  // Only match when the field's own key name contains a sensitive term (e.g.
  // "user_password" contains "password"). Matching the reverse direction too
  // (a sensitive term containing the key) flags unrelated short keys like
  // "data" or "name" as sensitive just because they're substrings of
  // "database_url" or "child_name" — that wholesale-redacts entire nested
  // objects instead of the specific fields that are actually sensitive.
  return SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey));
}

/**
 * Sanitize an error for Sentry
 * Call this before sending any error to error tracking
 */
export function sanitizeForSentry(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return scrubbedError(error as ErrorObject);
  }

  return error;
}
