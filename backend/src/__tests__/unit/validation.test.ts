/**
 * Unit Tests: Validation Middleware
 */

import { validateRequest } from '../../middleware/validation';

describe('Validation Middleware', () => {
  describe('String validation', () => {
    it('should validate required string', async () => {
      const schema = {
        name: { field: 'name', type: 'string' as const, required: true }
      };

      const result = await validateRequest({ name: 'John' }, schema);
      expect(result.valid).toBe(true);
      expect(result.data?.name).toBe('John');
    });

    it('should reject empty required string', async () => {
      const schema = {
        name: { field: 'name', type: 'string' as const, required: true }
      };

      const result = await validateRequest({ name: '' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors?.name).toBeDefined();
    });

    it('should enforce minimum length', async () => {
      const schema = {
        password: {
          field: 'password',
          type: 'string' as const,
          required: true,
          min: 8
        }
      };

      const result = await validateRequest({ password: 'short' }, schema);
      expect(result.valid).toBe(false);
    });

    it('should enforce maximum length', async () => {
      const schema = {
        comment: {
          field: 'comment',
          type: 'string' as const,
          required: true,
          max: 100
        }
      };

      const result = await validateRequest(
        { comment: 'a'.repeat(101) },
        schema
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('Email validation', () => {
    it('should validate correct email', async () => {
      const schema = {
        email: { field: 'email', type: 'email' as const, required: true }
      };

      const result = await validateRequest(
        { email: 'test@example.com' },
        schema
      );
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email', async () => {
      const schema = {
        email: { field: 'email', type: 'email' as const, required: true }
      };

      const result = await validateRequest({ email: 'not-an-email' }, schema);
      expect(result.valid).toBe(false);
    });
  });

  describe('Number validation', () => {
    it('should validate number', async () => {
      const schema = {
        age: { field: 'age', type: 'number' as const, required: true }
      };

      const result = await validateRequest({ age: 25 }, schema);
      expect(result.valid).toBe(true);
    });

    it('should enforce minimum value', async () => {
      const schema = {
        age: {
          field: 'age',
          type: 'number' as const,
          required: true,
          min: 18
        }
      };

      const result = await validateRequest({ age: 10 }, schema);
      expect(result.valid).toBe(false);
    });

    it('should enforce maximum value', async () => {
      const schema = {
        rating: {
          field: 'rating',
          type: 'number' as const,
          required: true,
          max: 5
        }
      };

      const result = await validateRequest({ rating: 10 }, schema);
      expect(result.valid).toBe(false);
    });
  });

  describe('Optional fields', () => {
    it('should allow missing optional field', async () => {
      const schema = {
        nickname: {
          field: 'nickname',
          type: 'string' as const,
          required: false
        }
      };

      const result = await validateRequest({}, schema);
      expect(result.valid).toBe(true);
    });

    it('should validate optional field if provided', async () => {
      const schema = {
        nickname: {
          field: 'nickname',
          type: 'string' as const,
          required: false,
          min: 3
        }
      };

      const result = await validateRequest({ nickname: 'ab' }, schema);
      expect(result.valid).toBe(false);
    });
  });

  describe('Input sanitization', () => {
    it('should sanitize XSS attempts', async () => {
      const schema = {
        comment: { field: 'comment', type: 'string' as const, required: true }
      };

      const result = await validateRequest(
        { comment: '<script>alert("xss")</script>' },
        schema
      );
      expect(result.valid).toBe(true);
      expect(result.data?.comment).not.toContain('<script>');
    });

    it('should trim whitespace', async () => {
      const schema = {
        name: { field: 'name', type: 'string' as const, required: true }
      };

      const result = await validateRequest({ name: '  John  ' }, schema);
      expect(result.valid).toBe(true);
      expect(result.data?.name).toBe('John');
    });
  });
});
