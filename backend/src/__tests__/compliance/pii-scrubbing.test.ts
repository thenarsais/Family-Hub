/**
 * Compliance Tests: PII Scrubbing in Error Handler
 * Tests that sensitive data is removed before sending to Sentry (COPPA Compliance - Decision 29)
 */

import { scrubbedError } from '../../utils/pii-scrubber';

describe('PII Scrubbing - COPPA Compliance (Decision 29)', () => {
  describe('Password Scrubbing', () => {
    it('should remove password from error context', () => {
      const error = {
        message: 'Authentication failed',
        context: {
          password: 'secret123',
          username: 'john@example.com',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.context.password).toBe('[REDACTED]');
      expect(scrubbed.context.username).toBe('john@example.com');
    });

    it('should remove nested passwords', () => {
      const error = {
        message: 'DB Error',
        extra: {
          user: {
            password: 'secret123',
            email: 'user@example.com',
          },
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.extra.user.password).toBe('[REDACTED]');
      expect(scrubbed.extra.user.email).toBe('user@example.com');
    });

    it('should remove password_confirm', () => {
      const error = {
        message: 'Validation error',
        data: {
          password: 'pass123',
          password_confirm: 'pass123',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.data.password).toBe('[REDACTED]');
      expect(scrubbed.data.password_confirm).toBe('[REDACTED]');
    });
  });

  describe('Token Scrubbing', () => {
    it('should remove authorization tokens', () => {
      const error = {
        message: 'Token error',
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIs...',
          'content-type': 'application/json',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.headers.authorization).toBe('[REDACTED]');
      expect(scrubbed.headers['content-type']).toBe('application/json');
    });

    it('should remove session tokens', () => {
      const error = {
        message: 'Session error',
        cookies: {
          session_token: 'abc123def456...',
          user_id: 'user-123',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.cookies.session_token).toBe('[REDACTED]');
      expect(scrubbed.cookies.user_id).toBe('user-123');
    });

    it('should remove access tokens', () => {
      const error = {
        message: 'API Error',
        context: {
          access_token: 'token123...',
          refresh_token: 'refresh456...',
          api_key: 'key789...',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.context.access_token).toBe('[REDACTED]');
      expect(scrubbed.context.refresh_token).toBe('[REDACTED]');
      expect(scrubbed.context.api_key).toBe('[REDACTED]');
    });
  });

  describe('Child PII Scrubbing', () => {
    it('should remove child names (COPPA)', () => {
      const error = {
        message: 'Child profile error',
        data: {
          child_name: 'Emma Johnson',
          child_id: 'child-123',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.data.child_name).toBe('[REDACTED]');
      expect(scrubbed.data.child_id).toBe('child-123');
    });

    it('should remove child birth dates (COPPA)', () => {
      const error = {
        message: 'Age verification error',
        context: {
          birth_date: '2015-03-21',
          age_verification: 'failed',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.context.birth_date).toBe('[REDACTED]');
      expect(scrubbed.context.age_verification).toBe('failed');
    });

    it('should remove parent email (PII)', () => {
      const error = {
        message: 'Registration error',
        data: {
          parent_email: 'parent@example.com',
          verification_code: '12345',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.data.parent_email).toBe('[REDACTED]');
      expect(scrubbed.data.verification_code).toBe('12345');
    });
  });

  describe('Location Data Scrubbing', () => {
    it('should remove GPS coordinates (COPPA)', () => {
      const error = {
        message: 'Location service error',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          city: 'San Francisco',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.location.latitude).toBe('[REDACTED]');
      expect(scrubbed.location.longitude).toBe('[REDACTED]');
      expect(scrubbed.location.city).toBe('San Francisco');
    });

    it('should remove street addresses (COPPA)', () => {
      const error = {
        message: 'Billing error',
        address: {
          street: '123 Main Street',
          city: 'Springfield',
          postal_code: '12345',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.address.street).toBe('[REDACTED]');
      expect(scrubbed.address.city).toBe('Springfield');
      expect(scrubbed.address.postal_code).toBe('[REDACTED]');
    });
  });

  describe('Phone and Billing Data Scrubbing', () => {
    it('should remove phone numbers', () => {
      const error = {
        message: 'Contact error',
        data: {
          phone: '555-123-4567',
          email: 'user@example.com',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.data.phone).toBe('[REDACTED]');
      expect(scrubbed.data.email).toBe('[REDACTED]');
    });

    it('should remove credit card data (never log this)', () => {
      const error = {
        message: 'Payment error',
        payment: {
          card_number: '4532015112830366',
          cvv: '123',
          cardholder: 'John Doe',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.payment.card_number).toBe('[REDACTED]');
      expect(scrubbed.payment.cvv).toBe('[REDACTED]');
      expect(scrubbed.payment.cardholder).toBe('[REDACTED]');
    });

    it('should remove SSN', () => {
      const error = {
        message: 'Verification error',
        verification: {
          ssn: '123-45-6789',
          verified: false,
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.verification.ssn).toBe('[REDACTED]');
      expect(scrubbed.verification.verified).toBe(false);
    });
  });

  describe('Deep Nesting', () => {
    it('should scrub PII at all nesting levels', () => {
      const error = {
        message: 'Deep error',
        user: {
          profile: {
            credentials: {
              password: 'secret123',
              api_key: 'key456',
            },
            contact: {
              phone: '555-1234',
              email: 'user@example.com',
            },
          },
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.user.profile.credentials.password).toBe('[REDACTED]');
      expect(scrubbed.user.profile.credentials.api_key).toBe('[REDACTED]');
      expect(scrubbed.user.profile.contact.phone).toBe('[REDACTED]');
      expect(scrubbed.user.profile.contact.email).toBe('[REDACTED]');
    });
  });

  describe('Array Scrubbing', () => {
    it('should scrub PII in arrays', () => {
      const error = {
        message: 'Multiple errors',
        users: [
          { name: 'Alice', password: 'pass1' },
          { name: 'Bob', password: 'pass2' },
        ],
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.users[0].password).toBe('[REDACTED]');
      expect(scrubbed.users[1].password).toBe('[REDACTED]');
      expect(scrubbed.users[0].name).toBe('Alice');
      expect(scrubbed.users[1].name).toBe('Bob');
    });
  });

  describe('Edge Cases', () => {
    it('should not scrub null or undefined values', () => {
      const error = {
        message: 'Error',
        data: {
          password: null,
          api_key: undefined,
          value: 'something',
        },
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.data.password).toBe(null);
      expect(scrubbed.data.api_key).toBe(undefined);
      expect(scrubbed.data.value).toBe('something');
    });

    it('should handle empty objects', () => {
      const error = {
        message: 'Error',
        data: {},
      };

      const scrubbed = scrubbedError(error);
      expect(scrubbed.data).toEqual({});
    });

    it('should handle circular references gracefully', () => {
      const error: any = {
        message: 'Error',
        data: {
          password: 'secret',
          value: 'test',
        },
      };
      error.data.self = error.data; // Create circular ref

      expect(() => scrubbedError(error)).not.toThrow();
    });
  });

  describe('Audit Logging', () => {
    it('should log when PII is scrubbed', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const error = {
        message: 'Error with password',
        password: 'secret123',
      };

      scrubbedError(error);

      // Should have warned about scrubbing
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
